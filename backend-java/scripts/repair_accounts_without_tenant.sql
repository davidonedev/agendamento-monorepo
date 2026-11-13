-- Reparo de contas sem estabelecimento (tenant) ou sem vínculo/papel.
--
-- DRY-RUN POR PADRÃO: tudo roda dentro de uma transação que termina em ROLLBACK.
--   Simular:  psql "$DATABASE_URL" -f scripts/repair_accounts_without_tenant.sql
--   Aplicar:  psql "$DATABASE_URL" -v apply=1 -f scripts/repair_accounts_without_tenant.sql
-- NÃO rode em produção sem revisar a saída do dry-run e sem backup.
--
-- O que corrige (só tenant_admin):
--   A) tenant_admin sem tenant_id, existindo tenant com o MESMO e-mail → vincula ao tenant existente.
--   B) tenant_admin sem tenant_id e sem tenant com o e-mail → cria um tenant (trial/basic) e vincula.
-- O que só reporta (exige decisão humana): tenants sem nenhum tenant_admin, profissionais sem vínculo,
-- usuários com tenant_id apontando para tenant inexistente (a FK impede, mas a checagem fica).

\if :{?apply}
\else
  \set apply 0
\endif

\echo '=== Modo:' :apply '(0 = dry-run/rollback, 1 = commit) ==='

BEGIN;

\echo '--- tenant_admin sem tenant_id (antes) ---'
SELECT id, email, name, created_at FROM users WHERE role = 'tenant_admin' AND tenant_id IS NULL ORDER BY created_at;

-- A) vincular a tenant existente com o mesmo e-mail
WITH linked AS (
    UPDATE users u
       SET tenant_id = t.id, updated_at = now()
      FROM tenants t
     WHERE u.role = 'tenant_admin' AND u.tenant_id IS NULL AND lower(t.email) = lower(u.email)
    RETURNING u.id, u.email, t.id AS tenant_id
)
SELECT 'A) vinculado a tenant existente' AS acao, * FROM linked;

-- B) criar tenant para quem continua sem vínculo
WITH orphans AS (
    SELECT id, name, email FROM users WHERE role = 'tenant_admin' AND tenant_id IS NULL
),
created AS (
    INSERT INTO tenants (id, slug, name, owner_name, email, status, plan, monthly_price)
    SELECT gen_random_uuid(),
           left(coalesce(nullif(regexp_replace(lower(split_part(o.email, '@', 1)), '[^a-z0-9]+', '-', 'g'), ''), 'negocio'), 50)
               || '-' || substr(md5(o.id::text), 1, 6),
           'Estabelecimento de ' || o.name, o.name, o.email, 'trial', 'basic', 0
      FROM orphans o
    RETURNING id, email
),
linked AS (
    UPDATE users u SET tenant_id = c.id, updated_at = now()
      FROM created c WHERE u.role = 'tenant_admin' AND u.tenant_id IS NULL AND lower(u.email) = lower(c.email)
    RETURNING u.id, u.email, u.tenant_id
)
SELECT 'B) tenant criado e vinculado' AS acao, * FROM linked;

\echo '--- tenant_admin sem tenant_id (depois; esperado: 0 linhas) ---'
SELECT id, email FROM users WHERE role = 'tenant_admin' AND tenant_id IS NULL;

\echo '--- SÓ REPORTA: tenants sem nenhum tenant_admin ---'
SELECT t.id, t.slug, t.email FROM tenants t
 WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.tenant_id = t.id AND u.role = 'tenant_admin');

\echo '--- SÓ REPORTA: profissionais (usuário) sem tenant ou sem professional_id válido ---'
SELECT u.id, u.email FROM users u
 WHERE u.role = 'professional'
   AND (u.tenant_id IS NULL OR u.professional_id IS NULL
        OR NOT EXISTS (SELECT 1 FROM professionals p WHERE p.id = u.professional_id AND p.tenant_id = u.tenant_id));

\if :apply
  \echo '>>> COMMIT'
  COMMIT;
\else
  \echo '>>> ROLLBACK (dry-run: nada foi alterado)'
  ROLLBACK;
\endif

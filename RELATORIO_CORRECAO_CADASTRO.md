# Relatório: correção do acesso de novos usuários ao painel (Nimbo)

Data: 2026-11-11. Ambiente de teste: só Postgres descartável (Testcontainers e um container temporário). O banco de dev e o backend/front que já estavam rodando (3333/5173) não foram tocados.

## 1. Causa raiz

**Problema 1: 500 em `GET /api/admin/clients`**
- `backend-java/src/main/java/com/agendepro/client/ClientRepository.java` (query `search`, antes das linhas 20-29): `(:search IS NULL OR LOWER(c.name) LIKE ...)`. Com busca nula (listagem sem filtro), o PostgreSQL tipa o parâmetro como `bytea` e falha com `function lower(bytea) does not exist`. O erro só aparece em PostgreSQL real.

**Problema 2: tela "Tenant não encontrado."**
- `frontend/src/context/TenantContext.tsx` (função `refresh` e o `if (!tenant && !loading)`): o `Promise.all` que carrega tenant, profissionais, serviços, clientes etc. rejeitava por causa do 500 de clients. O `finally` encerrava o loading com `tenant` nulo e a tela exibia "Tenant não encontrado.", mesmo com o tenant existindo.
- O cadastro **não** era a causa: `PublicService.registerBusiness` (`@Transactional`) já cria tenant e usuário `TENANT_ADMIN` de forma atômica. Confirmado também por teste de integração.
- Chamadas duplicadas: `<StrictMode>` em `frontend/src/main.tsx`. Só em desenvolvimento; mantido como está, por decisão sua.

**Achado extra (bloqueava toda a suíte e bancos novos):** `V2__account_recovery.sql` e `V4__add_account_recovery.sql` faziam o mesmo `ADD COLUMN token_version`, então um banco novo não migrava.

## 2. Queries corrigidas preventivamente
- `ClientRepository.search`: dividida em listagem sem filtro e busca com termo não nulo.
- `AppointmentRepository.hasConflict`: tinha `:excludeId IS NULL` (UUID nulo). Agora são `hasConflict` e `hasConflictExcluding`, escolhidas em `ScheduleService.checkConflict`.
- Demais repositórios revisados (`BlockedSlot`, `Professional`, `User`, `UserToken`, queries nativas de lembrete): não têm o padrão.

## 3. Arquivos alterados
| Arquivo | Mudança |
|---|---|
| `client/ClientRepository.java` | Sem `IS NULL`; `LIKE ... ESCAPE '!'` (`%`, `_`, `!` literais); `unaccent` + `LOWER` em nome e e-mail; telefone por `LIKE`; sempre filtrado por `tenant_id`; `search()` normaliza (trim, vazio vira listagem completa) |
| `client/ClientService.java` | Repassa o termo bruto ao repositório |
| `appointment/AppointmentRepository.java`, `ScheduleService.java` | Query com e sem `excludeId` |
| `common/GlobalExceptionHandler.java` | 500 devolve sempre "Erro interno do servidor"; o detalhe fica só no log (antes vazava SQL fora de `prod`) |
| `db/migration/V4__add_account_recovery.sql` | Idempotente (`IF NOT EXISTS` em coluna, 3 tabelas e 4 índices). V2 intacta |
| `db/migration/V7__unaccent.sql` (nova) | `CREATE EXTENSION IF NOT EXISTS unaccent;` (V5/V6 já existiam) |
| `frontend/src/context/TenantContext.tsx` | Erro de carregamento tratado: mensagem útil, "Tentar novamente" e "Sair". Conta sem tenant tem texto próprio com "Sair" |
| `backend-java/scripts/repair_accounts_without_tenant.sql` (novo) | Reparo com dry-run (ver abaixo) |
| `src/test/.../client/ClientSearchIntegrationTest.java` (novo) | 8 testes |

## 4. Resultado dos testes
- Antes: nenhum teste de integração subia (V2 e V4 duplicadas); o 500 em clients existia.
- Depois: `./mvnw test` com PostgreSQL 16 real (Testcontainers): **46 testes, 0 falhas, BUILD SUCCESS**. `tsc -b` do front passa.
- `ClientSearchIntegrationTest` (8) cobre: lista sem termo/vazio/espaços (200); nome, e-mail e telefone sem diferenciar maiúsculas; `%` e `_` literais; "jose" encontra "José" e "JOSÉ"; busca sem acento por e-mail; isolamento entre tenants; cadastro do dono criando tenant e admin com acesso a `/admin/me` e `/admin/clients`; profissional recebe 403 e anônimo recebe 4xx no painel admin.
- Script de reparo, num Postgres descartável com V1-V7: dry-run lista 2 órfãs e não altera; `apply=1` corrige as 2 (0 órfãs). Nenhum banco real.
- Validação ponta a ponta (backend e Vite próprios, banco descartável, conta `teste+dono@exemplo.com`): login pela interface vai para `/admin/dashboard`; as 12 telas (dashboard, agenda, clientes, profissionais, serviços, produtos, lembretes, faturamento, avisos de acesso, conta, portal, horários) carregam com **0 respostas 4xx/5xx e 0 erros de console**; `GET /admin/clients` aparece 2x (StrictMode).
- CRUD pelos mesmos endpoints da interface, tudo OK: serviço, profissional, cliente (com acentos), produto e bloqueio (criar/editar/excluir); agendamento (criar, confirmar, cancelar); configurações (`PATCH /admin/settings`, persistiu na releitura). Agendamento em horário bloqueado ou conflitante devolve 409 (esperado), nunca 500.

## 5. Como validar manualmente (dono de barbearia)
1. Suba o backend e o front normalmente (veja a seção 6 sobre o banco).
2. Em `/signup`, crie a conta (perfil de dono) e faça login.
3. Você deve cair em `/admin/dashboard` sem tela em branco.
4. Percorra o menu: Clientes (lista vazia sem erro; busque "jose" depois de cadastrar "José"), Serviços, Profissionais, Produtos, Agenda, Faturamento e Configurações. Em cada uma, crie, edite e exclua um item e recarregue (F5) para ver que persistiu.
5. Com o backend parado, o painel deve mostrar "Não foi possível carregar…" com "Tentar novamente" e "Sair".

## 6. Pendências e [NÃO VERIFICADO]
- **Seu banco de dev [NÃO VERIFICADO]:** não subi o backend contra ele. O Flyway está com `validate-on-migrate: false` (`application.yml`), então a mudança de checksum da V4 não deve gerar erro; V7 precisa que o usuário do banco possa criar extensões. Se falhar, me mostre a mensagem. Não rodei `repair` nem alterei dados.
- **Script de reparo:** `backend-java/scripts/repair_accounts_without_tenant.sql`. Dry-run por padrão (`psql "$DATABASE_URL" -f ...`); `-v apply=1` grava. Não executei em nenhum banco real e só rode após revisar o dry-run e com backup.
- **Cadastro com segmento Barbearia [NÃO VERIFICADO]:** o `/signup` escolhe perfil, não segmento, e o backend não tem esse campo; não foi possível validar essa parte.
- **Cadastro pela interface:** o formulário de `/signup` em etapas não foi automatizado; o cadastro foi feito pelo endpoint que ele chama (`POST /api/public/register/business`). O login e as telas foram validados pela interface.
- **CRUD pela interface:** os formulários de criar/editar/excluir foram validados pelos endpoints que eles usam, não clicando nos formulários.
- **Rate limit:** o limite de 200 req/min por IP conta também os preflights `OPTIONS`; recarregar páginas do painel em sequência rápida gerou 429 no meu teste. Não alterei; vale avaliar se admin autenticado precisa de limite maior.
- **Faturamento:** `/admin/revenue` exige `startDate` e `endDate`; a tela envia os dois (carregou sem erro).
- Não tratei chaves de domínio/`agendepro.com`, nem o limite do plano Pro (landing "até 5" vs backend ilimitado).

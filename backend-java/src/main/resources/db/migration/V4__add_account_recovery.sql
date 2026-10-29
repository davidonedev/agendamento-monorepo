-- Aplica o conteúdo de account_recovery que deveria ter sido executado pela V2
-- original (a V2 no disco foi trocada; o banco está na V3 sem estas tabelas).

-- users.token_version — incrementado para invalidar todos os JWTs já emitidos
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

-- user_tokens — só o HASH (SHA-256) do token é guardado; uso único + expiração
CREATE TABLE user_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(20) NOT NULL CHECK (type IN ('password_reset','email_change')),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    new_email  VARCHAR(180),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_tokens_user_type ON user_tokens(user_id, type);

-- access_help_requests — "Não consigo acessar meu e-mail"
CREATE TABLE access_help_requests (
    id             UUID PRIMARY KEY,
    requester_type VARCHAR(20)  NOT NULL CHECK (requester_type IN ('professional','tenant_admin')),
    name           VARCHAR(150) NOT NULL,
    contact        VARCHAR(150) NOT NULL,
    barbershop     VARCHAR(150) NOT NULL,
    message        VARCHAR(1000),
    tenant_id      UUID REFERENCES tenants(id) ON DELETE SET NULL,
    target         VARCHAR(20)  NOT NULL CHECK (target IN ('tenant','super_admin')),
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
    resolved_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_help_target_tenant ON access_help_requests(target, tenant_id, status);

-- audit_logs — nunca guarda senhas nem tokens
CREATE TABLE audit_logs (
    id             UUID PRIMARY KEY,
    action         VARCHAR(60) NOT NULL,
    actor_user_id  UUID,
    target_user_id UUID,
    tenant_id      UUID,
    ip             VARCHAR(64),
    details        TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target_user ON audit_logs(target_user_id);

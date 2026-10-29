-- ─── AgendePro — schema inicial (equivalente ao prisma/schema.prisma do backend Node) ───
-- UUIDs são gerados pela aplicação (Hibernate @UuidGenerator), não pelo banco.

-- ═══════════════════════════════════════════════════════════════════════════
-- tenants
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE tenants (
    id                   UUID PRIMARY KEY,
    slug                 VARCHAR(60)  NOT NULL UNIQUE,
    name                 VARCHAR(150) NOT NULL,
    owner_name           VARCHAR(150) NOT NULL,
    email                VARCHAR(180) NOT NULL UNIQUE,
    phone                VARCHAR(30),
    address              VARCHAR(255),
    status               VARCHAR(20)  NOT NULL DEFAULT 'trial'
                             CHECK (status IN ('active','trial','suspended')),
    plan                 VARCHAR(20)  NOT NULL DEFAULT 'basic'
                             CHECK (plan IN ('basic','pro','enterprise')),
    monthly_price        DOUBLE PRECISION NOT NULL DEFAULT 0,
    primary_color        VARCHAR(9)  NOT NULL DEFAULT '#3B82F6',
    admin_color          VARCHAR(9),
    logo_url             VARCHAR(500),
    banner_url           VARCHAR(500),
    is_open              BOOLEAN NOT NULL DEFAULT TRUE,
    min_advance_minutes  INTEGER NOT NULL DEFAULT 0,
    whatsapp_api_url     VARCHAR(300),
    whatsapp_api_key     VARCHAR(300),
    whatsapp_instance    VARCHAR(150),
    whatsapp_template    VARCHAR(2000),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- users
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(180) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL
                        CHECK (role IN ('super_admin','tenant_admin','professional')),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    professional_id UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- professionals
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE professionals (
    id                   UUID PRIMARY KEY,
    tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                 VARCHAR(150) NOT NULL,
    specialty            VARCHAR(150) NOT NULL DEFAULT '',
    avatar               VARCHAR(500),
    photo_url            VARCHAR(2000),
    bio                  VARCHAR(500),
    working_hours_start  VARCHAR(5) NOT NULL DEFAULT '08:00',
    working_hours_end    VARCHAR(5) NOT NULL DEFAULT '18:00',
    working_days         INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_professionals_tenant_id ON professionals(tenant_id);

ALTER TABLE users
    ADD CONSTRAINT fk_users_professional
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL;
CREATE INDEX idx_users_professional_id ON users(professional_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- services
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE services (
    id          UUID PRIMARY KEY,
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price       DOUBLE PRECISION NOT NULL,
    duration    INTEGER NOT NULL,
    category    VARCHAR(50),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_tenant_id ON services(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- professional_services (tabela de junção — join entity ProfessionalServiceLink)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE professional_services (
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, service_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- clients
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE clients (
    id             UUID PRIMARY KEY,
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(180) NOT NULL,
    phone          VARCHAR(30),
    password_hash  VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_clients_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- client_email_tokens
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE client_email_tokens (
    id         UUID PRIMARY KEY,
    client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    token      VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_email_tokens_client_id ON client_email_tokens(client_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- appointments
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE appointments (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    date            VARCHAR(10) NOT NULL,
    start_time      VARCHAR(5)  NOT NULL,
    end_time        VARCHAR(5)  NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
    price           DOUBLE PRECISION NOT NULL,
    notes           VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_professional_date ON appointments(professional_id, date);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, date);

-- ═══════════════════════════════════════════════════════════════════════════
-- products
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE products (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    description         VARCHAR(500),
    price               DOUBLE PRECISION NOT NULL,
    stock               INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    category            VARCHAR(50),
    image_url           VARCHAR(2000),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- product_categories
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE product_categories (
    id         UUID PRIMARY KEY,
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name       VARCHAR(60) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_categories_tenant_name UNIQUE (tenant_id, name)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- service_categories
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE service_categories (
    id         UUID PRIMARY KEY,
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name       VARCHAR(60) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_service_categories_tenant_name UNIQUE (tenant_id, name)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- plan_configs
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE plan_configs (
    id                 UUID PRIMARY KEY,
    plan               VARCHAR(20) NOT NULL UNIQUE
                           CHECK (plan IN ('basic','pro','enterprise')),
    display_name       VARCHAR(50) NOT NULL,
    default_price      DOUBLE PRECISION NOT NULL,
    max_professionals  INTEGER NOT NULL DEFAULT -1,
    max_services       INTEGER NOT NULL DEFAULT -1,
    features           TEXT[] NOT NULL DEFAULT '{}',
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- blocked_slots
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE blocked_slots (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    date            VARCHAR(10) NOT NULL,
    start_time      VARCHAR(5) NOT NULL,
    end_time        VARCHAR(5) NOT NULL,
    reason          VARCHAR(200),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blocked_slots_professional_date ON blocked_slots(professional_id, date);
CREATE INDEX idx_blocked_slots_tenant_id ON blocked_slots(tenant_id);

-- Pagamento Pix em agendamentos (Mercado Pago)
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS payment_status       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_id           VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_expires_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_qr_code      TEXT,
    ADD COLUMN IF NOT EXISTS payment_qr_code_base64 TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON appointments(payment_id) WHERE payment_id IS NOT NULL;

-- Token Mercado Pago por tenant (opcional; fallback para env MP_ACCESS_TOKEN)
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS mp_access_token VARCHAR(500);

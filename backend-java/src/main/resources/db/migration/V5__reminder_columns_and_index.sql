-- Colunas para controle de lembretes automáticos (evita envio duplicado)
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reminder_2h_sent_at  TIMESTAMPTZ;

-- Índice ausente na tabela de junção professional_services
CREATE INDEX IF NOT EXISTS idx_professional_services_service_id
    ON professional_services(service_id);

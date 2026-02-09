-- Migração: Adicionar colunas de controle de emails na tabela compras
-- Execute no Supabase SQL Editor

ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para otimizar a query do cron de recuperação
CREATE INDEX IF NOT EXISTS idx_compras_recovery_pending 
ON compras (status, created_at) 
WHERE status = 'pending' AND recovery_email_sent_at IS NULL;

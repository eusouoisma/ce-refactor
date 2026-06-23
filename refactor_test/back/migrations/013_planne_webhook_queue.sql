-- 012_planne_webhook_queue.sql
-- Staging table for Planne webhook events awaiting manual approval

CREATE TABLE IF NOT EXISTS planne_webhook_queue (
  id SERIAL PRIMARY KEY,
  action VARCHAR(20) NOT NULL,
  "saleId" VARCHAR(100) NOT NULL,
  "planneCode" VARCHAR(100),
  "stateTo" VARCHAR(50),
  "mappedData" JSONB,
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_pwq_pending ON planne_webhook_queue(status, action);

-- 010_2fa_enabled.sql
-- Per-user toggle to enable/disable 2FA requirement

ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN NOT NULL DEFAULT TRUE;

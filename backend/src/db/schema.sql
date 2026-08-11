CREATE TABLE IF NOT EXISTS urls (
    id            BIGSERIAL PRIMARY KEY,
    short_code    VARCHAR(20) NOT NULL UNIQUE,
    long_url      TEXT NOT NULL,
    expires_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_short_code ON urls (short_code);
CREATE INDEX IF NOT EXISTS idx_expires_at ON urls (expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE urls ADD COLUMN IF NOT EXISTS deletion_token VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_token ON urls (deletion_token);
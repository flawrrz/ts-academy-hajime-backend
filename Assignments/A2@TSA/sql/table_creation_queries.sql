-- Enable UUID extension if you want to use gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    uuid          UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type        VARCHAR(50) NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'credit')),
    currency    CHAR(3) NOT NULL DEFAULT 'USD',
    balance     NUMERIC(19,4) NOT NULL DEFAULT 0.0 CHECK (balance >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id              BIGSERIAL PRIMARY KEY,
    uuid            UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    account_from    BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    account_to      BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    amount          NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    type            VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment')),
    status          VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    description     TEXT,
 -- category_id     INTEGER REFERENCES transaction_categories(id) ON DELETE SET NULL,
    external_ref    VARCHAR(255),               -- for idempotency or external payment IDs
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- At least one of account_from or account_to must be set
    CONSTRAINT valid_accounts CHECK (
        (account_from IS NOT NULL OR account_to IS NOT NULL) AND
        (account_from IS NULL OR account_to IS NULL OR account_from != account_to)
    )
);

-- -- Transaction categories (optional, for reporting)
-- CREATE TABLE transaction_categories (
--     id   SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL UNIQUE,
--     icon VARCHAR(50)  -- optional
-- );

-- -- Audit log (immutable – only insert, never update)
--  CREATE TABLE audit_log (
--     id          BIGSERIAL PRIMARY KEY,
--     table_name  VARCHAR(100) NOT NULL,
--     record_id   BIGINT NOT NULL,
--     action      VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
--     old_data    JSONB,
--     new_data    JSONB,
--     performed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
--     performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
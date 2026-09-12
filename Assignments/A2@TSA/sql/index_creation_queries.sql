-- Users: lookups by email
CREATE INDEX idx_users_email ON users(email);

-- Accounts: filter by user and type
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);

-- Transactions: most frequent queries
CREATE INDEX idx_transactions_account_from ON transactions(account_from);
CREATE INDEX idx_transactions_account_to   ON transactions(account_to);
CREATE INDEX idx_transactions_status       ON transactions(status);
CREATE INDEX idx_transactions_created_at   ON transactions(created_at DESC);
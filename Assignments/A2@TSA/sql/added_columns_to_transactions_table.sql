ALTER TABLE transactions
  ADD COLUMN account_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
  DROP COLUMN account_from,
  DROP COLUMN account_to,
  ADD COLUMN from_account VARCHAR(10),
  ADD COLUMN to_account VARCHAR(10),
  ADD COLUMN transfer_type VARCHAR(20) CHECK (transfer_type IN ('internal', 'external'));
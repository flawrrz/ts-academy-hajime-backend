// Service to interact with the transactions table of the narjis_bank database

const pool = require("../config/databaseConfig");

async function createTransaction({
  accountId,
  fromAccount,
  toAccount,
  amount,
  type,
  status,
  description,
  externalRef,
  transferType
}) {
  const result = await pool.query(
    `INSERT INTO transactions
    (account_id, from_account, to_account, amount, type, status, description, external_ref, transfer_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, uuid, created_at, status`,
    [
      accountId,
      fromAccount,
      toAccount,
      amount,
      type,
      status,
      description,
      externalRef,
      transferType
    ]
  );
  return result.rows[0];
}

async function getTransactionByAccountId(accountId) {
  const result = await pool.query(
    `SELECT id, uuid, amount, type, status, description, from_account, to_account,
    external_ref, transfer_type, created_at
    FROM transactions
    WHERE account_id = $1
    ORDER BY created_at DESC`,
    [accountId]
  );
  return result.rows[0];
}

async function getTransactionByIdAndAccount(transactionId, accountId) {
  const result = await pool.query(
    `SELECT * FROM transactions
    WHERE id = $1 AND account_id = $2`,
    [transactionId, accountId]
  );
  return result.rows[0];
}

module.exports = { createTransaction, getTransactionByAccountId, getTransactionByIdAndAccount };
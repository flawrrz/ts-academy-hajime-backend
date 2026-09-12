// Service to interact with the accounts table of the narjis_bank database

const pool = require("../config/databaseConfig");

async function createAccount(userId, accountNumber, bankCode, bankName, balance) {
  const result = await pool.query(
    `INSERT INTO accounts (user_id, account_number, bank_code, bank_name, balance)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, account_number, bank_code, bank_name, balance, created_at`,
    [userId, accountNumber, bankCode, bankName, balance]
  );
  return result.rows[0];
}

async function findAccountByNumber(accountNumber) {
  const query = "SELECT * FROM accounts WHERE account_number = $1";
  // console.log('Executing query:', query, 'with params:', [accountNumber]);
  const result = await pool.query(query, [accountNumber]);
  // console.log('Result rows:', result.rows);
  return result.rows[0];
}

async function findAccountByUserId(userId) {
  const query = "SELECT * FROM accounts WHERE user_id = $1";
  const result = await pool.query(query, [userId]);
  // console.log('Result rows:', result.rows);
  return result.rows[0];
}


async function updateBalance(accountId, newBalance) {
  await pool.query(
    "UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2",
    [newBalance, accountId]
  );
} 

module.exports = { createAccount, findAccountByUserId, findAccountByNumber, updateBalance };
// Service to interact with the users table of the narjis_bank database

const pool = require("../config/databaseConfig");
const bcrypt = require("bcryptjs");

async function createUser(email, password, fullName, dob, nin, bvn) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, date_of_birth, nin, bvn)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, uuid, email, full_name, date_of_birth, nin, bvn, created_at`,
    [email, passwordHash, fullName, dob, nin, bvn]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT id, password_hash, full_name, kyc_verified, nin, bvn, date_of_birth FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
}

async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, uuid, email, full_name, kyc_verified, nin, bvn, date_of_birth
    FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}
async function updateKyc(userId, kycType, kycId, dob) {
  const field = kycType === "bvn" ? "bvn" : "nin";
  const query = `
    UPDATE users
    SET ${field} = $1, date_of_birth = $2, kyc_verified  = true, updated_at = NOW()
    WHERE id = $3
    RETURNING id, email, full_name, kyc_verified, nin, bvn, date_of_birth
  `;
  const result = await pool.query(query, [kycId, dob, userId]);
  return result.rows[0];
}

module.exports = { createUser, findUserByEmail, findUserById, updateKyc };
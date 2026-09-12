const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  max: 20,                       // maximum number of clients in the pool
  idleTimeoutMillis: 30000,      // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error if a connection cannot be made in 2 seconds
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Database connected successfully :)');
    release();
  }
});

module.exports = pool;

// Code obtained from AI //
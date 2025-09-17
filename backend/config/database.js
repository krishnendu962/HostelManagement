const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'myprojectdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully');
    client.release();
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
    process.exit(1);
  }
};

// Query function with error handling
const query = async (text, params) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Database query error:', err.message);
    throw err;
  }
};

// Get a client from the pool for transactions
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    console.error('❌ Error getting database client:', err.message);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Set it in your environment or .env file.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

module.exports = pool;
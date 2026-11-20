const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Ensure .env is loaded regardless of process working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback

const isSslRequired = process.env.DB_SSL === 'true' || 
                      process.env.DATABASE_SSL === 'true' || 
                      process.env.TIDB_ENABLE_SSL === 'true' ||
                      (process.env.DATABASE_PORT === '4000' || process.env.DB_PORT === '4000');

let pool;
if (process.env.DATABASE_URL) {
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  pool = mysql.createPool({
    host: process.env.TIDB_HOST || process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TIDB_PORT || process.env.DATABASE_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.TIDB_USER || process.env.DATABASE_USER || process.env.DB_USER || 'root',
    password: process.env.TIDB_PASSWORD || process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'VISHAL',
    database: process.env.TIDB_DATABASE || process.env.DATABASE_NAME || process.env.DB_NAME || 'shahyog_kart',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: isSslRequired ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined
  });
}

// Helper for query execution (uses pool.query for seamless TiDB Cloud & MySQL compatibility)
const query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Helper for transaction
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction
};

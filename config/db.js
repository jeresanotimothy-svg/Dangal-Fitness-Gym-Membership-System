// MySQL connection (settings come from .env locally, or from Environment variables on Render)
const mysql = require('mysql2/promise');

if (process.env.DB_PASSWORD === undefined) {
  console.error('DB_PASSWORD is missing. Set it in .env (local) or in the Environment tab (Render).');
  process.exit(1);
}

// Cloud databases (TiDB Cloud, Aiven) need an encrypted connection: DB_SSL=true
const ssl = process.env.DB_SSL === 'true'
  ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
    ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {})
  }
  : undefined;

// Philippine time for NOW() and CURDATE(), whatever the server's own time zone is
const timeZone = /^[+-]\d{2}:\d{2}$/.test(process.env.DB_TIMEZONE || '') ? process.env.DB_TIMEZONE : '+08:00';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gym_db',
  ssl,
  dateStrings: true,
  connectionLimit: 5,
  connectTimeout: 15000,
  enableKeepAlive: true
});

pool.pool.on('connection', connection => {
  connection.query(`SET time_zone = '${timeZone}'`);
});

module.exports = pool;

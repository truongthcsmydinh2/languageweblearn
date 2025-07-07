// src/lib/mysql.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'myvps',
  password: process.env.DB_PASSWORD || 'abcd1234',
  database: process.env.DB_NAME || 'vocab_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export { db };

export async function connectToDatabase() {
  try {
    const connection = await db.getConnection();
    console.log('MySQL connected successfully');
    return connection;
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    throw error;
  }
}
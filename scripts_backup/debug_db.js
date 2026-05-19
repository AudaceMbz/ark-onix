const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  try {
    const [rows] = await connection.query('SELECT id, title, target_page FROM projects LIMIT 20');
    console.log('Project Data:', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}
check();

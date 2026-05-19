
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSettings() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  const [rows] = await db.query('SELECT * FROM settings');
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}

checkSettings();

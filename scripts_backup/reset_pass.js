const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function reset() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });
  
  const hash = await bcrypt.hash('onix2026', 10);
  await db.query('UPDATE admins SET password_hash = ? WHERE username = "admin"', [hash]);
  console.log('✅ Password reset to: onix2026');
  process.exit();
}
reset();

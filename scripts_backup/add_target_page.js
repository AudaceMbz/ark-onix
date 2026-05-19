const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM projects LIKE 'target_page'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE projects ADD COLUMN target_page VARCHAR(20) DEFAULT 'both'");
      console.log('Added target_page column to projects table');
    } else {
      console.log('Column target_page already exists');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}
run();

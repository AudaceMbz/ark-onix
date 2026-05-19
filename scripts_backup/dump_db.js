
const mysql = require('mysql2/promise');
require('dotenv').config();

async function dump() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  const [projects] = await db.query('SELECT * FROM projects');
  console.log('--- PROJECTS ---');
  console.log(JSON.stringify(projects, null, 2));

  const [settings] = await db.query('SELECT * FROM settings');
  console.log('--- SETTINGS ---');
  console.log(JSON.stringify(settings, null, 2));

  await db.end();
}

dump().catch(console.error);

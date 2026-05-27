require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function importSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../schema_pg.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ Schema imported successfully');
  } catch (err) {
    console.error('❌ Error importing schema:', err.message);
  } finally {
    pool.end();
  }
}

importSchema();

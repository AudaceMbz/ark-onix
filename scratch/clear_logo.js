'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  try {
    const db = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'onyx_db', // Check schema.sql for correct name
      waitForConnections: true,
      connectionLimit: 10
    });

    console.log('Connected to MySQL');
    
    // Check correct table and key
    const [rows] = await db.query("SELECT * FROM settings WHERE setting_key = 'logo_path'");
    console.log('Current logo_path:', rows);

    if (rows.length > 0) {
      await db.query("UPDATE settings SET setting_value = '' WHERE setting_key = 'logo_path'");
      console.log('✅ logo_path cleared in database.');
    } else {
      console.log('No logo_path setting found.');
    }

    await db.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();

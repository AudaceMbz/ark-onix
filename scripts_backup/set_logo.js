
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateLogo() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM settings WHERE setting_key = "logo_path"');
    if (rows.length === 0) {
      await connection.execute('INSERT INTO settings (setting_key, setting_value) VALUES ("logo_path", "/images/onix-logo.png")');
      console.log('✅ Added logo_path setting to database');
    } else {
      await connection.execute('UPDATE settings SET setting_value = "/images/onix-logo.png" WHERE setting_key = "logo_path"');
      console.log('✅ Updated logo_path setting in database');
    }
  } catch (err) {
    console.error('❌ Error updating logo:', err.message);
  } finally {
    await connection.end();
  }
}

updateLogo();

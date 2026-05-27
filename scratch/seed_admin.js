require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query('SELECT id FROM admins LIMIT 1');
    if (res.rows.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'onix2026', 10);
      await pool.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        [process.env.ADMIN_USERNAME || 'admin', hash]
      );
      console.log('✅ Default admin created in Neon DB!');
    } else {
      console.log('✅ Admin already exists.');
    }
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
  } finally {
    pool.end();
  }
}

seedAdmin();

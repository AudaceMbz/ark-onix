const { Pool } = require('pg');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let db;
  let dbType = 'mysql';

  if (process.env.DATABASE_URL || process.env.RENDER || process.env.VERCEL) {
    dbType = 'postgres';
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('Connecting to PostgreSQL...');
  } else {
    dbType = 'mysql';
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'onix_db'
    });
    console.log('Connecting to MySQL...');
  }

  async function query(sql, params = []) {
    if (dbType === 'postgres') {
      let count = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++count}`);
      const res = await db.query(pgSql, params);
      return [res.rows, res];
    } else {
      const [rows, fields] = await db.query(sql, params);
      return [rows, fields];
    }
  }

  const columns = [
    { name: 'location', type: 'VARCHAR(255)' },
    { name: 'client', type: 'VARCHAR(255)' },
    { name: 'project_type', type: 'VARCHAR(100)' },
    { name: 'project_status', type: 'VARCHAR(100)' },
    { name: 'area', type: 'VARCHAR(100)' },
    { name: 'budget', type: 'VARCHAR(100)' },
    { name: 'start_date', type: 'VARCHAR(100)' },
    { name: 'completion_date', type: 'VARCHAR(100)' },
    { name: 'lead_architect', type: 'VARCHAR(255)' },
    { name: 'story_overview', type: 'TEXT' },
    { name: 'story_concept', type: 'TEXT' },
    { name: 'story_challenges', type: 'TEXT' },
    { name: 'story_progress', type: 'TEXT' },
    { name: 'story_sustainability', type: 'TEXT' },
    { name: 'story_materials', type: 'TEXT' },
    { name: 'story_achievements', type: 'TEXT' },
    { name: 'stat_floors', type: 'VARCHAR(50)' },
    { name: 'stat_height', type: 'VARCHAR(50)' },
    { name: 'stat_duration', type: 'VARCHAR(100)' },
    { name: 'stat_team', type: 'VARCHAR(100)' }
  ];

  console.log('Updating "projects" table...');
  for (const col of columns) {
    try {
      if (dbType === 'postgres') {
        await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      } else {
        const [rows] = await query(`SHOW COLUMNS FROM projects LIKE ?`, [col.name]);
        if (rows.length === 0) {
          await query(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (err) {
      console.error(`Error adding column ${col.name}:`, err.message);
    }
  }

  console.log('Creating "project_images" table...');
  if (dbType === 'postgres') {
    await query(`
      CREATE TABLE IF NOT EXISTS project_images (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        image_path VARCHAR(500) NOT NULL,
        caption TEXT,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else {
    await query(`
      CREATE TABLE IF NOT EXISTS project_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        image_path VARCHAR(500) NOT NULL,
        caption TEXT,
        display_order INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
  }

  console.log('Migration completed successfully.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});


const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPaths() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  console.log('Fixing project image paths...');
  const [projects] = await db.query('SELECT id, image_path FROM projects');
  for (const p of projects) {
    if (p.image_path && !p.image_path.startsWith('/images/projects/')) {
      // If it's just a filename, prepend the path
      const newPath = '/images/projects/' + p.image_path.replace(/^\/+/, '');
      await db.query('UPDATE projects SET image_path = ? WHERE id = ?', [newPath, p.id]);
      console.log(`Updated project ${p.id}: ${p.image_path} -> ${newPath}`);
    }
  }

  console.log('Fixing settings paths...');
  const [settings] = await db.query('SELECT id, hero_video_path, logo_path FROM settings');
  if (settings.length > 0) {
    const s = settings[0];
    let updates = {};
    
    if (s.hero_video_path && !s.hero_video_path.startsWith('/images/')) {
      updates.hero_video_path = '/images/' + s.hero_video_path.replace(/^\/+/, '');
    }
    if (s.logo_path && !s.logo_path.startsWith('/images/')) {
      updates.logo_path = '/images/' + s.logo_path.replace(/^\/+/, '');
    }

    if (Object.keys(updates).length > 0) {
      const keys = Object.keys(updates);
      const values = keys.map(k => updates[k]);
      values.push(s.id);
      await db.query(`UPDATE settings SET ${keys.map(k => `${k}=?`).join(', ')} WHERE id = ?`, values);
      console.log('Updated settings paths:', updates);
    }
  }

  console.log('Done.');
  await db.end();
}

fixPaths().catch(console.error);

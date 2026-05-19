
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateVideo() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'onix_db'
  });

  const videoPath = '/uploads/1775256351923-60.mp4';
  
  await db.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    ['hero_video_path', videoPath, videoPath]
  );

  console.log(`✅ Updated hero_video_path to: ${videoPath}`);
  await db.end();
}

updateVideo();

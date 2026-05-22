'use strict';
// ═══════════════════════════════════════════════════════════════
//  ONIX ARCHITECTURE — Node.js Backend Server
//  Database : MySQL (Local) / PostgreSQL (Render/Production)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'onix_jwt_secret_2026';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin ||
        origin.startsWith('http://localhost') ||
        origin.includes('infinityfreeapp.com') ||
        origin.includes('onrender.com') ||
        origin.includes('vercel.app') ||
        origin.includes('koyeb.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Database Connection (Hybrid: MySQL/PostgreSQL) ───────────────────────────
let db;
let dbType = 'mysql'; // Default to MySQL
let dbInitPromise = null;

async function initDB() {
  // If DATABASE_URL or RENDER exists, we assume PostgreSQL (Production/Render)
  if (process.env.DATABASE_URL || process.env.RENDER || process.env.VERCEL) {
    dbType = 'postgres';
    const { Pool } = require('pg');
    try {
      db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.query('SELECT 1');
      console.log('✅  Connected to PostgreSQL (Production Mode)');
    } catch (err) {
      console.error('❌  PostgreSQL connection failed:', err.message);
    }
  } else {
    // Local development — use MySQL
    dbType = 'mysql';
    const mysql = require('mysql2/promise');
    try {
      db = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'onix_db',
        waitForConnections: true,
        connectionLimit: 10
      });
      await db.query('SELECT 1');
      console.log('✅  Connected to MySQL (Local Mode)');
    } catch (err) {
      console.error('❌  MySQL connection failed:', err.message);
      db = null;
    }
  }
  if (db) await seedAdmin();
}

function connectDB() {
  if (!dbInitPromise) {
    dbInitPromise = initDB();
  }
  return dbInitPromise;
}

// Wrapper to handle differences between MySQL (?) and PostgreSQL ($1)
async function query(sql, params = []) {
  if (!db) await connectDB();
  if (!db) throw new Error('Database not connected');

  if (dbType === 'postgres') {
    // Convert ? to $1, $2, etc.
    let count = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++count}`);
    const res = await db.query(pgSql, params);
    return [res.rows, res];
  } else {
    // MySQL uses ? by default
    const [rows, fields] = await db.query(sql, params);
    return [rows, fields];
  }
}

// ─── Seed Default Admin ───────────────────────────────────────────────────────
async function seedAdmin() {
  try {
    const [rows] = await query('SELECT id FROM admins LIMIT 1');
    if (rows.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'onix2026', 10);
      await query(
        'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
        [process.env.ADMIN_USERNAME || 'admin', hash]
      );
      console.log('✅  Default admin created');
    }
  } catch (err) {
    console.error('Seed admin error:', err.message);
  }
}

// ─── Cloudinary Setup ─────────────────────────────────────────────────────────
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const typeMap = { project: 'projects', team: 'team', video: 'videos', logo: 'images' };
    const folder = 'onix/' + (typeMap[req.body.upload_type] || 'uploads');
    
    const rType = req.body.upload_type === 'video' ? 'video' : 'auto';
    return {
      folder: folder,
      resource_type: rType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1000)}`
    };
  }
});
const upload = multer({ storage });

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
async function requireDB(req, res, next) {
  await connectDB();
  if (!db) {
    console.log('❌ DB Guard: No database connection');
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
}

// ═══════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/api/admin/login', requireDB, async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN ATTEMPT] User: ${username}`);
  try {
    const [rows] = await query('SELECT * FROM admins WHERE username = ?', [username]);
    if (!rows.length) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      console.log('❌ Login failed: Incorrect password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ adminId: rows[0].id }, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Login successful');
    res.json({ success: true, token });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/logout', (req, res) => { res.json({ success: true }); });
app.get('/api/admin/check', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ loggedIn: false });
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ loggedIn: true });
  } catch { res.json({ loggedIn: false }); }
});

app.get('/api/settings', requireDB, async (req, res) => {
  try {
    const [rows] = await query('SELECT setting_key, setting_value FROM settings');
    const data = {};
    rows.forEach(r => data[r.setting_key] = r.setting_value);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/settings', requireAuth, requireDB, upload.single('file'), async (req, res) => {
  try {
    const { setting_key, setting_value, upload_type } = req.body;
    let value = setting_value;
    if (req.file) {
      value = req.file.path;

      // Clean up the old file if it exists
      try {
        const [oldRows] = await query('SELECT setting_value FROM settings WHERE setting_key = ?', [setting_key]);
        if (oldRows.length > 0 && oldRows[0].setting_value) {
          const oldFilePath = path.join(__dirname, 'public', oldRows[0].setting_value);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      } catch (e) {
        console.error('File cleanup error:', e.message);
      }
    }
    const sql = dbType === 'mysql'
      ? 'INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=?'
      : 'INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value';
    const params = dbType === 'mysql' ? [setting_key, value, value] : [setting_key, value];
    await query(sql, params);
    res.json({ success: true, value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/settings/:key', requireAuth, requireDB, async (req, res) => {
  try {
    const { key } = req.params;
    if (key !== 'logo_path' && key !== 'hero_video_path') {
      return res.status(400).json({ error: 'Invalid setting key for deletion' });
    }

    // 1. Get current file path
    const [rows] = await query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    if (rows.length > 0 && rows[0].setting_value) {
      const filePath = path.join(__dirname, 'public', rows[0].setting_value);
      // 2. Delete file if it exists
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('File deletion error:', e.message); }
      }
    }

    // 3. Clear database value
    await query("UPDATE settings SET setting_value = '' WHERE setting_key = ?", [key]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/projects', requireDB, async (req, res) => {
  try {
    const { page } = req.query;
    let sql = 'SELECT * FROM projects WHERE is_active = ' + (dbType === 'mysql' ? '1' : 'true');
    if (page === 'home') sql += " AND (target_page = 'home' OR target_page = 'both' OR target_page IS NULL)";
    else if (page === 'work') sql += " AND (target_page = 'work' OR target_page = 'both' OR target_page IS NULL)";
    sql += ' ORDER BY display_order ASC, created_at DESC LIMIT 60';
    const [rows] = await query(sql);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/projects', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    const { title, category, description, display_order, target_page } = req.body;
    const img = req.file ? req.file.path : '';

    const active = (dbType === 'mysql' ? 1 : true);
    const [reslt] = await query(
      'INSERT INTO projects (title, category, description, image_path, display_order, target_page, is_active) VALUES (?,?,?,?,?,?,?)',
      [title, category || 'Architecture', description || '', img, parseInt(display_order) || 0, target_page || 'both', active]
    );
    res.status(201).json({ success: true, id: dbType === 'mysql' ? reslt.insertId : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/projects/:id', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    const { title, category, description, display_order, is_active, target_page } = req.body;
    const updates = { title, category, description, target_page };
    if (display_order !== undefined) updates.display_order = parseInt(display_order) || 0;
    if (is_active !== undefined) updates.is_active = (is_active === 'true' || is_active === true || is_active === '1' || is_active === 1);
    if (req.file) {
      updates.image_path = req.file.path;
    }

    const keys = Object.keys(updates).filter(k => updates[k] !== undefined);
    const values = keys.map(k => updates[k]);
    values.push(req.params.id);
    const setClause = keys.map(k => `${k}=?`).join(', ');
    await query(`UPDATE projects SET ${setClause} WHERE id=?`, values);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/projects/:id', requireAuth, requireDB, async (req, res) => {
  try {
    // 1. Get current file path
    const [rows] = await query('SELECT image_path FROM projects WHERE id = ?', [req.params.id]);
    if (rows.length > 0 && rows[0].image_path) {
      const filePath = path.join(__dirname, 'public', rows[0].image_path);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Project image deletion error:', e.message); }
      }
    }
    // 2. Delete from DB (Actual delete instead of soft-delete for cleaner management)
    await query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SERVICES
app.get('/api/services', requireDB, async (req, res) => {
  try { const [rows] = await query('SELECT * FROM services WHERE is_active = ' + (dbType === 'mysql' ? '1' : 'true') + ' ORDER BY display_order ASC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/services', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, icon, display_order } = req.body;
    const active = (dbType === 'mysql' ? 1 : true);
    const [r] = await query('INSERT INTO services (title, description, icon, display_order, is_active) VALUES (?,?,?,?,?)', [title, description || '', icon || 'building', parseInt(display_order) || 0, active]);
    res.status(201).json({ success: true, id: dbType === 'mysql' ? r.insertId : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/services/:id', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, icon, display_order, is_active } = req.body;
    const active = is_active === undefined ? true : (is_active === 'true' || is_active === true || is_active === '1' || is_active === 1);
    await query('UPDATE services SET title=?, description=?, icon=?, display_order=?, is_active=? WHERE id=?', [title, description, icon, parseInt(display_order) || 0, active, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/services/:id', requireAuth, requireDB, async (req, res) => {
  try { await query('UPDATE services SET is_active = ' + (dbType === 'mysql' ? '0' : 'false') + ' WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// TEAM
app.get('/api/team', requireDB, async (req, res) => {
  try { const [rows] = await query('SELECT * FROM team_photos WHERE is_active = ' + (dbType === 'mysql' ? '1' : 'true') + ' ORDER BY display_order ASC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/team', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    const { name, role, display_order } = req.body;
    const img = req.file ? req.file.path : '';

    const active = (dbType === 'mysql' ? 1 : true);
    const [r] = await query('INSERT INTO team_photos (name, role, image_path, display_order, is_active) VALUES (?,?,?,?,?)', [name || '', role || '', img, parseInt(display_order) || 0, active]);
    res.status(201).json({ success: true, id: dbType === 'mysql' ? r.insertId : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/team/:id', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    const { name, role, display_order, is_active } = req.body;
    const updates = { name, role };
    if (display_order !== undefined) updates.display_order = parseInt(display_order) || 0;
    if (is_active !== undefined) updates.is_active = (is_active === 'true' || is_active === true || is_active === '1' || is_active === 1);
    if (req.file) {
      updates.image_path = req.file.path;
    }
    const keys = Object.keys(updates).filter(k => updates[k] !== undefined);
    const values = keys.map(k => updates[k]);
    values.push(req.params.id);
    const setClause = keys.map(k => `${k}=?`).join(', ');
    await query(`UPDATE team_photos SET ${setClause} WHERE id=?`, values);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/team/:id', requireAuth, requireDB, async (req, res) => {
  try {
    // 1. Get current file path
    const [rows] = await query('SELECT image_path FROM team_photos WHERE id = ?', [req.params.id]);
    if (rows.length > 0 && rows[0].image_path) {
      const filePath = path.join(__dirname, 'public', rows[0].image_path);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Team image deletion error:', e.message); }
      }
    }
    // 2. Delete from DB
    await query('DELETE FROM team_photos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// WORKSHOPS
app.get('/api/workshops', requireDB, async (req, res) => {
  try { const [rows] = await query('SELECT * FROM workshops WHERE is_active = ' + (dbType === 'mysql' ? '1' : 'true') + ' ORDER BY display_order ASC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/workshops', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, learn_more, our_speakers, business_knowledge, date_label, display_order } = req.body;
    const active = (dbType === 'mysql' ? 1 : true);
    const [r] = await query('INSERT INTO workshops (title, description, learn_more, our_speakers, business_knowledge, date_label, display_order, is_active) VALUES (?,?,?,?,?,?,?,?)', [title, description || '', learn_more || '', our_speakers || '', business_knowledge || '', date_label || '', parseInt(display_order) || 0, active]);
    res.status(201).json({ success: true, id: dbType === 'mysql' ? r.insertId : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/workshops/:id', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, learn_more, our_speakers, business_knowledge, date_label, display_order, is_active } = req.body;
    const active = is_active === undefined ? true : (is_active === 'true' || is_active === true || is_active === '1' || is_active === 1);
    await query('UPDATE workshops SET title=?, description=?, learn_more=?, our_speakers=?, business_knowledge=?, date_label=?, display_order=?, is_active=? WHERE id=?', [title, description, learn_more, our_speakers, business_knowledge, date_label, parseInt(display_order) || 0, active, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/workshops/:id', requireAuth, requireDB, async (req, res) => {
  try { await query('UPDATE workshops SET is_active = ' + (dbType === 'mysql' ? '0' : 'false') + ' WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ABOUT
app.get('/api/about', requireDB, async (req, res) => {
  try {
    const [rows] = await query('SELECT content_key, content_value FROM about_content');
    const data = {};
    rows.forEach(r => data[r.content_key] = r.content_value);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/about', requireAuth, requireDB, async (req, res) => {
  try {
    const { content_key, content_value } = req.body;
    const sql = dbType === 'mysql'
      ? 'INSERT INTO about_content (content_key, content_value) VALUES (?,?) ON DUPLICATE KEY UPDATE content_value=?'
      : 'INSERT INTO about_content (content_key, content_value) VALUES (?,?) ON CONFLICT (content_key) DO UPDATE SET content_value = EXCLUDED.content_value';
    const params = dbType === 'mysql' ? [content_key, content_value, content_value] : [content_key, content_value];
    await query(sql, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/status', (req, res) => res.json({ server: 'running', database: db ? 'connected (' + dbType + ')' : 'disconnected', node: process.version }));

const pub = (file) => (req, res) => res.sendFile(path.join(__dirname, 'public', file));
app.get(['/admin', '/admin/*splat'], pub('admin.html'));
app.get(['/about', '/about.html'], pub('about.html'));
app.get(['/services', '/services.html'], pub('services.html'));
app.get(['/training', '/training.html'], pub('training.html'));
app.get(['/work', '/work.html'], pub('work.html'));
app.get(['/contact', '/contact.html'], pub('contact.html'));
app.get(['/', '/home.html', '/index.html', '/{*splat}'], pub('index.html'));

connectDB().then(() => {
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`\n🚀  Onix server  →  http://localhost:${PORT}`);
      console.log(`📡  Mode         →  ${dbType.toUpperCase()}`);
    });
  }
});

// Export the Express API for Vercel Serverless Functions
module.exports = app;


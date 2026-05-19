'use strict';
// ═══════════════════════════════════════════════════════════════
//  ONIX ARCHITECTURE — Node.js Backend Server
//  Language : JavaScript (Node.js)
//  Database : MySQL (via mysql2/promise)
//  Auth     : express-session + bcryptjs
//  Uploads  : multer (local disk)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const express    = require('express');
const mysql      = require('mysql2/promise');
const multer     = require('multer');
const session    = require('express-session');
const bcrypt     = require('bcryptjs');
const path       = require('path');
const fs         = require('fs');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust first proxy (Railway/Render/Heroku)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'onix_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// ─── MySQL Connection Pool ────────────────────────────────────────────────────
let db;

async function connectDB() {
  try {
    db = await mysql.createPool({
      host              : process.env.DB_HOST     || 'localhost',
      user              : process.env.DB_USER     || 'root',
      password          : process.env.DB_PASSWORD || '',
      database          : process.env.DB_NAME     || 'onix_db',
      waitForConnections: true,
      connectionLimit   : 10,
      charset           : 'utf8mb4'
    });
    // Test connection
    await db.query('SELECT 1');
    console.log('✅  MySQL connected to database:', process.env.DB_NAME || 'onix_db');
    await seedAdmin();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.log('   → Make sure MySQL is running and .env credentials are correct.');
    db = null;
  }
}

// ─── Seed Default Admin ───────────────────────────────────────────────────────
async function seedAdmin() {
  try {
    const [rows] = await db.query('SELECT id FROM admins LIMIT 1');
    if (rows.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'onix2024', 10);
      await db.query(
        'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
        [process.env.ADMIN_USERNAME || 'admin', hash]
      );
      console.log('✅  Default admin account created  →  user: admin  |  pass: onix2026');
    }
  } catch (err) {
    console.error('Seed admin error:', err.message);
  }
}

// ─── Multer — File Upload Setup ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const typeMap = {
      project : 'public/images/projects',
      team    : 'public/images/team',
      video   : 'public/videos',
      logo    : 'public/images'
    };
    const dest = typeMap[req.body.upload_type] || 'public/uploads';
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },   // 100 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|svg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.','');
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Unauthorized — please log in via /admin' });
}

// ─── DB Guard ─────────────────────────────────────────────────────────────────
function requireDB(req, res, next) {
  if (!db) return res.status(503).json({ error: 'Database not connected' });
  next();
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN AUTH ROUTES
//  POST /api/admin/login
//  POST /api/admin/logout
//  GET  /api/admin/check
// ═══════════════════════════════════════════════════════════════

app.post('/api/admin/login', requireDB, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ?', [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid)  return res.status(401).json({ error: 'Invalid credentials' });

    req.session.adminId  = rows[0].id;
    req.session.username = rows[0].username;
    res.json({ success: true, username: rows[0].username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.adminId)
    res.json({ loggedIn: true, username: req.session.username });
  else
    res.json({ loggedIn: false });
});

// ═══════════════════════════════════════════════════════════════
//  SETTINGS API
//  GET  /api/settings          → returns all site settings
//  POST /api/admin/settings    → update a setting (text or file)
// ═══════════════════════════════════════════════════════════════

app.get('/api/settings', requireDB, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const result = {};
    rows.forEach(r => { result[r.setting_key] = r.setting_value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings', requireAuth, requireDB, upload.single('file'), async (req, res) => {
  try {
    const { setting_key, setting_value, upload_type } = req.body;
    let value = setting_value;

    if (req.file) {
      const pathMap = {
        video   : '/videos/'           + req.file.filename,
        logo    : '/images/'           + req.file.filename,
        project : '/images/projects/'  + req.file.filename,
        team    : '/images/team/'      + req.file.filename
      };
      value = pathMap[upload_type] || '/uploads/' + req.file.filename;
    }

    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=?',
      [setting_key, value, value]
    );
    res.json({ success: true, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  PROJECTS API  (Portfolio Gallery)
//  GET    /api/projects              → list all active projects
//  POST   /api/admin/projects        → add new project + image
//  PUT    /api/admin/projects/:id    → edit project
//  DELETE /api/admin/projects/:id    → soft-delete project
// ═══════════════════════════════════════════════════════════════

app.get('/api/projects', requireDB, async (req, res) => {
  try {
    const { page } = req.query;
    console.log(`[GET] /api/projects?page=${page}`);
    let sql = 'SELECT id, title, category, description, image_path, display_order, target_page FROM projects WHERE is_active = 1';
    
    if (page === 'home') {
      sql += ' AND (target_page = "home" OR target_page = "both" OR target_page IS NULL)';
    } else if (page === 'work') {
      sql += ' AND (target_page = "work" OR target_page = "both" OR target_page IS NULL)';
    }

    sql += ' ORDER BY display_order ASC, created_at DESC LIMIT 60';

    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/projects', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    console.log('[POST] /api/admin/projects', req.body);
    const { title, category, description, display_order, target_page } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const image_path = req.file ? '/images/projects/' + req.file.filename : '';
    const [result] = await db.query(
      'INSERT INTO projects (title, category, description, image_path, display_order, target_page) VALUES (?,?,?,?,?,?)',
      [title, category || 'Architecture', description || '', image_path, display_order || 0, target_page || 'both']
    );
    res.status(201).json({ success: true, id: result.insertId, image_path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/projects/:id', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    console.log(`[PUT] /api/admin/projects/${req.params.id}`, req.body);
    const { title, category, description, display_order, is_active, target_page } = req.body;
    const updates = { title, category, description, display_order, is_active, target_page };
    if (req.file) updates.image_path = '/images/projects/' + req.file.filename;

    const keys   = Object.keys(updates).filter(k => updates[k] !== undefined);
    const values = keys.map(k => updates[k]);
    values.push(req.params.id);

    await db.query(
      `UPDATE projects SET ${keys.map(k => `${k}=?`).join(', ')} WHERE id=?`,
      values
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/projects/:id', requireAuth, requireDB, async (req, res) => {
  try {
    await db.query('UPDATE projects SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SERVICES API  (Services Page)
//  GET    /api/services              → list all active services
//  POST   /api/admin/services        → add service
//  PUT    /api/admin/services/:id    → edit service
//  DELETE /api/admin/services/:id    → soft-delete service
// ═══════════════════════════════════════════════════════════════

app.get('/api/services', requireDB, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, description, icon, display_order FROM services WHERE is_active=1 ORDER BY display_order ASC'
    );
    console.log(`[API] Services fetched: ${rows.length} items`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/services', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, icon, display_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const [r] = await db.query(
      'INSERT INTO services (title, description, icon, display_order) VALUES (?,?,?,?)',
      [title, description || '', icon || 'building', display_order || 0]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/services/:id', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, icon, display_order, is_active } = req.body;
    await db.query(
      'UPDATE services SET title=?, description=?, icon=?, display_order=?, is_active=? WHERE id=?',
      [title, description, icon, display_order, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/services/:id', requireAuth, requireDB, async (req, res) => {
  try {
    await db.query('UPDATE services SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  TEAM API  (About Page — Instagram-style row)
//  GET    /api/team              → list all active team members
//  POST   /api/admin/team        → add team member + photo
//  PUT    /api/admin/team/:id    → edit team member
//  DELETE /api/admin/team/:id    → soft-delete
// ═══════════════════════════════════════════════════════════════

app.get('/api/team', requireDB, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, role, image_path, display_order FROM team_photos WHERE is_active=1 ORDER BY display_order ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/team', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    const { name, role, display_order } = req.body;
    const image_path = req.file ? '/images/team/' + req.file.filename : '';
    const [r] = await db.query(
      'INSERT INTO team_photos (name, role, image_path, display_order) VALUES (?,?,?,?)',
      [name || '', role || '', image_path, display_order || 0]
    );
    res.status(201).json({ success: true, id: r.insertId, image_path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/team/:id', requireAuth, requireDB, upload.single('image'), async (req, res) => {
  try {
    const { name, role, display_order, is_active } = req.body;
    const updates = { name, role, display_order, is_active };
    if (req.file) updates.image_path = '/images/team/' + req.file.filename;

    const keys   = Object.keys(updates).filter(k => updates[k] !== undefined);
    const values = [...keys.map(k => updates[k]), req.params.id];
    await db.query(
      `UPDATE team_photos SET ${keys.map(k => `${k}=?`).join(', ')} WHERE id=?`,
      values
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/team/:id', requireAuth, requireDB, async (req, res) => {
  try {
    await db.query('UPDATE team_photos SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  WORKSHOPS API  (Training Page)
//  GET    /api/workshops              → list all active workshops
//  POST   /api/admin/workshops        → add workshop
//  PUT    /api/admin/workshops/:id    → edit workshop
//  DELETE /api/admin/workshops/:id    → soft-delete
// ═══════════════════════════════════════════════════════════════

app.get('/api/workshops', requireDB, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, description, learn_more, our_speakers, business_knowledge, date_label, display_order FROM workshops WHERE is_active=1 ORDER BY display_order ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/workshops', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, learn_more, our_speakers, business_knowledge, date_label, display_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const [r] = await db.query(
      'INSERT INTO workshops (title, description, learn_more, our_speakers, business_knowledge, date_label, display_order) VALUES (?,?,?,?,?,?,?)',
      [title, description || '', learn_more || '', our_speakers || '', business_knowledge || '', date_label || '', display_order || 0]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/workshops/:id', requireAuth, requireDB, async (req, res) => {
  try {
    const { title, description, learn_more, our_speakers, business_knowledge, date_label, display_order, is_active } = req.body;
    await db.query(
      'UPDATE workshops SET title=?, description=?, learn_more=?, our_speakers=?, business_knowledge=?, date_label=?, display_order=?, is_active=? WHERE id=?',
      [title, description, learn_more, our_speakers, business_knowledge, date_label, display_order, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/workshops/:id', requireAuth, requireDB, async (req, res) => {
  try {
    await db.query('UPDATE workshops SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ABOUT CONTENT API  (About Page — narrative text)
//  GET   /api/about              → get all about text
//  POST  /api/admin/about        → update about text
// ═══════════════════════════════════════════════════════════════

app.get('/api/about', requireDB, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT content_key, content_value FROM about_content');
    const result = {};
    rows.forEach(r => { result[r.content_key] = r.content_value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/about', requireAuth, requireDB, async (req, res) => {
  try {
    const { content_key, content_value } = req.body;
    await db.query(
      'INSERT INTO about_content (content_key, content_value) VALUES (?,?) ON DUPLICATE KEY UPDATE content_value=?',
      [content_key, content_value, content_value]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  API STATUS  (health check)
//  GET /api/status
// ═══════════════════════════════════════════════════════════════

app.get('/api/status', (req, res) => {
  res.json({
    server  : 'running',
    database: db ? 'connected' : 'disconnected',
    node    : process.version,
    time    : new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════
//  PAGE ROUTES  (serve HTML files)
// ═══════════════════════════════════════════════════════════════

const pub = (file) => (req, res) =>
  res.sendFile(path.join(__dirname, 'public', file));

app.get(['/admin', '/admin/*splat'], pub('admin.html'));
app.get(['/about',    '/about.html'],    pub('about.html'));
app.get(['/services', '/services.html'], pub('services.html'));
app.get(['/training', '/training.html'], pub('training.html'));
app.get(['/work',     '/work.html'],     pub('work.html'));
app.get(['/contact',  '/contact.html'],  pub('contact.html'));
app.get(['/', '/home.html', '/index.html', '/{*splat}'], pub('index.html'));

// ─── Start Server ─────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀  Onix server  →  http://localhost:${PORT}`);
    console.log(`🔧  Admin panel  →  http://localhost:${PORT}/admin`);
    console.log(`📊  API status   →  http://localhost:${PORT}/api/status\n`);
  });
});

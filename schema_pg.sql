-- ═══════════════════════════════════════════════════════════════
--  ONIX ARCHITECTURE — PostgreSQL Database Schema
-- ═══════════════════════════════════════════════════════════════

-- ─── TABLE: admins ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLE: settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            SERIAL PRIMARY KEY,
  setting_key   VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLE: projects ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  category      VARCHAR(100),
  description   TEXT,
  image_path    VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  target_page   VARCHAR(50) DEFAULT 'both',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLE: services ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  icon          VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
);

-- ─── TABLE: team_photos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_photos (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255),
  role          VARCHAR(255),
  image_path    VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
);

-- ─── TABLE: workshops ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshops (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  learn_more        TEXT,
  our_speakers      TEXT,
  business_knowledge TEXT,
  date_label        VARCHAR(100),
  display_order     INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE
);

-- ─── TABLE: about_content ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about_content (
  id            SERIAL PRIMARY KEY,
  content_key   VARCHAR(100) NOT NULL UNIQUE,
  content_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
--  DEFAULT SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Settings
INSERT INTO settings (setting_key, setting_value) VALUES
  ('site_name',       'Onix Studio'),
  ('hero_video_path', ''),
  ('hero_title',      'Architecture is Experience'),
  ('hero_subtitle',   'We craft spaces that transcend the ordinary — balancing material, light, and proportion into living art.'),
  ('footer_text',     '© 2026 Onix Studio. All rights reserved.')
ON CONFLICT (setting_key) DO NOTHING;

-- Services
INSERT INTO services (title, description, icon, display_order) VALUES
  ('Architecture',            'We design buildings that balance function and artistry — from initial concept to final structure, every detail considered.',          'building', 1),
  ('Interior Design',         'Curating interior environments that reflect personality, purpose, and exceptional craftsmanship.',                                      'layout',   2),
  ('Sustainable Design',      'Integrating eco-conscious principles into modern design — minimizing footprint while maximizing beauty.',                               'leaf',     3),
  ('Brand Identity',          'Crafting visual identities for architecture and design firms, anchored in strategy and refined aesthetics.',                            'award',    4),
  ('Construction Consulting', 'Expert guidance through the construction process — ensuring quality, timelines, and vision are preserved.',                             'tool',     5)
ON CONFLICT DO NOTHING;

-- About content
INSERT INTO about_content (content_key, content_value) VALUES
  ('narrative', 'Architecture is about experience, not only visual. We design spaces that balance right material and proportion, inspired by contemporary study and timeless craft. Our work is a dialogue between the built and the lived — where structure meets sensitivity, and form follows feeling. Every project begins with deep listening, ends in precise execution, and exists to elevate the human experience.'),
  ('mission',   'To shape environments that endure — not just in material, but in memory.')
ON CONFLICT (content_key) DO NOTHING;

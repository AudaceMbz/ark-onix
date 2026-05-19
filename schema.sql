zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz -- ═══════════════════════════════════════════════════════════════
--  ONIX ARCHITECTURE — MySQL Database Schema
--  Run this file in MySQL Workbench or via: mysql -u root -p < schema.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create & use the database
CREATE DATABASE IF NOT EXISTS onyx_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE onyx_db;

-- ─── TABLE: admins ───────────────────────────────────────────────────────────
-- Stores admin login credentials (password is bcrypt-hashed)
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── TABLE: settings ─────────────────────────────────────────────────────────
-- Stores site-wide settings: logo, hero video, titles, footer text
CREATE TABLE IF NOT EXISTS settings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── TABLE: projects ─────────────────────────────────────────────────────────
-- Stores portfolio project cards shown in the gallery
CREATE TABLE IF NOT EXISTS projects (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  category      VARCHAR(100),
  description   TEXT,
  image_path    VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  target_page   VARCHAR(20) DEFAULT 'both',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── TABLE: services ─────────────────────────────────────────────────────────
-- Stores the list of services shown on the Services page
CREATE TABLE IF NOT EXISTS services (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  icon          VARCHAR(100),              -- e.g. 'building', 'layout', 'leaf'
  display_order INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- ─── TABLE: team_photos ──────────────────────────────────────────────────────
-- Stores team member photos shown in Instagram-style row on About page
CREATE TABLE IF NOT EXISTS team_photos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255),
  role          VARCHAR(255),
  image_path    VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- ─── TABLE: workshops ────────────────────────────────────────────────────────
-- Stores training workshops with 3 collapsible dropdown sections each
CREATE TABLE IF NOT EXISTS workshops (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  learn_more        TEXT,           -- "Learn from the best in the industry"
  our_speakers      TEXT,           -- "Our speakers"
  business_knowledge TEXT,          -- "Improve your business knowledge"
  date_label        VARCHAR(100),
  display_order     INT DEFAULT 0,
  is_active         TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- ─── TABLE: about_content ────────────────────────────────────────────────────
-- Stores editable text content for the About page
CREATE TABLE IF NOT EXISTS about_content (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  content_key   VARCHAR(100) NOT NULL UNIQUE,
  content_value LONGTEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════════════════════
--  DEFAULT SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
  ('site_name',       'Onix Studio'),
  ('hero_video_path', ''),
  ('hero_title',      'Architecture is Experience'),
  ('hero_subtitle',   'We craft spaces that transcend the ordinary — balancing material, light, and proportion into living art.'),
  ('footer_text',     '© 2024 Onix Studio. All rights reserved.');

-- Services
INSERT IGNORE INTO services (title, description, icon, display_order) VALUES
  ('Architecture',            'We design buildings that balance function and artistry — from initial concept to final structure, every detail considered.',          'building', 1),
  ('Interior Design',         'Curating interior environments that reflect personality, purpose, and exceptional craftsmanship.',                                      'layout',   2),
  ('Sustainable Design',      'Integrating eco-conscious principles into modern design — minimizing footprint while maximizing beauty.',                               'leaf',     3),
  ('Brand Identity',          'Crafting visual identities for architecture and design firms, anchored in strategy and refined aesthetics.',                            'award',    4),
  ('Construction Consulting', 'Expert guidance through the construction process — ensuring quality, timelines, and vision are preserved.',                             'tool',     5);

-- About content
INSERT IGNORE INTO about_content (content_key, content_value) VALUES
  ('narrative', 'Architecture is about experience, not only visual. We design spaces that balance right material and proportion, inspired by contemporary study and timeless craft. Our work is a dialogue between the built and the lived — where structure meets sensitivity, and form follows feeling. Every project begins with deep listening, ends in precise execution, and exists to elevate the human experience.'),
  ('mission',   'To shape environments that endure — not just in material, but in memory.');

-- Workshops
INSERT IGNORE INTO workshops (title, description, learn_more, our_speakers, business_knowledge, date_label, display_order) VALUES
  (
    'Foundations of Modern Architecture',
    'An intensive exploration of contemporary architectural theory and practice.',
    'Learn from the best in the industry — our workshops bring together leading architects, designers, and thinkers to share methodologies, case studies, and hands-on experience.',
    'Our speakers include award-winning architects, urban planners, and design innovators who have shaped landmark projects across the globe.',
    'Improve your business knowledge with sessions on client acquisition, project management, fee structures, and building a sustainable architecture practice.',
    'Spring 2026', 1
  ),
  (
    'Interior Design Mastery',
    'Deep-dive into the principles and practices of high-end interior environments.',
    'Learn directly from industry-defining interior designers who blend culture, material science, and spatial psychology into transformative spaces.',
    'Featuring principals from top-tier international design studios, our speakers bring real-world experience and unconventional perspectives.',
    'Understand how interior design firms operate — from pitch to delivery — and how to position your practice in a competitive market.',
    'Summer 2026', 2
  ),
  (
    'Sustainable Architecture Workshop',
    'Practical strategies for designing environmentally responsible buildings.',
    'Our sustainability experts teach proven methods for reducing environmental impact while achieving stunning design results.',
    'Speakers include LEED-certified designers, environmental engineers, and policy advisors working at the frontier of green construction.',
    'Discover how sustainability is becoming a business differentiator — attracting clients, meeting regulations, and future-proofing your practice.',
    'Autumn 2026', 3
  );

-- Sample Projects (replace image_path once you upload real images via admin)
INSERT IGNORE INTO projects (title, category, description, image_path, display_order) VALUES
  ('The Glass Pavilion',   'Architecture',    'A transparent sanctuary immersed in nature — where boundaries between inside and outside dissolve.',   '/images/projects/project_01.jpg', 1),
  ('Meridian House',       'Residential',     'A contemporary family home sculpted from concrete and warmth, designed for connection.',                 '/images/projects/project_02.jpg', 2),
  ('The Cascade Stair',    'Interior Design', 'A floating staircase that becomes the soul of a luxury penthouse.',                                     '/images/projects/project_03.jpg', 3),
  ('Luminary Tower',       'Commercial',      'An urban mixed-use development defining a new skyline landmark.',                                        '/images/projects/project_04.jpg', 4),
  ('Serenity Suite',       'Interior Design', 'A private residence bedroom suite draped in natural textures and calm.',                                 '/images/projects/project_05.jpg', 5),
  ('Courtyard Residence',  'Residential',     'A family home organized around a private courtyard, creating natural light and privacy in equal measure.','/images/projects/project_06.jpg', 6);

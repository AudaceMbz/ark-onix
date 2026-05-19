# 🏛️ Onix Studio — Full-Stack Architecture & Developer Guide

> A premium architecture studio website with a full-featured admin panel, dynamic content management, and a hybrid MySQL/PostgreSQL database backend.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Public Pages](#4-public-pages)
5. [Admin Panel](#5-admin-panel)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Schema](#7-database-schema)
8. [REST API Reference](#8-rest-api-reference)
9. [File Upload System](#9-file-upload-system)
10. [Authentication & Sessions](#10-authentication--sessions)
11. [Environment Variables](#11-environment-variables)
12. [Local Development Setup](#12-local-development-setup)
13. [Production Deployment (Render)](#13-production-deployment-render)
14. [Frontend JavaScript Modules](#14-frontend-javascript-modules)
15. [CSS Architecture](#15-css-architecture)

---

## 1. Project Overview

**Onix Studio** is a full-stack web application for an architecture and interior design firm. It provides:

- A **public-facing website** with six pages (Home, About, Services, Work, Training, Contact).
- A **password-protected admin panel** for managing all site content — projects, services, team members, workshops, settings, and media assets.
- A **Node.js/Express backend** that serves both the HTML files and a JSON REST API.
- A **hybrid database layer** that automatically uses **MySQL** in local development and **PostgreSQL** in production (Render.com).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Web Framework** | Express.js v5 |
| **Database (Local)** | MySQL 8+ via `mysql2` |
| **Database (Production)** | PostgreSQL via `pg` (Pool) |
| **Authentication** | `express-session` + `bcryptjs` password hashing |
| **File Uploads** | `multer` (disk storage) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Environment** | `dotenv` |
| **CORS** | `cors` middleware |
| **Hosting** | Render.com (production), localhost (development) |

---

## 3. Project Structure

```
onix/
├── server.js                  ← Main backend entry point (all API + routing)
├── package.json               ← Node dependencies & npm scripts
├── schema.sql                 ← MySQL schema + seed data
├── schema_pg.sql              ← PostgreSQL equivalent schema
├── onix_db_backup.sql         ← Database backup snapshot
├── .env                       ← Local environment variables (git-ignored)
├── .env.example               ← Environment variable template
├── .gitignore
│
└── public/                    ← All static frontend files
    ├── index.html             ← Home page
    ├── about.html             ← About page
    ├── services.html          ← Services page
    ├── work.html              ← Work / Portfolio page
    ├── training.html          ← Training & Workshops page
    ├── contact.html           ← Contact page
    ├── admin.html             ← Admin panel (SPA-style)
    │
    ├── css/
    │   ├── style.css          ← Global styles for all public pages
    │   └── admin.css          ← Dedicated styles for the admin panel
    │
    ├── js/
    │   ├── app.js             ← Main frontend logic (navbar, animations, API calls)
    │   ├── page.js            ← Page-specific logic (Training, Work, About, Contact)
    │   └── admin.js           ← All admin panel CRUD logic
    │
    ├── images/
    │   ├── projects/          ← Uploaded project images
    │   └── team/              ← Uploaded team member photos
    │
    ├── videos/                ← Uploaded hero videos
    └── uploads/               ← Generic fallback upload directory
```

---

## 4. Public Pages

All public pages share the same navigation and footer, controlled by `app.js` and `style.css`.

### 🏠 Home — `index.html`
- **Hero section** with a full-screen background video (managed via admin).
- **Animated headline** with a tagline about the studio.
- **Featured Projects** gallery (fetches from `/api/projects?page=home`).
- **Services overview** strip.
- **Call-to-action** footer band linking to the Contact page.

### 👥 About — `about.html`
- **Narrative text** block — pulled from `/api/about` (`narrative` key).
- **Mission statement** — pulled from `/api/about` (`mission` key).
- **Team members** — Instagram-style photo row fetched from `/api/team`.
- Content is fully editable from the admin panel.

### 🔧 Services — `services.html`
- Displays all active services fetched from `/api/services`.
- Each service card shows an **icon**, **title**, and **description**.
- Icons use a custom icon mapping (e.g. `building`, `layout`, `leaf`, `award`, `tool`).

### 🖼️ Work — `work.html`
- Full portfolio gallery — fetches from `/api/projects?page=work`.
- Projects are filterable by category.
- Each card shows project **image**, **title**, **category**, and **description**.

### 🎓 Training — `training.html`
- Lists all active workshops fetched from `/api/workshops`.
- Each workshop card has **three collapsible accordion sections**:
  1. **Learn More** — industry-learning details.
  2. **Our Speakers** — speaker highlights.
  3. **Business Knowledge** — business practice insights.
- Includes a **date label** badge per workshop.

### 📬 Contact — `contact.html`
- A styled **contact form** for visitor enquiries.
- Displays the studio's address, email, and phone details.
- Form submission currently handles client-side validation.

---

## 5. Admin Panel

**URL:** `http://localhost:3000/admin`

The admin panel is a **single-page application** embedded in `admin.html`, powered entirely by `admin.js`. It uses tab-based navigation — no page reloads.

### 🔐 Login
- Protected by a session-based login (`POST /api/admin/login`).
- Default credentials (set in `.env` or seeded automatically):
  - **Username:** `admin`
  - **Password:** `onix2026`
- Sessions persist for **24 hours**.

### 📌 Admin Tabs

| Tab | What you can manage |
|---|---|
| **Projects** | Add, edit, delete portfolio projects. Upload cover image. Set display order and target page (`home`, `work`, `both`). |
| **Services** | Add, edit, soft-delete services. Choose icon from a predefined list. Set display order. |
| **Team** | Add, edit, delete team members. Upload portrait photo. Set name, role, and display order. |
| **Workshops** | Add, edit, soft-delete training workshops. Fill all three accordion sections, date label, and display order. |
| **About** | Edit the studio narrative and mission statement text blocks. |
| **Settings** | Upload/remove site logo. Upload/remove hero video. Edit site name, hero title, hero subtitle, and footer text. |

---

## 6. Backend Architecture

All backend logic lives in a **single file**: `server.js`.

### Startup Flow

```
node server.js
    │
    ├── Load .env  (dotenv)
    ├── Configure Express middleware
    │     ├── cors()
    │     ├── express.json()
    │     ├── express.static('public/')
    │     └── express-session()
    │
    ├── connectDB()
    │     ├── DATABASE_URL or RENDER env set?
    │     │     └── YES → Connect PostgreSQL Pool
    │     │     └── NO  → Connect MySQL Pool
    │     │
    │     └── seedAdmin()  ← Create default admin if none exists
    │
    └── app.listen(PORT)
```

### Hybrid Database Query Wrapper

The server uses a `query(sql, params)` wrapper that transparently handles both MySQL (`?` placeholders) and PostgreSQL (`$1, $2` placeholders):

```js
// MySQL:    SELECT * FROM users WHERE id = ?
// Postgres: SELECT * FROM users WHERE id = $1
async function query(sql, params = []) { ... }
```

This means all SQL in the codebase is written with `?` placeholders — the wrapper auto-converts for PostgreSQL.

### Middleware Chain

| Middleware | Purpose |
|---|---|
| `cors()` | Allow cross-origin API requests |
| `express.json()` | Parse JSON request bodies |
| `express.urlencoded()` | Parse form POST data |
| `express.static('public/')` | Serve all frontend files |
| `express-session` | Cookie-based admin sessions (24 h TTL) |
| `requireAuth` | Guard — rejects requests if no active session |
| `requireDB` | Guard — rejects requests if DB is not connected |

---

## 7. Database Schema

Six tables make up the complete data model.

### `admins`
Stores admin login credentials.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | Auto-increment |
| `username` | VARCHAR(100) | Unique |
| `password_hash` | VARCHAR(255) | bcrypt hash |
| `created_at` | TIMESTAMP | Auto |

### `settings`
Key-value store for site-wide settings.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `setting_key` | VARCHAR(100) | Unique key (e.g. `hero_title`) |
| `setting_value` | TEXT | The stored value |
| `updated_at` | TIMESTAMP | Auto-updated |

**Default setting keys:** `site_name`, `hero_video_path`, `hero_title`, `hero_subtitle`, `footer_text`, `logo_path`

### `projects`
Portfolio project cards.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `title` | VARCHAR(255) | |
| `category` | VARCHAR(100) | e.g. Architecture, Residential |
| `description` | TEXT | |
| `image_path` | VARCHAR(500) | e.g. `/images/projects/file.jpg` |
| `display_order` | INT | Lower = shown first |
| `is_active` | TINYINT(1) | 1 = visible, 0 = hidden |
| `target_page` | VARCHAR(20) | `home`, `work`, or `both` |
| `created_at` | TIMESTAMP | |

### `services`
Services shown on the Services page.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `title` | VARCHAR(255) | |
| `description` | TEXT | |
| `icon` | VARCHAR(100) | Icon name key |
| `display_order` | INT | |
| `is_active` | TINYINT(1) | Soft-delete flag |

### `team_photos`
Team member profiles shown on the About page.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `name` | VARCHAR(255) | |
| `role` | VARCHAR(255) | |
| `image_path` | VARCHAR(500) | |
| `display_order` | INT | |
| `is_active` | TINYINT(1) | |

### `workshops`
Training workshops with three text sections each.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `title` | VARCHAR(255) | |
| `description` | TEXT | Summary shown on the card |
| `learn_more` | TEXT | Accordion section 1 |
| `our_speakers` | TEXT | Accordion section 2 |
| `business_knowledge` | TEXT | Accordion section 3 |
| `date_label` | VARCHAR(100) | e.g. "Spring 2026" |
| `display_order` | INT | |
| `is_active` | TINYINT(1) | |

### `about_content`
Key-value store for editable About page text.
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `content_key` | VARCHAR(100) | Unique (`narrative`, `mission`) |
| `content_value` | LONGTEXT | |
| `updated_at` | TIMESTAMP | |

---

## 8. REST API Reference

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/settings` | Get all site settings as a key-value object |
| `GET` | `/api/projects?page=home\|work` | Get active projects, optionally filtered by page |
| `GET` | `/api/services` | Get all active services |
| `GET` | `/api/team` | Get all active team members |
| `GET` | `/api/workshops` | Get all active workshops |
| `GET` | `/api/about` | Get all about page content as a key-value object |
| `GET` | `/api/status` | Server and database health check |

### Admin Endpoints (session auth required)

#### Authentication
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/admin/login` | `{ username, password }` | Login and create session |
| `POST` | `/api/admin/logout` | — | Destroy session |
| `GET` | `/api/admin/check` | — | Returns `{ loggedIn: true/false }` |

#### Projects
| Method | Endpoint | Body / File | Description |
|---|---|---|---|
| `POST` | `/api/admin/projects` | form-data: `title, category, description, display_order, target_page, image (file)` | Create a new project |
| `PUT` | `/api/admin/projects/:id` | same as POST | Update a project |
| `DELETE` | `/api/admin/projects/:id` | — | Delete project and its image file |

#### Services
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/admin/services` | `{ title, description, icon, display_order }` | Create service |
| `PUT` | `/api/admin/services/:id` | `{ title, description, icon, display_order, is_active }` | Update service |
| `DELETE` | `/api/admin/services/:id` | — | Soft-delete (sets `is_active = 0`) |

#### Team
| Method | Endpoint | Body / File | Description |
|---|---|---|---|
| `POST` | `/api/admin/team` | form-data: `name, role, display_order, image (file)` | Add team member |
| `PUT` | `/api/admin/team/:id` | same as POST | Update team member |
| `DELETE` | `/api/admin/team/:id` | — | Delete member and image file |

#### Workshops
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/admin/workshops` | `{ title, description, learn_more, our_speakers, business_knowledge, date_label, display_order }` | Create workshop |
| `PUT` | `/api/admin/workshops/:id` | same as POST + `is_active` | Update workshop |
| `DELETE` | `/api/admin/workshops/:id` | — | Soft-delete |

#### About Content
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/admin/about` | `{ content_key, content_value }` | Upsert (insert or update) a content block |

#### Settings & Media
| Method | Endpoint | Body / File | Description |
|---|---|---|---|
| `POST` | `/api/admin/settings` | form-data: `setting_key, setting_value, upload_type, file` | Upsert a setting. If a file is uploaded, old file is deleted automatically |
| `DELETE` | `/api/admin/settings/:key` | — | Delete file from disk and clear the setting value. Valid keys: `logo_path`, `hero_video_path` |

---

## 9. File Upload System

File uploads are handled by **Multer** with disk storage.

### Upload Type → Destination Mapping

| `upload_type` value | Saved to directory |
|---|---|
| `project` | `public/images/projects/` |
| `team` | `public/images/team/` |
| `video` | `public/videos/` |
| `logo` | `public/images/` |
| *(anything else)* | `public/uploads/` |

### Filename Generation
Files are saved with a timestamped random name to avoid collisions:
```
{Date.now()}-{randomInt}{extension}
e.g. 1716052800123-742.jpg
```

### Old File Cleanup
When a new file replaces an existing one (e.g. uploading a new logo), the server **automatically deletes the old file from disk** before saving the new record.

---

## 10. Authentication & Sessions

- Passwords are hashed with **bcrypt** (10 salt rounds) before storage.
- Sessions are stored **in-memory** on the server (via `express-session`).
- The session cookie is:
  - `secure: true` in production (HTTPS only)
  - `maxAge: 24 hours`
- The `requireAuth` middleware checks `req.session.adminId`. Any request without a valid session gets a `401 Unauthorized` response.
- On first startup with an empty `admins` table, `seedAdmin()` inserts the default admin from `.env`.

---

## 11. Environment Variables

Copy `.env.example` to `.env` and fill in your values.

```env
# Server
PORT=3000
NODE_ENV=development

# MySQL (local development)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=onix_db

# PostgreSQL (production on Render — set DATABASE_URL instead)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Session
SESSION_SECRET=onix_secret_key_2026

# Default admin credentials (used on first boot if no admin exists)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=onix2026
```

> **Important:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 12. Local Development Setup

### Prerequisites
- **Node.js** v18+ installed
- **MySQL 8** running locally with a database named `onix_db`

### Steps

```bash
# 1. Clone or copy the project
cd "onix - Copy (2)"

# 2. Install dependencies
npm install

# 3. Set up environment
copy .env.example .env
# Edit .env with your MySQL credentials

# 4. Create the database
# Open MySQL Workbench or terminal, then run:
mysql -u root -p < schema.sql

# 5. Start the development server
npm run dev
# or
node server.js

# 6. Open in browser
# Public site:   http://localhost:3000
# Admin panel:   http://localhost:3000/admin
```

---

## 13. Production Deployment (Render)

The app is designed for **one-click deployment on Render.com**.

1. Push your code to a GitHub repository.
2. Create a new **Web Service** on Render pointing to the repo.
3. Set the **Start Command** to `node server.js`.
4. Add a **PostgreSQL database** on Render and copy the `DATABASE_URL`.
5. Set all environment variables in Render's dashboard:
   - `DATABASE_URL` ← from Render PostgreSQL
   - `SESSION_SECRET` ← a strong random string
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD`
   - `NODE_ENV=production`
6. Run `schema_pg.sql` against your PostgreSQL database to create tables.
7. Deploy — the server auto-detects `DATABASE_URL` and switches to PostgreSQL mode.

---

## 14. Frontend JavaScript Modules

### `public/js/app.js` — Main Application Logic
Runs on every public page. Responsibilities:
- **Navbar** — mobile drawer toggle, scroll behaviour, active link highlighting.
- **Settings loader** — fetches `/api/settings` on page load to set the site logo and hero video dynamically.
- **Home page** — renders featured project cards from the API.
- **Intersection Observer** — triggers fade-in animations for `.reveal` elements as they scroll into view.
- **Hero video** — initialises and autoplays the background video if configured.

### `public/js/page.js` — Page-Specific Logic
Handles the dynamic content for individual pages:
- **Work page** — fetches and renders the full project grid; handles category filter tabs.
- **Services page** — fetches and renders service cards with icon mapping.
- **Training page** — fetches workshops and builds accordion-style collapsible cards.
- **About page** — fetches narrative/mission text and team photo row.
- **Contact page** — client-side form validation and submission feedback.

### `public/js/admin.js` — Admin Panel Logic
Powers the entire admin panel SPA:
- Checks `GET /api/admin/check` on load — redirects to login form if not authenticated.
- Handles the **login form** submit (`POST /api/admin/login`).
- Manages **tab switching** between all admin sections.
- Implements full **CRUD** for Projects, Services, Team, Workshops, About, and Settings.
- Handles **file input previews** (image and video before upload).
- Displays **toast notifications** for success/error feedback.
- Handles **modal dialogs** for add/edit forms.

---

## 15. CSS Architecture

### `public/css/style.css` — Global Stylesheet
- **CSS custom properties** (`--color-*`, `--radius`, `--transition`, `--font-*`) define the design system.
- **Color palette:** deep dark backgrounds (`#0a0a0a`), warm gold accents (`#c9a96e`), soft off-white text.
- **Typography:** Google Fonts — *Cormorant Garamond* (headings) + *Inter* (body).
- **Layout utilities:** flexbox and CSS grid-based component layouts.
- **Responsive breakpoints:** `@media (max-width: 768px)` for tablet and mobile.
- **Component styles:** navbar, hero, project cards, service cards, team row, workshop accordions, footer, CTA band.
- **Animations:** `@keyframes fadeInUp`, `reveal` scroll animation class.

### `public/css/admin.css` — Admin Panel Stylesheet
- Isolated from the public site styles to prevent conflicts.
- **Sidebar navigation** with active tab indicators.
- **Form components:** inputs, selects, textareas, file pickers with preview areas.
- **Table layout** for listing CRUD items.
- **Toast notification** styles (success/error).
- **Modal overlay** styles for add/edit dialogs.
- **Responsive:** collapses to a mobile-friendly top-bar layout on small screens.

---

## Quick Reference Card

```
Public Routes
─────────────────────────────────
GET  /              → Home
GET  /about         → About
GET  /services      → Services
GET  /work          → Work/Portfolio
GET  /training      → Training & Workshops
GET  /contact       → Contact

Admin Routes
─────────────────────────────────
GET  /admin         → Admin Panel (requires login)

API Health
─────────────────────────────────
GET  /api/status    → Server + DB status

Default Admin Login
─────────────────────────────────
Username : admin
Password : onix2026
URL      : http://localhost:3000/admin
```

---

*Built with ❤️ for Onix Studio — Architecture is Experience.*

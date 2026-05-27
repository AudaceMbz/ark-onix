/* ═══════════════════════════════════════════════════════════
   ONYX — Shared Page Logic (about, services, training, work, contact)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const PAGE = document.body.dataset.page ||
    (location.pathname.includes('about') ? 'about' :
      location.pathname.includes('services') ? 'services' :
        location.pathname.includes('training') ? 'training' :
          location.pathname.includes('work') ? 'work' :
            location.pathname.includes('contact') ? 'contact' : 'home');

  let projects = [];
  let lightboxImages = [];
  let lightboxIdx = 0;
  let workPageSize = 10;
  let workVisibleCount = 0;
  let filteredProjects = [];
  let scrollObserver = null;
  let revealObserver = null;
  const API = '';

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initScrollReveal();
    initScrollNav();
    loadSettings();
    initPreloader();
    initCounters();

    // Page-specific loaders with instant skeletons
    if (document.getElementById('about-narrative')) loadAbout();
    if (document.getElementById('team-row') || document.getElementById('home-team-row') || document.getElementById('contact-team-row')) {
      renderTeamSkeleton();
      loadTeam();
    }
    if (document.getElementById('services-list')) {
      renderServicesSkeleton();
      loadServices();
    }
    if (document.getElementById('workshops-list')) {
      renderWorkshopsSkeleton();
      loadWorkshops();
    }
    if (document.getElementById('work-gallery')) {
      renderWorkGallerySkeleton();
      loadWorkGallery();
    }
    if (document.getElementById('contact-form')) initContactForm();
    if (document.getElementById('lightbox')) initLightbox();
  });

  // ─── SKELETON PRELOADER RENDERERS ───
  function renderTeamSkeleton() {
    const ids = ['team-row', 'home-team-row', 'contact-team-row'];
    let html = '';
    for (let i = 0; i < 2; i++) {
      html += `
        <div class="team-card-premium skeleton-card">
          <div class="skeleton skeleton-img"></div>
          <div class="team-front-info">
            <div class="skeleton skeleton-name"></div>
            <div class="skeleton skeleton-role"></div>
          </div>
        </div>
      `;
    }
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }

  function renderServicesSkeleton() {
    const el = document.getElementById('services-list');
    if (!el) return;
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `
        <div class="service-item skeleton-card">
          <div class="skeleton skeleton-num"></div>
          <div class="service-body">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
          </div>
          <div class="skeleton skeleton-icon"></div>
        </div>
      `;
    }
    el.innerHTML = html;
  }

  function renderWorkshopsSkeleton() {
    const el = document.getElementById('workshops-list');
    if (!el) return;
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `
        <div class="workshop-item skeleton-card">
          <div class="workshop-header">
            <div class="workshop-left">
              <div class="skeleton skeleton-date"></div>
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-text"></div>
            </div>
            <div class="skeleton skeleton-toggle"></div>
          </div>
        </div>
      `;
    }
    el.innerHTML = html;
  }

  function renderWorkGallerySkeleton() {
    const el = document.getElementById('work-gallery');
    if (!el) return;
    let html = '';
    for (let i = 0; i < 8; i++) {
      html += `
        <div class="gallery-item skeleton-card ${i === 0 ? 'featured' : ''}">
          <div class="skeleton skeleton-img"></div>
        </div>
      `;
    }
    el.innerHTML = html;
  }

  function initPreloader() {
    const loader = document.getElementById('site-loader');
    if (!loader) return;

    const startTime = Date.now();
    const minDuration = 2000; // 2 seconds

    window.addEventListener('load', () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      setTimeout(hideLoader, remaining);
    });

    // Safety timeout
    setTimeout(hideLoader, 5000);

    function hideLoader() {
      if (loader.classList.contains('fade-out')) return;
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 600);
    }
  }

  // ─── Theme ──────────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('onix-theme') || 'dark';
    setTheme(saved);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('onix-theme', theme);
    const moon = document.getElementById('icon-moon');
    const sun = document.getElementById('icon-sun');
    if (!moon || !sun) return;
    moon.style.display = theme === 'dark' ? 'block' : 'none';
    sun.style.display = theme === 'light' ? 'block' : 'none';
  }

  // ─── Nav Toggle (mobile) ─────────────────────────────────────
  function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    const header = document.getElementById('nav-header');
    if (!toggle || !links || !header) return;
    
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
      header.classList.toggle('nav-open');
    });
    
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
        header.classList.remove('nav-open');
      });
    });
  }

  function initScrollNav() {
    const header = document.getElementById('nav-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
    // Initial check
    header.classList.toggle('scrolled', window.scrollY > 20);
  }

  // ─── Settings (logo / footer) ─────────────────────────────────
  async function loadSettings() {
    try {
      const s = await fetchJSON('/api/settings');
      if (!s) return;
      document.documentElement.setAttribute('data-theme-color', s.site_color_theme || 'gold');
      updateFaviconTheme(s.site_color_theme || 'gold');

      // Update Site Name / Branding
      if (s.site_name) {
        document.querySelectorAll('.logo-text, .footer-logo-text').forEach(txt => {
          txt.textContent = s.site_name;
        });
        document.querySelectorAll('.logo-img, .footer-logo-img').forEach(img => {
          img.alt = s.site_name + ' Logo';
        });
        if (document.title.includes('ONIX STUDIO')) {
          document.title = document.title.replace('ONIX STUDIO', s.site_name);
        }
      }

      // Dynamic Logo Image
      if (s.logo_path) {
        document.querySelectorAll('.logo-img, .footer-logo-img').forEach(img => {
          img.src = s.logo_path;
          img.style.display = 'block';
        });
        document.querySelectorAll('.logo-text').forEach(txt => {
          if (txt.id === 'logo-text') txt.style.display = 'none';
        });
      }

      if (s.footer_text) {
        const ft = document.getElementById('footer-text');
        if (ft) ft.textContent = s.footer_text;
      }

      // Brand Film Video
      const vid = document.getElementById('about-brand-video-src');
      const brandVid = document.getElementById('about-brand-video');
      if (vid && brandVid && s.hero_video_path) {
        vid.src = s.hero_video_path;
        brandVid.load();
      }
    } catch (e) { }
  }

  // ─── Dynamic Favicon Updater ──────────────────────────────────
  function updateFaviconTheme(theme) {
    const themeMap = { neon: '#00ff00', emerald: '#10B981', gold: '#C9A96E', teal: '#0D9488', terracotta: '#D97757' };
    const hex = themeMap[theme] || '#C9A96E';
    fetch('/images/favicon.svg').then(r => r.text()).then(svg => {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) return;
      const newSvg = svg.replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="' + hex + '"');
      link.href = 'data:image/svg+xml;base64,' + btoa(newSvg);
    }).catch(e => console.log('Favicon update error:', e));
  }

  // ─── About ───────────────────────────────────────────────────
  async function loadAbout() {
    try {
      const data = await fetchJSON('/api/about');
      const el = document.getElementById('about-narrative');
      if (el && data.narrative) el.textContent = data.narrative;
    } catch (e) { }
  }

  // ─── Team ────────────────────────────────────────────────────
  async function loadTeam() {
    const aboutEl = document.getElementById('team-row');
    const homeEl = document.getElementById('home-team-row');
    const contactEl = document.getElementById('contact-team-row');

    // Roles that appear on the Home page
    const HOME_ROLES = ['ceo', 'manager', 'c.e.o', 'director', 'managing director'];

    try {
      const team = await fetchJSON('/api/team');

      // Helper: build a single team card element
      function buildCard(m, i) {
        const firstName = m.name ? m.name.split(' ')[0] : 'Expert';
        const card = document.createElement('div');
        card.className = 'team-card-premium reveal';
        card.style.transitionDelay = `${(i % 4) * 100}ms`;

        const desc = m.description || '';
        const phone = m.phone || '';
        const rawEmail = m.email || '';
        const calLink = m.calendar_link || '';
        const waLink = m.whatsapp_link || '';

        let actionCards = '';
        if (phone) {
          actionCards += `
            <a href="tel:${phone.replace(/\s+/g, '')}" class="team-action-card call-card">
              <div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
              <div class="team-action-text"><strong>Call</strong><span>${phone}</span></div>
            </a>`;
        }
        if (rawEmail) {
          actionCards += `
            <a href="mailto:${rawEmail}" class="team-action-card email-card">
              <div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
              <div class="team-action-text"><strong>Email</strong><span>${rawEmail}</span></div>
            </a>`;
        }
        if (calLink) {
          actionCards += `
            <a href="${calLink}" target="_blank" rel="noopener noreferrer" class="team-action-card schedule-card">
              <div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
              <div class="team-action-text"><strong>Schedule Meeting</strong><span>Book a time that works for you</span></div>
            </a>`;
        }
        if (waLink) {
          actionCards += `
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="team-action-card whatsapp-card">
              <div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg></div>
              <div class="team-action-text"><strong>WhatsApp</strong><span>Send a message</span></div>
            </a>`;
        }

        card.innerHTML = `
          <div class="team-front">
            <button class="team-contact-btn" aria-label="Contact ${m.name}">Contact</button>
            <div class="team-bg-text">${firstName}</div>
            <img class="team-agent-img" src="${m.image_path}" alt="${m.name}" loading="lazy" />
            <div class="team-front-info">
              <h4>${m.name}</h4>
              <span class="team-role">${m.role || ''}</span>
              ${desc ? `<p class="team-desc">${desc}</p>` : ''}
            </div>
          </div>
          <div class="team-back">
            <div class="team-back-header">
              <button class="team-back-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Profile
              </button>
              <img class="team-avatar" src="${m.image_path}" alt="${m.name}" onerror="this.style.display='none'" />
            </div>
            <div class="team-back-info">
              <h4>${m.name}</h4>
              <span>${m.role || ''}</span>
            </div>
            <div class="team-action-cards">${actionCards || '<p style="color:#888;text-align:center;padding:20px">No contact info available.</p>'}</div>
          </div>`;

        card.querySelector('.team-contact-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.add('flipped');
        });
        card.querySelector('.team-back-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.remove('flipped');
        });

        return card;
      }

      // Render helper for a given container with a filtered subset
      function renderInto(el, members) {
        if (!el) return;
        el.innerHTML = '';
        if (!members.length) {
          el.innerHTML = '<div class="team-empty">Team photos will appear here once uploaded from the admin panel.</div>';
          return;
        }
        members.forEach((m, i) => {
          const card = buildCard(m, i);
          el.appendChild(card);
          if (revealObserver) revealObserver.observe(card);
        });
        el.dataset.loaded = '1';
      }

      // Home page: CEO + Manager only
      const homeTeam = team.filter(m =>
        HOME_ROLES.includes((m.role || '').toLowerCase().trim())
      );
      renderInto(homeEl, homeTeam);

      // About & Contact: all members
      renderInto(aboutEl, team);
      renderInto(contactEl, team);

    } catch (e) {
      [aboutEl, homeEl, contactEl].forEach(el => {
        if (el) el.innerHTML = '<div class="team-empty">Team photos coming soon.</div>';
      });
    }
  }

  // ─── Services ────────────────────────────────────────────────
  const ICONS = {
    building: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="0"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`,
    layout: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 21V9"/></svg>`,
    leaf: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 8C8 10 5.9 16.17 3.82 19.5c4.13.84 7.97-.8 10.18-3 4-4 5-8 3-12z"/><path d="M3.82 19.5C5 18 8.6 14 16 14"/></svg>`,
    award: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    tool: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  };

  async function loadServices() {
    console.log('Loading Services...');
    const el = document.getElementById('services-list');
    if (!el) { console.log('services-list EL NOT FOUND'); return; }
    try {
      const services = await fetchJSON('/api/services');
      console.log('Services API result:', services);
      el.innerHTML = '';
      if (services.length === 0) {
        el.innerHTML = '<div style="padding:40px;color:var(--text-3)">No services found in database.</div>';
        return;
      }
      services.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'service-item reveal';
        div.style.transitionDelay = `${(i % 3) * 100}ms`;
        div.innerHTML = `
          <div class="service-number">${String(i + 1).padStart(2, '0')}</div>
          <div class="service-body">
            <h3>${s.title}</h3>
            <p>${s.description}</p>
          </div>
          <div class="service-icon">${ICONS[s.icon] || ICONS.building}</div>`;
        el.appendChild(div);
        if (revealObserver) revealObserver.observe(div);
      });
      triggerReveal();
    } catch (e) {
      el.innerHTML = '<div style="padding:40px;color:var(--text-3)">Services loading failed.</div>';
    }
  }

  // ─── Workshops ───────────────────────────────────────────────
  async function loadWorkshops() {
    const el = document.getElementById('workshops-list');
    if (!el) return;
    try {
      const workshops = await fetchJSON('/api/workshops');
      el.innerHTML = '';
      workshops.forEach((w, i) => {
        const item = document.createElement('div');
        item.className = 'workshop-item reveal';
        item.style.transitionDelay = `${(i % 3) * 100}ms`;
        item.innerHTML = `
          <div class="workshop-header">
            <div class="workshop-left">
              <div class="workshop-date">${w.date_label || ''}</div>
              <div class="workshop-title">${w.title}</div>
              <div class="workshop-desc">${w.description || ''}</div>
            </div>
            <button class="workshop-toggle" aria-label="Expand">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div class="workshop-body">
            <div class="workshop-dropdowns">
              ${makeDropdown('Learn from the best in the industry', w.learn_more)}
              ${makeDropdown('Our speakers', w.our_speakers)}
              ${makeDropdown('Improve your business knowledge', w.business_knowledge)}
            </div>
          </div>`;

        item.querySelector('.workshop-header').addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          document.querySelectorAll('.workshop-item').forEach(i => i.classList.remove('open'));
          if (!isOpen) item.classList.add('open');
        });

        item.querySelectorAll('.dropdown-trigger').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            btn.closest('.dropdown-item').classList.toggle('open');
          });
        });

        el.appendChild(item);
        if (revealObserver) revealObserver.observe(item);
      });
    } catch (e) {
      el.innerHTML = '<div style="padding:40px;color:var(--text-3)">Workshops loading failed.</div>';
    }
  }

  function makeDropdown(label, text) {
    return `
      <div class="dropdown-item">
        <button class="dropdown-trigger">
          <span class="dropdown-label">${label}</span>
          <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dropdown-content">
          <div class="dropdown-text">${text || 'Content coming soon.'}</div>
        </div>
      </div>`;
  }

  // ─── Work Gallery ────────────────────────────────────────────
  async function loadWorkGallery() {
    const el = document.getElementById('work-gallery');
    const filterEl = document.getElementById('work-filter');
    if (!el) return;
    try {
      projects = await fetchJSON('/api/projects?page=work');
      if (!filterEl.dataset.filtersInited) {
        const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
        categories.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = cat;
          btn.textContent = cat;
          btn.addEventListener('click', () => filterWork(cat));
          filterEl.appendChild(btn);
        });
        filterEl.querySelector('[data-filter="all"]').addEventListener('click', () => filterWork('all'));
        filterEl.dataset.filtersInited = '1';
      }
      filterWork('all');
    } catch (e) {
      el.innerHTML = '<div style="padding:60px;color:var(--text-3);text-align:center;grid-column:1/-1">No projects found. Add some from the admin panel.</div>';
    }
  }

  function filterWork(cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-filter="${cat}"]`)?.classList.add('active');

    filteredProjects = cat === 'all' ? projects : projects.filter(p => p.category === cat);
    lightboxImages = filteredProjects;
    lightboxIdx = 0;

    workVisibleCount = 0;
    renderNextWorkBatch(true);
    initWorkInfiniteScroll();
  }

  function renderNextWorkBatch(reset = false) {
    const el = document.getElementById('work-gallery');
    if (reset) el.innerHTML = '';

    const remaining = 60 - workVisibleCount;
    if (remaining <= 0) return;

    const countToLoad = Math.min(workPageSize, remaining);
    const nextBatch = filteredProjects.slice(workVisibleCount, workVisibleCount + countToLoad);

    nextBatch.forEach((p, i) => {
      const idx = workVisibleCount + i;
      const item = createGalleryItem(p, idx, filteredProjects);
      el.appendChild(item);
      if (revealObserver) revealObserver.observe(item);
    });

    workVisibleCount += nextBatch.length;
    triggerReveal();

    if (workVisibleCount >= filteredProjects.length || workVisibleCount >= 60) {
      if (scrollObserver) {
        const sentinel = document.getElementById('work-sentinel');
        if (sentinel) scrollObserver.unobserve(sentinel);
      }
    }
  }

  function initWorkInfiniteScroll() {
    const el = document.getElementById('work-gallery');
    if (!el) return;

    let sentinel = document.getElementById('work-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'work-sentinel';
      sentinel.style.height = '20px';
      sentinel.style.gridColumn = '1/-1';
      el.parentElement.appendChild(sentinel);
    }

    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (workVisibleCount < filteredProjects.length && workVisibleCount < 60) {
          renderNextWorkBatch();
        }
      }
    }, { threshold: 0.1 });

    scrollObserver.observe(sentinel);
  }

  function createGalleryItem(p, i, items) {
    const div = document.createElement('div');
    div.className = 'gallery-item reveal' + (i === 0 && items.length > 3 ? ' featured' : '');
    div.style.transitionDelay = `${(i % 3) * 100}ms`;
    div.dataset.index = i;
    const imgSrc = p.image_path || `/images/projects/project_0${(i % 5) + 1}.jpg`;
    div.innerHTML = `
      <img src="${imgSrc}" alt="${p.title}" loading="lazy" onerror="this.src='/images/projects/placeholder.jpg'" />
      <div class="gallery-item-overlay">
        <div class="gallery-item-info">
          <h3>${p.title}</h3>
          <span>${p.category || 'Architecture'}</span>
        </div>
      </div>`;
    div.addEventListener('click', () => openLightbox(i));
    return div;
  }

  // ─── Lightbox ─────────────────────────────────────────────────
  function initLightbox() {
    const lb = document.getElementById('lightbox');
    const close = document.getElementById('lightbox-close');
    const prev = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');
    if (!lb) return;

    close?.addEventListener('click', closeLightbox);
    prev?.addEventListener('click', () => moveLightbox(-1));
    next?.addEventListener('click', () => moveLightbox(1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') moveLightbox(-1);
      if (e.key === 'ArrowRight') moveLightbox(1);
    });
  }

  function openLightbox(idx) {
    lightboxIdx = idx;
    renderLightbox();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }

  function moveLightbox(dir) {
    lightboxIdx = (lightboxIdx + dir + lightboxImages.length) % lightboxImages.length;
    renderLightbox();
  }

  function renderLightbox() {
    const p = lightboxImages[lightboxIdx];
    if (!p) return;
    const imgSrc = p.image_path || `/images/projects/project_0${(lightboxIdx % 5) + 1}.jpg`;
    document.getElementById('lightbox-img').src = imgSrc;
    document.getElementById('lightbox-caption').textContent =
      `${p.title}${p.category ? ' — ' + p.category : ''}`;
  }

  // ─── Contact Form (WhatsApp Redirect) ────────────────────────
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const fb = document.getElementById('form-feedback');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = document.getElementById('contact-submit');

      // Helper to safely get values
      const val = id => document.getElementById(id)?.value || '';

      const name = val('contact-name');
      const email = val('contact-email');
      const subject = val('contact-subject');
      const phone = val('contact-phone');
      const loc = val('contact-location');
      const type = val('contact-type');
      const stage = val('contact-stage');
      const msg = val('contact-message');

      // Build text body dynamically based on available fields
      let body = `Hi ONIX STUDIO,%0A%0A` +
        `New Inquiry from Website:%0A` +
        `-------------------------%0A`;

      if (name) body += `Name: ${name}%0A`;
      if (email) body += `Email: ${email}%0A`;
      if (phone) body += `Phone: ${phone}%0A`;
      if (loc) body += `Location: ${loc}%0A`;
      if (subject) body += `Subject: ${subject}%0A`;
      if (type) body += `Type: ${type}%0A`;
      if (stage) body += `Stage: ${stage}%0A`;

      body += `%0AMessage:%0A${msg}`;

      const waUrl = `https://wa.me/250790128174?text=${body}`;

      btn.textContent = 'Opening WhatsApp...';
      btn.disabled = true;

      setTimeout(() => {
        window.open(waUrl, '_blank');
        btn.textContent = btn.classList.contains('btn-primary') ? 'Send Message' : 'GET IN TOUCH';
        btn.disabled = false;
        if (fb) {
          fb.textContent = '✓ Opening WhatsApp chat...';
          fb.style.color = '#25D366';
        }
      }, 800);
    });
  }

  // ─── Scroll Reveal ────────────────────────────────────────────
  function initScrollReveal() {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  function triggerReveal() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) el.classList.add('visible');
    });
  }

  // ─── Utility ──────────────────────────────────────────────────
  async function fetchJSON(url) {
    const res = await fetch(API + url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ─── Counters ───────────────────────────────────────────
  function initCounters() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent.trim();
          const targetValue = parseInt(text.replace(/[^0-9]/g, ''));
          const suffix = text.replace(/[0-9]/g, '');
          if (isNaN(targetValue)) return;
          animateValue(el, 0, targetValue, 2000, suffix);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
  }

  function animateValue(obj, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      obj.innerHTML = Math.floor(easedProgress * (end - start) + start) + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

})();

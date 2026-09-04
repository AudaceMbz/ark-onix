/* ═══════════════════════════════════════════════════════════
   ONYX — SPA Router & Page Logic
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────
  let projects = [];
  let lightboxImages = [];
  let lightboxIndex = 0;
  let revealObserver = null;
  const API = '';

  // ─── DOM Ready ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initRouter();
    initLightbox();
    initContactForm();
    initScrollReveal();
    initScrollNav();
    loadSettings();
    initCounters();
  });



  // ─── Theme ──────────────────────────────────────────────
  function initTheme() {
    let saved = 'dark';
    try { saved = localStorage.getItem('onix-theme') || 'dark'; } catch(e) {}
    setTheme(saved);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('onix-theme', theme); } catch(e) {}
    const moon = document.getElementById('icon-moon');
    const sun = document.getElementById('icon-sun');
    if (moon && sun) {
      if (theme === 'dark') {
        moon.style.display = 'block';
        sun.style.display = 'none';
      } else {
        moon.style.display = 'none';
        sun.style.display = 'block';
      }
    }
  }

  // ─── Nav ────────────────────────────────────────────────
  function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('fullscreen-menu');
    const header = document.getElementById('nav-header');
    
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.toggle('open');
      menu.classList.toggle('open', isOpen);
      header.classList.toggle('nav-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    document.querySelectorAll('.menu-link').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        menu.classList.remove('open');
        header.classList.remove('nav-open');
        document.body.style.overflow = '';
      });
    });
  }

  function initScrollNav() {
    const header = document.getElementById('nav-header');
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ─── Router ─────────────────────────────────────────────
  const ROUTES = {
    '/': 'home',
    '/about': 'about',
    '/services': 'services',
    '/training': 'training',
    '/work': 'work',
    '/contact': 'contact',
  };

  function initRouter() {
    // Handle all internal [data-page] links + nav links
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-page], a[href^="/"]');
      if (!a) return;

      // Skip admin links
      const href = a.getAttribute('href') || '/';
      if (href.startsWith('/admin')) return;

      e.preventDefault();
      const page = a.getAttribute('data-page') || pathToPage(href);
      navigate(page, href);
    });

    window.addEventListener('popstate', () => {
      const page = pathToPage(location.pathname);
      showPage(page);
    });

    // Initial route
    showPage(pathToPage(location.pathname));
  }

  function pathToPage(path) {
    return ROUTES[path] || 'home';
  }

  function navigate(page, href) {
    href = href || pageToPath(page);
    history.pushState({}, '', href);
    showPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pageToPath(page) {
    return Object.keys(ROUTES).find(k => ROUTES[k] === page) || '/';
  }

  function showPage(page) {
    // Hide all
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Show target
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');

    // Highlight nav
    document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));

    // Lazy load page data
    loadPageData(page);

    // Re-trigger reveals
    setTimeout(triggerReveal, 100);
  }

  function loadPageData(page) {
    if (page === 'home') {
      // Always fetch fresh so new admin posts appear immediately
      loadHeroSlider();
      loadHomeGallery();

      const homeTeam = document.getElementById('home-team-row');
      if (homeTeam) { homeTeam.dataset.loaded = ''; }
      loadTeam();
    }
    if (page === 'about') {
      // Clear cache so team always refreshes
      renderInto(aboutEl, team);
      loadAbout(); loadTeam(); loadBrandVideo();
    }
    if (page === 'services') {
      const el = document.getElementById('services-list');
      if (el) { el.dataset.loaded = ''; }
      loadServices();
    }
    if (page === 'training') {
      const el = document.getElementById('workshops-list');
      if (el) { el.dataset.loaded = ''; }
      loadWorkshops();
    }
    if (page === 'work') {
      const el = document.getElementById('work-gallery');
      if (el) { el.dataset.loaded = ''; }
      loadWorkGallery();
    }
    if (page === 'contact') {
      const contactTeam = document.getElementById('contact-team-row');
      if (contactTeam) { contactTeam.dataset.loaded = ''; }
      loadTeam();
    }
  }

  // ─── Settings ───────────────────────────────────────────
  async function loadSettings() {
    try {
      const s = await fetchJSON('/api/settings');
      if (!s) return;
      document.documentElement.setAttribute('data-theme-color', s.site_color_theme || 'gold');
      updateFaviconTheme(s.site_color_theme || 'gold');

      // Update Site Name / Branding
      if (s.site_name) {
        const logoOnix = document.querySelector('.logo-onix');
        const logoStudio = document.querySelector('.logo-studio');
        if (logoOnix && logoStudio) {
          const parts = s.site_name.split(' ');
          logoOnix.textContent = parts[0] || 'ONIX';
          logoStudio.textContent = parts.slice(1).join(' ') || 'S T U D I O';
        }
        document.querySelectorAll('.footer-logo-text').forEach(txt => {
          txt.textContent = s.site_name;
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

      // Hero
      if (s.hero_title) {
        document.getElementById('hero-title').textContent = s.hero_title;
      }
      if (s.hero_subtitle) {
        // Handle city/number splitting for the new layout
        const sub = s.hero_subtitle;
        if (sub.includes('|')) {
           const parts = sub.split('|');
           document.querySelector('.project-number').textContent = parts[0].trim();
           document.getElementById('hero-location').textContent = parts[1].trim();
           document.getElementById('hero-sub').textContent = parts[2] || '';
        } else {
           document.getElementById('hero-sub').textContent = sub;
        }
      }
      if (s.footer_text) document.getElementById('footer-text').textContent = s.footer_text;

      // About Section Home
      if (s.about_home_title) document.getElementById('home-about-label').textContent = s.about_home_title;
      if (s.about_home_desc_1) document.getElementById('home-about-desc-1').textContent = s.about_home_desc_1;
      if (s.about_home_desc_2) document.getElementById('home-about-desc-2').textContent = s.about_home_desc_2;
      if (s.about_home_studio_name) document.getElementById('home-about-studio-name').textContent = s.about_home_studio_name;

      if (s.about_home_img_main) document.getElementById('home-about-img-main').src = s.about_home_img_main;
      if (s.about_home_img_top) document.getElementById('home-about-img-top').src = s.about_home_img_top;
      if (s.about_home_img_bottom) document.getElementById('home-about-img-bottom').src = s.about_home_img_bottom;

      // Why Choose Section
      if (s.why_choose_heading) document.getElementById('wc-heading').textContent = s.why_choose_heading;

      const setWcFeature = (n, title, desc, iconPath) => {
        if (title) document.getElementById(`wc-title-${n}`).textContent = title;
        if (desc) document.getElementById(`wc-desc-${n}`).textContent = desc;
        if (iconPath) {
          const img = document.getElementById(`wc-icon-${n}`);
          const svg = document.getElementById(`wc-svg-${n}`);
          img.src = iconPath;
          img.style.display = 'block';
          if (svg) svg.style.display = 'none';
        }
      };

      setWcFeature(1, s.feature1_title, s.feature1_description, s.feature1_icon);
      setWcFeature(2, s.feature2_title, s.feature2_description, s.feature2_icon);
      setWcFeature(3, s.feature3_title, s.feature3_description, s.feature3_icon);

      // Store video path globally so loadBrandVideo() can use it
      if (s.hero_video_path) window._onixVideoPath = s.hero_video_path;
      loadBrandVideo();

    } catch (e) {
      console.warn('Settings load failed:', e.message);
    }
  }

  // ─── Brand Video ─────────────────────────────────────────
  function loadBrandVideo() {
    const vid = document.getElementById('about-brand-video');
    const path = window._onixVideoPath;
    if (vid && path) {
      if (!vid.src.includes(path) && document.querySelector('#about-brand-video-src')?.src !== path) {
        vid.src = path;
        vid.load();
      }
    }
  }

  // ─── Home Gallery ────────────────────────────────────────
  async function loadHomeGallery() {
    const el = document.getElementById('home-gallery');
    if (!el) return;

    try {
      projects = await fetchJSON('/api/projects?page=home');
      const slice = projects.slice(0, 8);
      el.innerHTML = '';

      if (!slice.length) {
        el.innerHTML = fallbackGallery();
        return;
      }

      slice.forEach((p, i) => {
        const item = createGalleryItem(p, i, slice, true);
        el.appendChild(item);
        if (revealObserver) revealObserver.observe(item);
      });

      lightboxImages = slice;
      initFeaturedSlider(slice);
    } catch (e) {
      el.innerHTML = fallbackGallery();
    }
  }

  // ─── Hero Main Slider ────────────────────────────────────
  let heroAutoplayDelay = null;
  async function loadHeroSlider() {
    const container = document.getElementById('hero-image-container');
    const titleEl = document.getElementById('hero-title');
    const subEl = document.getElementById('hero-sub');
    const locationEl = document.getElementById('hero-location');
    const currentSlideEl = document.getElementById('hero-current-slide');
    const totalSlidesEl = document.getElementById('hero-total-slides');
    
    if (!container) return;

    try {
      const slides = await fetchJSON('/api/hero_slides');
      
      container.innerHTML = '';
      if (heroAutoplayDelay) clearInterval(heroAutoplayDelay);

      if (!slides || !slides.length) {
        container.innerHTML = '<img src="images/hero-featured.jpg" alt="Featured Architecture" class="hero-img-main" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover;" />';
        return;
      }

      if (totalSlidesEl) totalSlidesEl.textContent = slides.length.toString().padStart(2, '0');

      slides.forEach((s, i) => {
        const imgPath = s.image_path && s.image_path.startsWith('http') ? s.image_path : (s.image_path ? `/${s.image_path.replace(/\\\\/g, '/')}` : 'images/hero-featured.jpg');
        const img = document.createElement('img');
        img.className = 'hero-slide-item' + (i === 0 ? ' active' : '');
        img.src = imgPath;
        img.alt = s.title || 'Hero Architecture';
        container.appendChild(img);
      });

      const slideEls = container.querySelectorAll('.hero-slide-item');
      const progressBar = document.getElementById('hero-progress-bar');
      let currentIndex = 0;

      function updateSlideText(index) {
        const s = slides[index];
        if (!s) return;
        
        if (titleEl) {
          titleEl.style.opacity = '0';
          titleEl.style.transform = 'translateY(10px)';
          setTimeout(() => {
            titleEl.textContent = s.title || 'Minimal Architecture';
            titleEl.style.opacity = '1';
            titleEl.style.transform = 'translateY(0)';
          }, 200);
        }
        if (subEl) {
          subEl.style.opacity = '0';
          setTimeout(() => {
            subEl.textContent = s.description || s.subtitle || 'We craft spaces that transcend the ordinary — balancing material, light, and proportion into living art.';
            subEl.style.opacity = '1';
          }, 200);
        }
        if (locationEl) locationEl.textContent = s.location || 'Kigali';
        if (currentSlideEl) currentSlideEl.textContent = (index + 1).toString().padStart(2, '0');
        
        if (progressBar && slides.length) {
          const pct = ((index + 1) / slides.length) * 100;
          progressBar.style.width = pct + '%';
        }
      }

      function goToSlide(index) {
        if (!slideEls[currentIndex]) return;
        slideEls[currentIndex].classList.remove('active');
        currentIndex = index;
        if (currentIndex >= slideEls.length) currentIndex = 0;
        if (currentIndex < 0) currentIndex = slideEls.length - 1;
        slideEls[currentIndex].classList.add('active');
        updateSlideText(currentIndex);
      }

      function nextSlide() { goToSlide(currentIndex + 1); }
      function prevSlide() { goToSlide(currentIndex - 1); }

      const prevBtn = document.getElementById('hero-prev');
      const nextBtn = document.getElementById('hero-next');

      if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', prevSlide);
      }
      if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', nextSlide);
      }

      updateSlideText(0);

      heroAutoplayDelay = setInterval(nextSlide, 5000);
      
      const controlsWrap = document.getElementById('hero-navigation-controls');
      const hoverTargets = controlsWrap ? [container, controlsWrap] : [container];
      
      hoverTargets.forEach(tgt => {
        tgt.addEventListener('mouseenter', () => clearInterval(heroAutoplayDelay));
        tgt.addEventListener('mouseleave', () => {
          clearInterval(heroAutoplayDelay);
          heroAutoplayDelay = setInterval(nextSlide, 5000);
        });
      });

    } catch (e) {
       console.error('Hero Slider load failed:', e);
    }
  }

  // ─── Featured Slider Logic ────────────────────────────────────
  function initFeaturedSlider(projects) {
    const track = document.getElementById('featured-slider-track');
    const pagination = document.getElementById('featured-pagination');
    const prevBtn = document.getElementById('featured-prev');
    const nextBtn = document.getElementById('featured-next');
    const fullscreenBtn = document.getElementById('featured-fullscreen');
    const container = document.getElementById('featured-slider-container');

    if (!track || projects.length === 0) return;

    track.innerHTML = '';
    pagination.innerHTML = '';
    let currentSlide = 0;

    projects.forEach(function(p, i) {
      const slide = document.createElement('div');
      slide.className = 'featured-slide' + (i === 0 ? ' active' : '');
      const imgSrc = p.image_path || '/images/projects/project_0' + ((i % 5) + 1) + '.jpg';
      const desc = p.description ? '<p style="margin-bottom:25px;opacity:0.9;max-width:90%;font-weight:300;">' + p.description.substring(0, 120) + (p.description.length > 120 ? '...' : '') + '</p>' : '';

      slide.innerHTML =
        '<div class="featured-slide-img-wrapper">' +
          '<img src="' + imgSrc + '" class="featured-slide-img" alt="' + p.title + '" />' +
        '</div>' +
        '<div class="featured-slide-content">' +
          '<span class="featured-slide-category">' + (p.category || 'Architecture') + '</span>' +
          '<h2 class="featured-slide-title">' + p.title + '</h2>' +
          '<div class="featured-slide-meta">' +
            '<span>' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
              (p.location || 'Kigali') +
            '</span>' +
          '</div>' +
          desc +
          '<a href="project-detail.html?id=' + p.id + '" class="featured-btn">' +
            'View Project ' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
          '</a>' +
        '</div>';

      track.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = 'pagination-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', (function(idx) { return function() { goToSlide(idx); }; })(i));
      pagination.appendChild(dot);
    });

    const slides = track.querySelectorAll('.featured-slide');
    const dots = pagination.querySelectorAll('.pagination-dot');

    function goToSlide(index) {
      if (!slides.length) return;
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      currentSlide = index;
      if (currentSlide >= slides.length) currentSlide = 0;
      if (currentSlide < 0) currentSlide = slides.length - 1;
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    let autoplay = setInterval(nextSlide, 5000);
    
    if (container) {
      container.addEventListener('mouseenter', () => clearInterval(autoplay));
      container.addEventListener('mouseleave', () => {
        autoplay = setInterval(nextSlide, 5000);
      });
      
      let startX = 0;
      container.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX);
      container.addEventListener('touchend', e => {
        let endX = e.changedTouches[0].screenX;
        if (startX - endX > 50) nextSlide();
        else if (endX - startX > 50) prevSlide();
      });
    }
    
    if (fullscreenBtn && container) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(e => console.log(e));
        } else {
          document.exitFullscreen();
        }
      });
    }
  }

  // ─── Work Gallery ────────────────────────────────────────
  let workPageSize = 12;
  let workVisibleCount = 0;
  let filteredProjects = [];

  async function loadWorkGallery() {
    const el = document.getElementById('work-gallery');
    const filterEl = document.getElementById('work-filter');
    if (!el) return;

    try {
      // Always fetch fresh for "real-time" feel
      projects = await fetchJSON('/api/projects?page=work');

      // Setup filters if first time
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

      // Initialize Load More button
      const btnLoadMore = document.getElementById('btn-load-more');
      if (btnLoadMore && !btnLoadMore.dataset.inited) {
        btnLoadMore.addEventListener('click', () => renderNextWorkBatch());
        btnLoadMore.dataset.inited = '1';
      }

      filterWork('all');
    } catch (e) {
      el.innerHTML = fallbackGallery();
    }
  }

  function filterWork(cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-filter="${cat}"]`)?.classList.add('active');

    filteredProjects = cat === 'all' ? projects : projects.filter(p => p.category === cat);
    lightboxImages = filteredProjects;
    lightboxIndex = 0;

    // Reset pagination
    workVisibleCount = 0;
    renderNextWorkBatch(true);
  }

  function renderNextWorkBatch(reset = false) {
    const el = document.getElementById('work-gallery');
    const loadMoreContainer = document.getElementById('load-more-container');
    if (reset) el.innerHTML = '';

    const remaining = filteredProjects.length - workVisibleCount;
    if (remaining <= 0) return;

    const countToLoad = Math.min(workPageSize, remaining);
    const nextBatch = filteredProjects.slice(workVisibleCount, workVisibleCount + countToLoad);

    nextBatch.forEach((p, i) => {
      const idx = workVisibleCount + i; // absolute index for perfect rhythm!
      const item = createGalleryItem(p, idx, filteredProjects);
      el.appendChild(item);
      if (revealObserver) revealObserver.observe(item);
    });

    workVisibleCount += nextBatch.length;
    triggerReveal();

    if (loadMoreContainer) {
      if (workVisibleCount >= filteredProjects.length) {
        loadMoreContainer.style.display = 'none';
      } else {
        loadMoreContainer.style.display = 'flex';
      }
    }
  }


  function createGalleryItem(p, i, arr, isHome = false) {
    const div = document.createElement('div');
    const imgSrc = p.image_path || `/images/projects/project_0${(i % 5) + 1}.jpg`;
    const location = p.location || 'Kigali, Rwanda';
    const category = p.category || 'Architecture';

    if (isHome) {
      // Home page: uniform 3-col grid, existing style
      div.className = `gallery-item reveal span-1`;
      div.style.transitionDelay = `${(i % 3) * 100}ms`;
      div.dataset.index = i;
      const status = p.project_status || 'Completed';
      div.innerHTML = `
        <div class="gallery-item-frame">
          <img src="${imgSrc}" alt="${p.title}" loading="lazy" onerror="this.src='/images/projects/placeholder.jpg'" />
          <div class="gallery-item-overlay">
            <button class="btn-view-project">View Project</button>
          </div>
        </div>
        <div class="gallery-item-info">
          <h3 class="gallery-item-name">${p.title}</h3>
          <span class="gallery-item-location">${location}</span>
          <span class="gallery-item-status">${status}</span>
        </div>`;
      div.addEventListener('click', () => { window.location.href = `project-detail.html?id=${p.id}`; });
      return div;
    }

    // ── Work page: masonry layout ──────────────────────────────
    // Slot pattern per 6 items: hero, medium, medium, small, small, full
    const MASONRY_SLOTS = ['masonry-hero', 'masonry-medium', 'masonry-medium', 'masonry-small', 'masonry-small', 'masonry-full'];
    const slotClass = MASONRY_SLOTS[i % MASONRY_SLOTS.length];

    div.className = `masonry-item ${slotClass} reveal`;
    div.style.transitionDelay = `${(i % 4) * 80}ms`;
    div.dataset.index = i;

    div.innerHTML = `
      <div class="masonry-card-inner">
        <img src="${imgSrc}" alt="${p.title}" loading="lazy" onerror="this.src='/images/projects/placeholder.jpg'" />
        <div class="masonry-overlay">
          <div class="masonry-overlay-content">
            <span class="masonry-category">${category}</span>
            <h3 class="masonry-title">${p.title}</h3>
            <span class="masonry-location">${location}</span>
            <a href="project-detail.html?id=${p.id}" class="masonry-btn">
              View project
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      </div>`;

    div.addEventListener('click', (e) => {
      if (!e.target.closest('.masonry-btn')) {
        window.location.href = `project-detail.html?id=${p.id}`;
      }
    });
    return div;
  }

  function fallbackGallery() {
    return '<div style="padding:60px;color:var(--text-3);text-align:center;grid-column:1/-1">No projects found. Add some from the admin panel.</div>';
  }

  // ─── About ───────────────────────────────────────────────
  async function loadAbout() {
    try {
      const data = await fetchJSON('/api/about');
      if (data.narrative) {
        document.getElementById('about-narrative').textContent = data.narrative;
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

  // ─── Team ────────────────────────────────────────────────
  async function loadTeam() {
    const aboutEl = document.getElementById('team-row');
    const homeEl = document.getElementById('home-team-row');
    const contactEl = document.getElementById('contact-team-row');

    // Roles shown on Home page only
    const HOME_ROLES = ['ceo', 'manager', 'c.e.o', 'director', 'managing director', 'ceo/architect', 'managing director/str.engineer'];

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
      if (phone) actionCards += `<a href="tel:${phone.replace(/\s+/g, '')}" class="team-action-card call-card"><div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div><div class="team-action-text"><strong>Call</strong><span>${phone}</span></div></a>`;
      if (rawEmail) actionCards += `<a href="mailto:${rawEmail}" class="team-action-card email-card"><div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div><div class="team-action-text"><strong>Email</strong><span>${rawEmail}</span></div></a>`;
      if (calLink) actionCards += `<a href="${calLink}" target="_blank" rel="noopener noreferrer" class="team-action-card schedule-card"><div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><div class="team-action-text"><strong>Schedule Meeting</strong><span>Book a time that works for you</span></div></a>`;
      if (waLink) actionCards += `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="team-action-card whatsapp-card"><div class="team-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path></svg></div><div class="team-action-text"><strong>WhatsApp</strong><span>Send a message</span></div></a>`;

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

      card.querySelector('.team-contact-btn').addEventListener('click', (e) => { e.stopPropagation(); card.classList.add('flipped'); });
      card.querySelector('.team-back-btn').addEventListener('click', (e) => { e.stopPropagation(); card.classList.remove('flipped'); });
      return card;
    }

    function renderInto(el, members) {
      if (!el || el.dataset.loaded) return;
      el.innerHTML = '';
      if (!members.length) {
        el.innerHTML = '<div class="team-empty">Team photos will appear here once uploaded from the admin panel.</div>';
        el.dataset.loaded = '1';
        return;
      }
      members.forEach((m, i) => {
        const card = buildCard(m, i);
        el.appendChild(card);
        if (revealObserver) revealObserver.observe(card);
      });
      el.dataset.loaded = '1';
    }

    try {
      const team = await fetchJSON('/api/team');

      // Home: CEO & Manager only
      const homeTeam = team.filter(m => HOME_ROLES.includes((m.role || '').toLowerCase().trim()));
      renderInto(homeEl, homeTeam);

      // About & Contact: everyone
      renderInto(aboutEl, team);
      renderInto(contactEl, team);

    } catch (e) {
      [aboutEl, homeEl, contactEl].forEach(el => {
        if (el) el.innerHTML = '<div class="team-empty">Team photos coming soon.</div>';
      });
    }
  }

  // ─── Services ────────────────────────────────────────────
  const ICONS = {
    building: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="0"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`,
    layout: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 21V9"/></svg>`,
    leaf: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 8C8 10 5.9 16.17 3.82 19.5c4.13.84 7.97-.8 10.18-3 4-4 5-8 3-12z"/><path d="M3.82 19.5C5 18 8.6 14 16 14"/></svg>`,
    award: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    tool: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  };

  async function loadServices() {
    const el = document.getElementById('services-list');
    if (el.dataset.loaded) return;
    el.dataset.loaded = '1';

    try {
      const services = await fetchJSON('/api/services');
      el.innerHTML = '';

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

      el.dataset.loaded = '1';
    } catch (e) {
      el.innerHTML = '<div style="padding:40px;color:var(--text-3)">Services loading failed. Check database connection.</div>';
    }
  }

  // ─── Workshops ───────────────────────────────────────────
  async function loadWorkshops() {
    const el = document.getElementById('workshops-list');
    if (el.dataset.loaded) return;
    el.dataset.loaded = '1';

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

        // Workshop toggle
        const header = item.querySelector('.workshop-header');
        header.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          document.querySelectorAll('.workshop-item').forEach(i => i.classList.remove('open'));
          if (!isOpen) item.classList.add('open');
        });

        // Sub-dropdowns
        item.querySelectorAll('.dropdown-trigger').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            const parent = btn.closest('.dropdown-item');
            parent.classList.toggle('open');
          });
        });

        el.appendChild(item);
        if (revealObserver) revealObserver.observe(item);
      });

      el.dataset.loaded = '1';
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

  // ─── Lightbox ────────────────────────────────────────────
  function initLightbox() {
    const lb = document.getElementById('lightbox');
    const close = document.getElementById('lightbox-close');
    const prev = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');

    close.addEventListener('click', closeLightbox);
    prev.addEventListener('click', () => moveLightbox(-1));
    next.addEventListener('click', () => moveLightbox(1));

    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') moveLightbox(-1);
      if (e.key === 'ArrowRight') moveLightbox(1);
    });
  }

  function openLightbox(idx) {
    lightboxIndex = idx;
    renderLightbox();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }

  function moveLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    renderLightbox();
  }

  function renderLightbox() {
    const p = lightboxImages[lightboxIndex];
    if (!p) return;
    const imgSrc = p.image_path || `/images/projects/project_0${(lightboxIndex % 5) + 1}.jpg`;
    document.getElementById('lightbox-img').src = imgSrc;
    document.getElementById('lightbox-caption').textContent = `${p.title}${p.category ? ' — ' + p.category : ''}`;
  }

  // ─── Contact Form ─────────────────────────────────────────
  function initContactForm() {
    // 1. Training form (Simulated)
    const trainingForm = document.getElementById('training-form');
    if (trainingForm) {
      trainingForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('training-submit');
        const fb = document.getElementById('training-feedback');
        if (!btn || !fb) return;

        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;

        await new Promise(r => setTimeout(r, 1200));

        fb.textContent = '✓ Message sent. We\'ll be in touch soon.';
        fb.style.color = '#5ac98a';
        trainingForm.reset();
        btn.textContent = originalText;
        btn.disabled = false;
        setTimeout(() => { fb.textContent = ''; }, 5000);
      });
    }

    // 2. Main contact form (WhatsApp redirect matching page.js)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const btn = document.getElementById('contact-submit');
        const fb = document.getElementById('form-feedback');
        if (!btn) return;

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
  }

  // ─── Scroll Reveal ───────────────────────────────────────
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
      if (rect.top < window.innerHeight - 60) {
        el.classList.add('visible');
      }
    });
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
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // ─── Utility ─────────────────────────────────────────────
  async function fetchJSON(url) {
    const res = await fetch(API + url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

})();

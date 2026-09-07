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
    initDonationSection();
  });



  // ─── Theme ──────────────────────────────────────────────
  function initTheme() {
    let saved = 'dark';
    try { saved = localStorage.getItem('onix-theme') || 'dark'; } catch (e) { }
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
    try { localStorage.setItem('onix-theme', theme); } catch (e) { }
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
    '/index.html': 'home',
    '/home.html': 'home',
    '/about': 'about',
    '/about.html': 'about',
    '/services': 'services',
    '/services.html': 'services',
    '/training': 'training',
    '/training.html': 'training',
    '/work': 'work',
    '/work.html': 'work',
    '/contact': 'contact',
    '/contact.html': 'contact',
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
          txt.style.display = 'none';
        });
      }

      // Hero
      if (s.hero_title) {
        document.getElementById('hero-title').textContent = s.hero_title;
      }
      if (s.hero_subtitle) {
        const sub = s.hero_subtitle;
        if (sub.includes('|')) {
          const parts = sub.split('|');
          const pNum = document.querySelector('.project-number');
          const pLoc = document.getElementById('hero-location');
          const pSub = document.getElementById('hero-sub');
          if (pNum) pNum.textContent = parts[0].trim();
          if (pLoc) pLoc.textContent = parts[1].trim();
          if (pSub) pSub.textContent = parts[2] ? parts[2].trim() : parts[1].trim();
        } else {
          const pSub = document.getElementById('hero-sub');
          if (pSub) pSub.textContent = sub;
        }
      }
      const footerTextEl = document.getElementById('footer-text');
      if (s.footer_text && footerTextEl) footerTextEl.textContent = s.footer_text;

      // About Section Home
      const _set = (id, val, prop = 'textContent') => { const el = document.getElementById(id); if (el && val) el[prop] = val; };
      _set('home-about-label', s.about_home_title);
      _set('home-about-desc-1', s.about_home_desc_1);
      _set('home-about-desc-2', s.about_home_desc_2);
      _set('home-about-studio-name', s.about_home_studio_name);

      _set('home-about-img-main', s.about_home_img_main, 'src');
      _set('home-about-img-top', s.about_home_img_top, 'src');
      _set('home-about-img-bottom', s.about_home_img_bottom, 'src');

      // Why Choose Section
      if (s.why_choose_heading) document.getElementById('wc-heading').textContent = s.why_choose_heading;

      const setWcFeature = (n, title, desc, iconPath) => {
        _set(`wc-title-${n}`, title);
        _set(`wc-desc-${n}`, desc);
        if (iconPath) {
          const img = document.getElementById(`wc-icon-${n}`);
          const svg = document.getElementById(`wc-svg-${n}`);
          if (img) { img.src = iconPath; img.style.display = 'block'; }
          if (svg) svg.style.display = 'none';
        }
      };

      setWcFeature(1, s.feature1_title, s.feature1_description, s.feature1_icon);
      setWcFeature(2, s.feature2_title, s.feature2_description, s.feature2_icon);
      setWcFeature(3, s.feature3_title, s.feature3_description, s.feature3_icon);

      // ─── Dynamic Donation Section (CMS Controlled) ───────────
      const donSec = document.getElementById('donation-section');
      if (donSec) {
        // Section Visibility
        if (s.donation_enable_section !== undefined) {
          const isEnabled = s.donation_enable_section === '1' || s.donation_enable_section === 'true' || s.donation_enable_section === true;
          donSec.style.display = isEnabled ? '' : 'none';
        }

        // Headline & Description (supports controlled linebreaks if present)
        if (s.donation_headline) {
          const hEl = document.getElementById('donation-headline');
          if (hEl) hEl.innerHTML = s.donation_headline.replace(/\n/g, '<br />');
        }
        if (s.donation_description) {
          _set('donation-desc', s.donation_description);
        }

        // CTA text & link
        if (s.donation_cta_text) {
          _set('donation-cta-text', s.donation_cta_text);
        }
        if (s.donation_cta_url) {
          const ctaWrap = document.getElementById('donation-cta-wrap');
          if (ctaWrap) ctaWrap.dataset.ctaUrl = s.donation_cta_url;
        }

        // Images
        if (s.donation_img_center) _set('donation-img-center', s.donation_img_center, 'src');
        if (s.donation_img_left) _set('donation-img-left', s.donation_img_left, 'src');
        if (s.donation_img_right) _set('donation-img-right', s.donation_img_right, 'src');

        // Testimonial
        const testiOverlay = document.getElementById('donation-testimonial-overlay');
        const showTesti = (s.donation_enable_testimonial === undefined || s.donation_enable_testimonial === '1' || s.donation_enable_testimonial === 'true' || s.donation_enable_testimonial === true);
        const hasQuote = (s.donation_testi_quote && s.donation_testi_quote.trim()) || document.getElementById('donation-testi-quote')?.textContent.trim();

        if (testiOverlay) {
          if (!showTesti || !hasQuote) {
            testiOverlay.style.display = 'none';
          } else {
            testiOverlay.style.display = 'block';
            if (s.donation_testi_quote) _set('donation-testi-quote', `"${s.donation_testi_quote.replace(/^["']|["']$/g, '')}"`);
            if (s.donation_testi_name) _set('donation-testi-name', s.donation_testi_name);
            if (s.donation_testi_avatar) _set('donation-testi-avatar', s.donation_testi_avatar, 'src');
            if (s.donation_testi_role) {
              const roleEl = document.getElementById('donation-testi-role');
              if (roleEl) {
                roleEl.textContent = ` • ${s.donation_testi_role}`;
                roleEl.style.display = 'inline';
              }
            }
          }
        }

        // Decorations Visibility
        const showDoodles = (s.donation_enable_decorations === undefined || s.donation_enable_decorations === '1' || s.donation_enable_decorations === 'true' || s.donation_enable_decorations === true);
        document.querySelectorAll('.donation-doodle').forEach(d => {
          d.style.display = showDoodles ? 'block' : 'none';
        });
      }

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
    if (window.Skeleton) window.Skeleton.show('sk-home-gallery');

    try {
      let limit = 8;
      try {
        const s = await fetchJSON('/api/settings');
        if (s && s.home_projects_limit) {
          const parsed = parseInt(s.home_projects_limit, 10);
          if (!isNaN(parsed) && parsed > 0) limit = parsed;
        }
      } catch (err) {}

      projects = await fetchJSON('/api/projects?page=home');
      const slice = projects.slice(0, limit);
      el.innerHTML = '';

      if (!slice.length) {
        el.innerHTML = fallbackGallery();
        if (window.Skeleton) window.Skeleton.hide('sk-home-gallery');
        return;
      }

      slice.forEach((p, i) => {
        const item = createGalleryItem(p, i, slice, true);
        el.appendChild(item);
        if (revealObserver) revealObserver.observe(item);
      });

      lightboxImages = slice;
      initFeaturedSlider(slice);
      if (window.Skeleton) window.Skeleton.hide('sk-home-gallery');
    } catch (e) {
      if (window.Skeleton) window.Skeleton.hide('sk-home-gallery');
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

    projects.forEach(function (p, i) {
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
      dot.addEventListener('click', (function (idx) { return function () { goToSlide(idx); }; })(i));
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

  // ─── Work Featured Slider Logic (Admin CMS Projects) ─────────
  function initWorkSlider(workProjects) {
    const track = document.getElementById('work-slider-track');
    const pagination = document.getElementById('work-slider-pagination');
    const prevBtn = document.getElementById('work-slider-prev');
    const nextBtn = document.getElementById('work-slider-next');
    const fullscreenBtn = document.getElementById('work-slider-fullscreen');
    const container = document.getElementById('work-slider-container');
    const curEl = document.getElementById('work-slide-current');
    const totalEl = document.getElementById('work-slide-total');

    if (!track || !workProjects || workProjects.length === 0) return;

    // Pick spotlight projects that have a valid image
    const validProjects = workProjects.filter(p => p.image_path && p.image_path.trim() !== '');
    const sliderProjects = (validProjects.length >= 3 ? validProjects : workProjects).slice(0, 6);

    if (sliderProjects.length === 0) return;

    track.innerHTML = '';
    pagination.innerHTML = '';
    let currentSlide = 0;

    if (totalEl) {
      totalEl.textContent = String(sliderProjects.length).padStart(2, '0');
    }

    sliderProjects.forEach(function (p, i) {
      const slide = document.createElement('div');
      slide.className = 'featured-slide' + (i === 0 ? ' active' : '');
      const imgSrc = p.image_path || '/images/projects/project_0' + ((i % 5) + 1) + '.jpg';
      const descText = p.description ? p.description.trim() : (p.story_concept ? p.story_concept.trim() : '');
      const descHtml = descText
        ? '<p class="featured-slide-desc">' + descText.substring(0, 140) + (descText.length > 140 ? '...' : '') + '</p>'
        : '';
      const locationText = p.location ? p.location.trim() : 'Kigali';
      const categoryText = (p.category ? p.category.trim() : 'Architecture');

      slide.innerHTML =
        '<div class="featured-slide-img-wrapper">' +
          '<img src="' + imgSrc + '" class="featured-slide-img" alt="' + (p.title || 'Project') + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '" />' +
        '</div>' +
        '<div class="featured-slide-content">' +
          '<span class="featured-slide-category">' + categoryText + '</span>' +
          '<h2 class="featured-slide-title">' + (p.title || 'Architectural Project') + '</h2>' +
          '<div class="featured-slide-meta">' +
            '<span>' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
              locationText +
            '</span>' +
            (p.project_status ? '<span style="opacity:0.6">•</span><span>' + p.project_status + '</span>' : '') +
          '</div>' +
          descHtml +
          '<a href="project-detail.html?id=' + p.id + '" class="featured-btn">' +
            '<span>View Project</span>' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
          '</a>' +
        '</div>';

      track.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = 'pagination-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', (function (idx) { return function () { goToSlide(idx); }; })(i));
      pagination.appendChild(dot);
    });

    const slides = track.querySelectorAll('.featured-slide');
    const dots = pagination.querySelectorAll('.pagination-dot');

    function goToSlide(index) {
      if (!slides.length) return;
      slides[currentSlide].classList.remove('active');
      if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
      currentSlide = index;
      if (currentSlide >= slides.length) currentSlide = 0;
      if (currentSlide < 0) currentSlide = slides.length - 1;
      slides[currentSlide].classList.add('active');
      if (dots[currentSlide]) dots[currentSlide].classList.add('active');
      if (curEl) curEl.textContent = String(currentSlide + 1).padStart(2, '0');
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    let autoplay = setInterval(nextSlide, 5000);

    if (container) {
      container.addEventListener('mouseenter', () => clearInterval(autoplay));
      container.addEventListener('mouseleave', () => {
        clearInterval(autoplay);
        autoplay = setInterval(nextSlide, 5000);
      });

      // Swipe support
      let startX = 0;
      container.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; }, { passive: true });
      container.addEventListener('touchend', e => {
        let endX = e.changedTouches[0].screenX;
        if (startX - endX > 50) nextSlide();
        else if (endX - startX > 50) prevSlide();
      }, { passive: true });
    }

    // Fullscreen toggle
    if (fullscreenBtn && container) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(err => {
            console.log('Fullscreen error: ' + err.message);
          });
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
      initWorkSlider(projects);

      // Setup filters if first time
      if (!filterEl.dataset.filtersInited) {
        // Normalize categories: trim and uppercase to deduplicate e.g. "INTERIOR " vs "interior"
        const catMap = new Map();
        projects.forEach(p => {
          if (p.category && p.category.trim()) {
            const normKey = p.category.trim().toUpperCase();
            if (!catMap.has(normKey)) {
              catMap.set(normKey, normKey);
            }
          }
        });

        catMap.forEach((displayName, normKey) => {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = normKey;
          btn.textContent = displayName;
          btn.addEventListener('click', () => filterWork(normKey));
          filterEl.appendChild(btn);
        });
        filterEl.querySelector('[data-filter="all"]')?.addEventListener('click', () => filterWork('all'));
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

    filteredProjects = cat === 'all'
      ? projects
      : projects.filter(p => p.category && p.category.trim().toUpperCase() === cat.toUpperCase());
    lightboxImages = filteredProjects;
    lightboxIndex = 0;

    // Reset pagination
    workVisibleCount = 0;
    renderNextWorkBatch(true);
  }

  function createArchHeaderBlock() {
    const headerBlock = document.createElement('div');
    headerBlock.className = 'arch-header-block reveal visible';
    headerBlock.innerHTML = `
      <div class="arch-header-label">Our Projects</div>
      <h2 class="arch-header-title">Selected<br>Work</h2>
      <div class="arch-header-divider"></div>
      <p class="arch-header-desc">A collection of spaces we've designed and crafted with purpose, detail, and timeless vision.</p>
      <a href="#work-filter" class="arch-header-link">View All Projects <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
    `;
    headerBlock.querySelector('.arch-header-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
      if (allBtn) allBtn.click();
      const filterEl = document.getElementById('work-filter');
      if (filterEl) filterEl.scrollIntoView({ behavior: 'smooth' });
    });
    return headerBlock;
  }

  function renderNextWorkBatch(reset = false) {
    const el = document.getElementById('work-gallery');
    const loadMoreContainer = document.getElementById('load-more-container');
    if (reset) {
      el.innerHTML = '';
      if (filteredProjects.length > 0) {
        const headerBlock = createArchHeaderBlock();
        el.appendChild(headerBlock);
        if (revealObserver) revealObserver.observe(headerBlock);
      } else {
        el.innerHTML = '<div style="padding:60px;color:var(--text-3);text-align:center;grid-column:1/-1">No projects found in this category.</div>';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
      }
    }

    const remaining = filteredProjects.length - workVisibleCount;
    if (remaining <= 0) {
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
      return;
    }

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
    const category = p.category ? p.category.trim() : 'Architecture';

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

    // ── Work page: exact 11-slot editorial arch blueprint ──────────────────
    // IMPORTANT: This markup must stay in sync with the identical function in page.js.
    // The site has two rendering paths for /work:
    //   • SPA navigation  → index.html + app.js  (this path)
    //   • Hard refresh    → work.html  + page.js  (reference implementation)
    // Both paths must produce identical arch-project-item DOM.
    //
    // Slot map (14-column grid, rows auto-sized at minmax(75px, auto)):
    //   0 = arch-slot-1   (top centre-left, tall portrait)
    //   1 = arch-slot-2   (top centre-right, landscape)
    //   2 = arch-slot-3   (top right, landscape)
    //   3 = arch-slot-4   (middle left, wide landscape)
    //   4 = arch-slot-hero arch-slot-5  (CENTRAL DOMINANT HERO)
    //   5 = arch-slot-6   (middle right upper, wide)
    //   6 = arch-slot-7   (middle right lower, compact)
    //   7 = arch-slot-8   (bottom left, portrait)
    //   8 = arch-slot-9   (bottom centre-left, tall portrait)
    //   9 = arch-slot-10  (bottom centre-right, wide)
    //  10 = arch-slot-11  (bottom right, square/portrait)
    // Items beyond slot 11 cycle through a secondary balanced pattern.
    const ARCH_SLOTS = [
      'arch-slot-1',
      'arch-slot-2',
      'arch-slot-3',
      'arch-slot-4',
      'arch-slot-hero arch-slot-5',
      'arch-slot-6',
      'arch-slot-7',
      'arch-slot-8',
      'arch-slot-9',
      'arch-slot-10',
      'arch-slot-11'
    ];
    const EXTRA_SLOTS = [
      'arch-extra-wide',
      'arch-extra-slim',
      'arch-extra-mid',
      'arch-extra-slim',
      'arch-extra-wide',
      'arch-extra-mid'
    ];

    let slotClass;
    if (i < ARCH_SLOTS.length) {
      slotClass = ARCH_SLOTS[i];
    } else {
      slotClass = EXTRA_SLOTS[(i - ARCH_SLOTS.length) % EXTRA_SLOTS.length];
    }

    div.className = `arch-project-item ${slotClass} reveal`;
    div.style.transitionDelay = `${(i % 5) * 70}ms`;
    div.dataset.index = i;

    const numStr = String(i + 1).padStart(2, '0');

    div.innerHTML = `
      <img src="${imgSrc}" alt="${p.title}" loading="lazy" onerror="this.src='/images/projects/placeholder.jpg'" />
      <div class="arch-project-overlay">
        <div class="arch-overlay-top">
          <span class="arch-project-num">${numStr}</span>
        </div>
        <div class="arch-overlay-bottom">
          <span class="arch-project-cat">${category}</span>
          <h3 class="arch-project-title">${p.title}</h3>
          <span class="arch-project-loc">${location}</span>
        </div>
      </div>`;

    div.addEventListener('click', () => {
      window.location.href = `project-detail.html?id=${p.id}`;
    });
    return div;
  }


  function fallbackGallery() {
    return '<div style="padding:60px;color:var(--text-3);text-align:center;grid-column:1/-1">No projects found. Add some from the admin panel.</div>';
  }

  // ─── About ───────────────────────────────────────────────
  async function loadAbout() {
    if (window.Skeleton) window.Skeleton.show('sk-about-narrative');
    try {
      const data = await fetchJSON('/api/about');
      if (data.narrative) {
        document.getElementById('about-narrative').textContent = data.narrative;
      }
      if (window.Skeleton) window.Skeleton.hide('sk-about-narrative');
    } catch (e) {
      if (window.Skeleton) window.Skeleton.hide('sk-about-narrative');
    }
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

    if (window.Skeleton) {
      if (aboutEl) window.Skeleton.show('sk-about-team');
      if (homeEl) window.Skeleton.show('sk-home-team');
      if (contactEl) window.Skeleton.show('sk-contact-team');
    }

    try {
      const team = await fetchJSON('/api/team');

      // Home: CEO & Manager only
      const homeTeam = team.filter(m => HOME_ROLES.includes((m.role || '').toLowerCase().trim()));
      renderInto(homeEl, homeTeam);

      // About & Contact: everyone
      renderInto(aboutEl, team);
      renderInto(contactEl, team);

      if (window.Skeleton) {
        if (aboutEl) window.Skeleton.hide('sk-about-team');
        if (homeEl) window.Skeleton.hide('sk-home-team');
        if (contactEl) window.Skeleton.hide('sk-contact-team');
      }

    } catch (e) {
      if (window.Skeleton) {
        if (aboutEl) window.Skeleton.hide('sk-about-team');
        if (homeEl) window.Skeleton.hide('sk-home-team');
        if (contactEl) window.Skeleton.hide('sk-contact-team');
      }
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
    if (window.Skeleton) window.Skeleton.show('sk-services-list');

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
      if (window.Skeleton) window.Skeleton.hide('sk-services-list');
    } catch (e) {
      if (window.Skeleton) window.Skeleton.hide('sk-services-list');
      el.innerHTML = '<div style="padding:40px;color:var(--text-3)">Services loading failed. Check database connection.</div>';
    }
  }

  // ─── Workshops ───────────────────────────────────────────
  async function loadWorkshops() {
    const el = document.getElementById('workshops-list');
    if (el.dataset.loaded) return;
    el.dataset.loaded = '1';
    if (window.Skeleton) window.Skeleton.show('sk-workshops-list');

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
      if (window.Skeleton) window.Skeleton.hide('sk-workshops-list');
    } catch (e) {
      if (window.Skeleton) window.Skeleton.hide('sk-workshops-list');
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
          btn.textContent = 'SEND MESSAGE';
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

  // ─── Donation Section ───────────────────────────────────
  function initDonationSection() {
    const sec = document.getElementById('donation-section');
    if (!sec) return;

    // Connect Main Pill CTA Button
    const ctaBtn = sec.querySelector('#donation-cta-btn');
    const ctaWrap = sec.querySelector('#donation-cta-wrap');
    const modalBackdrop = sec.querySelector('#donation-checkout-modal');
    const modalCloseBtn = sec.querySelector('#donation-modal-close');

    if (ctaBtn) {
      ctaBtn.addEventListener('click', (e) => {
        const customUrl = ctaWrap?.dataset?.ctaUrl;
        if (customUrl && customUrl.trim() !== '' && customUrl.trim() !== '#') {
          // Administrator configured external payment or custom donation page URL
          window.location.href = customUrl;
          return;
        }

        // Open integrated payment checkout modal
        if (modalBackdrop) {
          modalBackdrop.classList.add('open');
          modalBackdrop.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    function closeModal() {
      if (modalBackdrop) {
        modalBackdrop.classList.remove('open');
        modalBackdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop?.classList.contains('open')) closeModal();
    });

    let selectedAmount = '50';
    let frequency = 'once';
    let method = 'card';

    const amountBtns = sec.querySelectorAll('.amount-btn');
    const customInput = sec.querySelector('#custom-donation-amount');
    const submitBtn = sec.querySelector('#donation-submit-btn');
    const submitText = submitBtn ? submitBtn.querySelector('span') : null;
    const freqBtns = sec.querySelectorAll('.freq-btn');
    const methodInputs = sec.querySelectorAll('input[name="donation-method"]');
    const momoWrap = sec.querySelector('#momo-phone-wrap');
    const form = sec.querySelector('#donation-form');
    const feedback = sec.querySelector('#donation-feedback');

    function updateSubmitText() {
      if (!submitText) return;
      const amt = selectedAmount ? `$${selectedAmount}` : '$50';
      const freqLabel = frequency === 'monthly' ? '/mo' : '';
      submitText.textContent = `Support With ${amt}${freqLabel}`;
    }

    // Frequency Toggle
    freqBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        freqBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        frequency = btn.dataset.freq;
        updateSubmitText();
      });
    });

    // Amount Selection
    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (customInput) customInput.value = '';
        selectedAmount = btn.dataset.amount;
        updateSubmitText();
      });
    });

    // Custom Amount Input
    if (customInput) {
      customInput.addEventListener('input', () => {
        if (customInput.value && parseInt(customInput.value, 10) > 0) {
          amountBtns.forEach(b => b.classList.remove('active'));
          selectedAmount = customInput.value;
        } else {
          selectedAmount = '50';
        }
        updateSubmitText();
      });
    }

    // Payment Method Toggle
    methodInputs.forEach(input => {
      input.addEventListener('change', () => {
        method = input.value;
        sec.querySelectorAll('.donation-method-option').forEach(opt => {
          opt.classList.toggle('active', opt.querySelector('input') === input);
        });
        if (momoWrap) {
          momoWrap.style.display = method === 'momo' ? 'block' : 'none';
          const phoneInput = momoWrap.querySelector('input');
          if (phoneInput) phoneInput.required = method === 'momo';
        }
      });
    });

    // Form Submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#donor-name')?.value || '';
        const email = form.querySelector('#donor-email')?.value || '';
        const amount = selectedAmount || '50';

        if (submitBtn) {
          submitBtn.disabled = true;
          if (submitText) submitText.textContent = 'Processing...';
        }

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            updateSubmitText();
          }
          if (feedback) {
            feedback.style.color = 'var(--accent)';
            feedback.innerHTML = `✓ Thank you, <strong>${name}</strong>! Your donation of <strong>$${amount}</strong> (${frequency === 'monthly' ? 'Monthly' : 'One-Time'}) via ${method.toUpperCase()} has been received with deep gratitude.`;
            form.reset();
            if (momoWrap) momoWrap.style.display = 'none';
          }
        }, 800);
      });
    }
  }

  // ─── Utility ─────────────────────────────────────────────
  async function fetchJSON(url) {
    const res = await fetch(API + url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

})();

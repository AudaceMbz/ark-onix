/* ═══════════════════════════════════════════════════════════
   ONYX ADMIN — JavaScript Logic
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────
  let currentPanel = 'dashboard';
  let modalMode = null; // 'add' | 'edit'
  let modalEntity = null; // 'project' | 'service' | 'team' | 'workshop'
  let editingId = null;

  // ─── Init ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLogin();
    initSidebar();
    initLogout();
    initModal();
    initSettingsForms();
    // Apply favicon theme immediately on load (no login needed)
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => { if (s && s.site_color_theme) updateFaviconTheme(s.site_color_theme); })
      .catch(() => {});
  });

  // ─── Auth ────────────────────────────────────────────────
  async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const res = await api('GET', '/api/admin/check');
      if (res.loggedIn) showShell();
    } catch(e) {}
  }

  function initLogin() {
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('login-password');
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener('click', () => {
        const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passInput.setAttribute('type', type);
        
        const eyeOpen = toggleBtn.querySelectorAll('.eye-open');
        const eyeClosed = toggleBtn.querySelectorAll('.eye-closed');
        if (type === 'text') {
          eyeOpen.forEach(el => el.style.display = 'none');
          eyeClosed.forEach(el => el.style.display = 'block');
        } else {
          eyeOpen.forEach(el => el.style.display = 'block');
          eyeClosed.forEach(el => el.style.display = 'none');
        }
      });
    }

    document.getElementById('login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-btn');
      const btnText = submitBtn?.querySelector('.btn-text');
      const btnLoader = submitBtn?.querySelector('.btn-loader');
      
      errEl.textContent = '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Signing In...';
        if (btnLoader) btnLoader.style.display = 'block';
      }
      
      try {
        const res = await api('POST', '/api/admin/login', { username: u, password: p });
        localStorage.setItem('adminToken', res.token);
        showShell();
      } catch (er) {
        errEl.textContent = 'Invalid username or password.';
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Sign In';
          if (btnLoader) btnLoader.style.display = 'none';
        }
      }
    });
  }

  function showShell() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-shell').style.display = 'block';
    loadDashboard();
    loadPanel('dashboard');
  }

  function initLogout() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
      try { await api('POST', '/api/admin/logout'); } catch(e){}
      localStorage.removeItem('adminToken');
      location.reload();
    });
  }

  // ─── Sidebar ─────────────────────────────────────────────
  function initSidebar() {
    document.querySelectorAll('.sidebar-link, .quick-link').forEach(link => {
      link.addEventListener('click', () => {
        const panel = link.dataset.panel;
        if (panel) switchPanel(panel);
      });
    });
  }

  function switchPanel(name) {
    currentPanel = name;
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.panel === name));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
    const titles = { dashboard: 'Dashboard', settings: 'Site Settings', projects: 'Projects', services: 'Services', team: 'Team Photos', workshops: 'Workshops', about: 'About Content' };
    document.getElementById('topbar-title').textContent = titles[name] || name;
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    loadPanel(name);
  }

  function loadPanel(name) {
    if (name === 'projects') loadProjects();
    if (name === 'services') loadServicesAdmin();
    if (name === 'team') loadTeamAdmin();
    if (name === 'workshops') loadWorkshopsAdmin();
    if (name === 'about') loadAboutAdmin();
    if (name === 'settings') loadSettingsAdmin();
    if (name === 'whatsapp') loadWhatsappAdmin();
  }

  // ─── Dashboard ───────────────────────────────────────────
  async function loadDashboard() {
    try {
      const [proj, svc, team, work] = await Promise.all([
        api('GET', '/api/projects'), api('GET', '/api/services'),
        api('GET', '/api/team'), api('GET', '/api/workshops')
      ]);
      setText('stat-projects', proj.length);
      setText('stat-services', svc.length);
      setText('stat-team', team.length);
      setText('stat-workshops', work.length);
    } catch (e) { }
  }

  // ─── Settings ────────────────────────────────────────────
  async function loadSettingsAdmin() {
    try {
      const s = await api('GET', '/api/settings');
      setValue('set-site-name', s.site_name || 'Onix');
      setValue('set-hero-title', s.hero_title || '');
      setValue('set-hero-sub', s.hero_subtitle || '');
      setValue('set-footer-text', s.footer_text || '');

      // Load Color Theme
      const currColor = s.site_color_theme || 'gold';
      document.querySelectorAll('.theme-color-btn').forEach(b => {
        if(b.dataset.color === currColor) b.style.borderColor = 'white';
        else b.style.borderColor = 'transparent';
      });
      document.documentElement.setAttribute('data-theme-color', currColor);
      updateFaviconTheme(currColor);

      // Show video info if exists
      if (s.hero_video_path) {
        document.getElementById('video-upload-text').innerHTML = `<strong>Current:</strong> ${s.hero_video_path.split('/').pop()}<br/><small>Ready to be replaced</small>`;
      } else {
        document.getElementById('video-upload-text').innerHTML = `<strong>Click to upload</strong> video<br/><small>MP4, WebM, MOV — max 100MB</small>`;
      }

      // Show logo info if exists
      if (s.logo_path) {
        document.getElementById('logo-upload-text').innerHTML = `<strong>Current Logo:</strong> ${s.logo_path.split('/').pop()}<br/><small>Ready to be replaced</small>`;
      } else {
        document.getElementById('logo-upload-text').innerHTML = `<strong>Click to upload</strong> logo<br/><small>PNG, SVG, JPG — max 5MB</small>`;
      }
    } catch (e) { }
  }

  function initSettingsForms() {
    // Theme Color Selection
    document.querySelectorAll('.theme-color-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const color = btn.dataset.color;
        // Update UI
        document.querySelectorAll('.theme-color-btn').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = 'white';
        document.documentElement.setAttribute('data-theme-color', color);
        updateFaviconTheme(color);
        // Save to DB
        try {
          await api('POST', '/api/admin/settings', { setting_key: 'site_color_theme', setting_value: color });
          showFeedback('fb-theme', '✓ Theme color updated globally.', 'success');
        } catch (e) {
          showFeedback('fb-theme', 'Failed to save theme color.', 'error');
        }
      });
    });

    // Video filename display
    document.getElementById('hero-video-file').addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) document.getElementById('video-upload-text').innerHTML = `<strong>${f.name}</strong><br/><small>${(f.size / 1024 / 1024).toFixed(1)} MB</small>`;
    });

    // Logo save
    document.getElementById('btn-save-logo').addEventListener('click', async () => {
      const file = document.getElementById('site-logo-file').files[0];
      if (!file) return showFeedback('fb-logo', 'Please select a logo file.', 'error');
      setBtnLoader('btn-save-logo', true, 'Uploading...');
      
      const compressedFile = await compressImage(file);
      const fd = new FormData();
      fd.append('setting_key', 'logo_path');
      fd.append('upload_type', 'logo');
      fd.append('file', compressedFile);
      try {
        showFeedback('fb-logo', 'Uploading logo...', 'success');
        const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') };
        const res = await fetch('/api/admin/settings', { method: 'POST', headers, body: fd });
        const data = await res.json();
        if (data.success) {
          showFeedback('fb-logo', '✓ Logo updated successfully.', 'success');
          loadSettingsAdmin(); // Refresh display
        } else {
          showFeedback('fb-logo', 'Upload error: ' + (data.error || 'Unknown'), 'error');
        }
      } catch (e) { showFeedback('fb-logo', 'Upload failed.', 'error'); }
      finally { setBtnLoader('btn-save-logo', false, 'Upload Logo'); }
    });

    // Video save
    document.getElementById('btn-save-video').addEventListener('click', async () => {
      const file = document.getElementById('hero-video-file').files[0];
      if (!file) return showFeedback('fb-video', 'Please select a video file.', 'error');
      setBtnLoader('btn-save-video', true, 'Uploading...');
      const fd = new FormData();
      fd.append('setting_key', 'hero_video_path');
      fd.append('upload_type', 'video');
      fd.append('file', file);
      try {
        showFeedback('fb-video', 'Uploading video... please wait.', 'success');
        const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') };
        const res = await fetch('/api/admin/settings', { method: 'POST', headers, body: fd });
        const data = await res.json();
        if (data.success) {
          showFeedback('fb-video', '✓ Video uploaded successfully.', 'success');
          loadSettingsAdmin(); // Refresh display
        } else {
          showFeedback('fb-video', 'Upload error: ' + (data.error || 'Unknown'), 'error');
        }
      } catch (e) { showFeedback('fb-video', 'Upload failed.', 'error'); }
      finally { setBtnLoader('btn-save-video', false, 'Upload Video'); }
    });

    // Delete Video
    document.getElementById('btn-del-video').addEventListener('click', async () => {
      if (!confirm('Delete hero video?')) return;
      try {
        await api('DELETE', '/api/admin/settings/hero_video_path');
        document.getElementById('hero-video-file').value = '';
        document.getElementById('video-upload-text').innerHTML = `<strong>Click to upload</strong> video<br/><small>MP4, WebM, MOV — max 100MB</small>`;
        showFeedback('fb-video', '✓ Video deleted.', 'success');
      } catch (e) { showFeedback('fb-video', 'Delete failed.', 'error'); }
    });

    // Text settings save
    document.getElementById('btn-save-text').addEventListener('click', async () => {
      setBtnLoader('btn-save-text', true, 'Saving...');
      try {
        await Promise.all([
          api('POST', '/api/admin/settings', { setting_key: 'site_name', setting_value: getValue('set-site-name') }),
          api('POST', '/api/admin/settings', { setting_key: 'hero_title', setting_value: getValue('set-hero-title') }),
          api('POST', '/api/admin/settings', { setting_key: 'hero_subtitle', setting_value: getValue('set-hero-sub') }),
          api('POST', '/api/admin/settings', { setting_key: 'footer_text', setting_value: getValue('set-footer-text') }),
        ]);
        showFeedback('fb-text', '✓ Text settings saved.', 'success');
      } catch (e) { showFeedback('fb-text', 'Save failed.', 'error'); }
      finally { setBtnLoader('btn-save-text', false, 'Save Text Settings'); }
    });
  }

  // ─── Projects ────────────────────────────────────────────
  async function loadProjects() {
    const el = document.getElementById('projects-list');
    el.innerHTML = '<div style="color:var(--text-3);padding:20px">Loading...</div>';
    try {
      const items = await api('GET', '/api/projects');
      document.getElementById('project-count').textContent = `${items.length} project${items.length !== 1 ? 's' : ''}`;
      el.innerHTML = '';
      if (!items.length) { el.innerHTML = '<div style="color:var(--text-3);padding:20px">No projects yet. Click "Add Project" to begin.</div>'; return; }
      items.forEach(p => el.appendChild(makeProjectRow(p)));
    } catch (e) { el.innerHTML = '<div style="color:var(--danger);padding:20px">Failed to load projects.</div>'; }
  }

  function makeProjectRow(p) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.id = p.id;
    row.innerHTML = `
      <img class="item-thumb" src="${p.image_path || ''}" alt="${p.title}" onerror="this.style.display='none'" />
      <div class="item-info">
        <h4>${p.title}</h4>
        <span>${p.category || 'Uncategorized'} · Order: ${p.display_order}</span>
      </div>
      <div class="item-actions">
        <button class="btn-edit" onclick="adminEdit('project',${p.id})">Edit</button>
        <button class="btn-del" onclick="adminDel('project',${p.id})">Delete</button>
      </div>`;
    return row;
  }

  document.getElementById('btn-add-project').addEventListener('click', () => openModal('add', 'project'));

  // ─── Services ────────────────────────────────────────────
  async function loadServicesAdmin() {
    const el = document.getElementById('services-list-admin');
    el.innerHTML = '';
    try {
      const items = await api('GET', '/api/services');
      items.forEach(s => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <div class="item-info">
            <h4>${s.title}</h4>
            <span>${(s.description || '').substring(0, 80)}${(s.description || '').length > 80 ? '...' : ''}</span>
          </div>
          <div class="item-actions">
            <button class="btn-edit" onclick="adminEdit('service',${s.id})">Edit</button>
            <button class="btn-del" onclick="adminDel('service',${s.id})">Delete</button>
          </div>`;
        el.appendChild(row);
      });
    } catch (e) { }
  }

  document.getElementById('btn-add-service').addEventListener('click', () => openModal('add', 'service'));

  // ─── Team ────────────────────────────────────────────────
  async function loadTeamAdmin() {
    const el = document.getElementById('team-list-admin');
    el.innerHTML = '';
    try {
      const items = await api('GET', '/api/team');
      if (!items.length) { el.innerHTML = '<div style="color:var(--text-3);padding:20px">No team members yet.</div>'; return; }
      items.forEach(m => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <img class="item-thumb" src="${m.image_path}" alt="${m.name}" style="border-radius:50%;object-fit:cover" onerror="this.style.display='none'" />
          <div class="item-info">
            <h4>${m.name}</h4>
            <span>${m.role || ''}${m.phone ? ' · ' + m.phone : ''}${m.email ? ' · ' + m.email : ''}</span>
          </div>
          <div class="item-actions">
            <button class="btn-edit" onclick="adminEdit('team',${m.id})">Edit</button>
            <button class="btn-del" onclick="adminDel('team',${m.id})">Delete</button>
          </div>`;
        el.appendChild(row);
      });
    } catch (e) { }
  }

  document.getElementById('btn-add-team').addEventListener('click', () => openModal('add', 'team'));

  // ─── Workshops ───────────────────────────────────────────
  async function loadWorkshopsAdmin() {
    const el = document.getElementById('workshops-list-admin');
    el.innerHTML = '';
    try {
      const items = await api('GET', '/api/workshops');
      if (!items.length) { el.innerHTML = '<div style="color:var(--text-3);padding:20px">No workshops yet.</div>'; return; }
      items.forEach(w => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <div class="item-info">
            <h4>${w.title}</h4>
            <span>${w.date_label || ''}</span>
          </div>
          <div class="item-actions">
            <button class="btn-edit" onclick="adminEdit('workshop',${w.id})">Edit</button>
            <button class="btn-del" onclick="adminDel('workshop',${w.id})">Delete</button>
          </div>`;
        el.appendChild(row);
      });
    } catch (e) { }
  }

  document.getElementById('btn-add-workshop').addEventListener('click', () => openModal('add', 'workshop'));

  // ─── About ───────────────────────────────────────────────
  async function loadAboutAdmin() {
    try {
      const data = await api('GET', '/api/about');
      setValue('about-narrative-input', data.narrative || '');
      setValue('about-mission-input', data.mission || '');
    } catch (e) { }
    document.getElementById('btn-save-about').onclick = async () => {
      setBtnLoader('btn-save-about', true, 'Saving...');
      try {
        await Promise.all([
          api('POST', '/api/admin/about', { content_key: 'narrative', content_value: getValue('about-narrative-input') }),
          api('POST', '/api/admin/about', { content_key: 'mission', content_value: getValue('about-mission-input') }),
        ]);
        showFeedback('fb-about', '✓ About content saved.', 'success');
      } catch (e) { showFeedback('fb-about', 'Save failed.', 'error'); }
      finally { setBtnLoader('btn-save-about', false, 'Save About Content'); }
    };
  }

  // ─── WhatsApp ────────────────────────────────────────────
  async function loadWhatsappAdmin() {
    const el = document.getElementById('whatsapp-list-admin');
    if (!el) return;
    el.innerHTML = '';
    try {
      const items = await api('GET', '/api/whatsapp_teammates');
      if (!items.length) { el.innerHTML = '<div style="color:var(--text-3);padding:20px">No team members yet. Add one to show on public widget.</div>'; return; }
      items.forEach(m => {
        const row = document.createElement('div');
        row.className = 'item-row';
        const imgPath = m.image_path && m.image_path.startsWith('http') ? m.image_path : (m.image_path ? `/${m.image_path.replace(/\\\\/g, '/')}` : '/images/default-avatar.png');
        row.innerHTML = `
          <img class="item-thumb" src="${imgPath}" alt="${m.name}" style="border-radius:50%;object-fit:cover" onerror="this.style.display='none'" />
          <div class="item-info">
            <h4>${m.name} <span style="font-size:12px;font-weight:normal;color:#999">(${m.phone_number})</span></h4>
            <span>${m.role || ''} - ${m.reply_status || ''}</span>
          </div>
          <div class="item-actions">
            <button class="btn-edit" onclick="adminEdit('whatsapp_teammates',${m.id})">Edit</button>
            <button class="btn-del" onclick="adminDel('whatsapp_teammates',${m.id})">Delete</button>
          </div>`;
        el.appendChild(row);
      });
    } catch (e) { }
  }

  const btnAddWhatsapp = document.getElementById('btn-add-whatsapp');
  if (btnAddWhatsapp) btnAddWhatsapp.addEventListener('click', () => openModal('add', 'whatsapp_teammates'));

  // ─── Modal ───────────────────────────────────────────────
  function initModal() {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('admin-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('admin-modal')) closeModal();
    });

    document.getElementById('modal-form').addEventListener('submit', async e => {
      e.preventDefault();
      await handleModalSubmit();
    });
  }

  const MODAL_FIELDS = {
    project: [
      { id: 'f-title', label: 'Title', type: 'text', required: true, key: 'title' },
      { id: 'f-cat', label: 'Category', type: 'text', key: 'category', placeholder: 'Architecture, Interior, Residential...' },
      { id: 'f-target', label: 'Display On', type: 'select', key: 'target_page', options: ['both', 'home', 'work'] },
      { id: 'f-desc', label: 'Description', type: 'textarea', key: 'description' },
      { id: 'f-order', label: 'Display Order', type: 'number', key: 'display_order' },
      { id: 'f-img', label: 'Project Image', type: 'file', key: 'image' },
    ],
    service: [
      { id: 'f-title', label: 'Service Title', type: 'text', required: true, key: 'title' },
      { id: 'f-desc', label: 'Description', type: 'textarea', key: 'description' },
      { id: 'f-icon', label: 'Icon', type: 'select', key: 'icon', options: ['building', 'layout', 'leaf', 'award', 'tool'] },
      { id: 'f-order', label: 'Display Order', type: 'number', key: 'display_order' },
    ],
    team: [
      { id: 'f-name',     label: 'Full Name',             type: 'text',     required: true, key: 'name' },
      { id: 'f-role',     label: 'Position / Role',        type: 'text',     key: 'role',           placeholder: 'e.g. CEO, Architect' },
      { id: 'f-phone',    label: 'Phone Number',           type: 'text',     key: 'phone',          placeholder: '+230 5258 4240' },
      { id: 'f-email',    label: 'Email Address',          type: 'text',     key: 'email',          placeholder: 'name@company.com' },
      { id: 'f-cal',      label: 'Meeting Schedule Link',  type: 'text',     key: 'calendar_link',  placeholder: 'https://calendly.com/...' },
      { id: 'f-wa',       label: 'WhatsApp Link',          type: 'text',     key: 'whatsapp_link',  placeholder: 'https://wa.me/...' },
      { id: 'f-desc',     label: 'Short Description',      type: 'textarea', key: 'description',    placeholder: 'Brief bio or expertise summary...' },
      { id: 'f-order',    label: 'Display Order',          type: 'number',   key: 'display_order' },
      { id: 'f-img',      label: 'Team Member Photo',      type: 'file',     key: 'image' },
    ],
    workshop: [
      { id: 'f-title', label: 'Workshop Title', type: 'text', required: true, key: 'title' },
      { id: 'f-desc', label: 'Short Description', type: 'textarea', key: 'description' },
      { id: 'f-date', label: 'Date Label', type: 'text', key: 'date_label', placeholder: 'Spring 2026' },
      { id: 'f-learn', label: '"Learn from the best" Content', type: 'textarea', key: 'learn_more' },
      { id: 'f-speakers', label: '"Our Speakers" Content', type: 'textarea', key: 'our_speakers' },
      { id: 'f-biz', label: '"Improve your business" Content', type: 'textarea', key: 'business_knowledge' },
      { id: 'f-order', label: 'Display Order', type: 'number', key: 'display_order' },
    ],
    whatsapp_teammates: [
      { id: 'f-name', label: 'Full Name', type: 'text', required: true, key: 'name' },
      { id: 'f-role', label: 'Role / Title', type: 'text', key: 'role', placeholder: 'e.g. Senior Consultant' },
      { id: 'f-phone', label: 'WhatsApp Number', type: 'text', required: true, key: 'phone_number', placeholder: '+250 790 128 174' },
      { id: 'f-reply', label: 'Reply Status', type: 'text', key: 'reply_status', placeholder: 'Typically replies within 1 hour' },
      { id: 'f-welcome', label: 'Welcome Message', type: 'textarea', key: 'welcome_msg', placeholder: "Hi! I'm interested in your properties." },
      { id: 'f-order', label: 'Display Order', type: 'number', key: 'display_order' },
      { id: 'f-img', label: 'Profile Image', type: 'file', key: 'image' },
    ],
  };

  function openModal(mode, entity, data = {}) {
    modalMode = mode;
    modalEntity = entity;
    editingId = data.id || null;

    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
    document.getElementById('modal-title').textContent = `${capitalize(mode)} ${capitalize(entity)}`;
    document.getElementById('modal-feedback').style.display = 'none';

    const fieldsEl = document.getElementById('modal-fields');
    fieldsEl.innerHTML = '';

    const fields = MODAL_FIELDS[entity] || [];
    fields.forEach(f => {
      const div = document.createElement('div');
      div.className = 'admin-field';
      div.style.gridColumn = (f.type === 'textarea') ? '1 / -1' : '';

      let input = '';
      if (f.type === 'textarea') {
        input = `<textarea id="${f.id}" name="${f.key}" rows="3" ${f.required ? 'required' : ''}>${data[f.key] || ''}</textarea>`;
      } else if (f.type === 'select') {
        const opts = (f.options || []).map(o => `<option value="${o}" ${data[f.key] === o ? 'selected' : ''}>${o}</option>`).join('');
        input = `<select id="${f.id}" name="${f.key}">${opts}</select>`;
      } else if (f.type === 'file') {
        input = `<input type="file" id="${f.id}" name="${f.key}" accept="image/*" />`;
        if (data.image_path) {
          input += `<img src="${data.image_path}" style="height:60px;object-fit:cover;margin-top:8px;border:1px solid var(--border)" alt="" />`;
        }
      } else {
        input = `<input type="${f.type}" id="${f.id}" name="${f.key}" value="${data[f.key] || ''}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />`;
      }

      div.innerHTML = `<label for="${f.id}">${f.label}</label>${input}`;
      fieldsEl.appendChild(div);
    });

    // Make form 2-column where possible
    fieldsEl.style.gridTemplateColumns = '1fr 1fr';

    document.getElementById('admin-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('admin-modal').classList.remove('open');
    modalMode = null; modalEntity = null; editingId = null;
  }

  async function handleModalSubmit() {
    const fb = document.getElementById('modal-feedback');
    const fields = MODAL_FIELDS[modalEntity] || [];
    const hasFile = fields.some(f => f.type === 'file');

    let body;
    let headers = { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') };

    if (hasFile) {
      body = new FormData();
      for (const f of fields) {
        const el = document.getElementById(f.id);
        if (!el) continue;
        if (f.type === 'file') {
          body.append('upload_type', modalEntity);
          if (el.files[0]) {
            const compressedFile = await compressImage(el.files[0]);
            body.append('image', compressedFile);
          }
        } else {
          body.append(f.key, el.value);
        }
      }
    } else {
      const obj = {};
      fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) obj[f.key] = el.value;
      });
      body = JSON.stringify(obj);
      headers['Content-Type'] = 'application/json';
    }

    console.log('Admin: Sending project data:', hasFile ? Object.fromEntries(body) : JSON.parse(body));

    const endpointMap = { project: 'projects', service: 'services', team: 'team', workshop: 'workshops', whatsapp_teammates: 'whatsapp_teammates' };
    const ep = endpointMap[modalEntity];
    const url = modalMode === 'edit' ? `/api/admin/${ep}/${editingId}` : `/api/admin/${ep}`;
    const method = modalMode === 'edit' ? 'PUT' : 'POST';

    setBtnLoader('modal-submit', true, 'Saving...');

    try {
      const res = await fetch(url, { method, headers, body });
      if (!res.ok) throw new Error(await res.text());
      const successMsg = hasFile && modalEntity === 'project' ? '✓ Image uploaded successfully.' : '✓ Post saved successfully.';
      fb.textContent = successMsg;
      fb.className = 'admin-feedback success';
      fb.style.display = 'block';
      setTimeout(() => {
        closeModal();
        loadPanel(currentPanel);
        loadDashboard();
      }, 800);
    } catch (e) {
      fb.textContent = 'Error: ' + e.message;
      fb.className = 'admin-feedback error';
      fb.style.display = 'block';
    } finally {
      setBtnLoader('modal-submit', false, 'Save');
    }
  }

  // ─── Global edit/delete (called from inline onclick) ────
  window.adminEdit = async (entity, id) => {
    const endpointMap = { project: 'projects', service: 'services', team: 'team', workshop: 'workshops', whatsapp_teammates: 'whatsapp_teammates' };
    const ep = endpointMap[entity];
    try {
      // Fetch all, find by id
      const items = await api('GET', `/api/${ep}`);
      const item = items.find(i => i.id === id);
      if (item) openModal('edit', entity, item);
    } catch (e) { }
  };

  window.adminDel = async (entity, id) => {
    if (!confirm(`Delete this ${entity}? This cannot be undone.`)) return;
    const endpointMap = { project: 'projects', service: 'services', team: 'team', workshop: 'workshops', whatsapp_teammates: 'whatsapp_teammates' };
    const ep = endpointMap[entity];
    try {
      const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') };
      await fetch(`/api/admin/${ep}/${id}`, { method: 'DELETE', headers });
      loadPanel(currentPanel);
      loadDashboard();
    } catch (e) { alert('Delete failed.'); }
  };

  // ─── Utilities ───────────────────────────────────────────
  async function api(method, url, data) {
    const opts = {
      method,
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined
    };
    const token = localStorage.getItem('adminToken');
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, opts);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }
    return res.json();
  }

  function showFeedback(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = 'admin-feedback ' + type;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  async function compressImage(file) {
    if (!file || !file.type.startsWith('image/')) return file;
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
    if (file.size < 500 * 1024) return file; // Skip if smaller than 500KB

    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const max = 1920;
          if (w > max) { h = Math.round((max / w) * h); w = max; }
          
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(blob => {
            resolve(blob ? new File([blob], file.name, { type: mime }) : file);
          }, mime, 0.85);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  function setBtnLoader(id, loading, txt) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const txtSpan = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (loading) {
      if (txtSpan) txtSpan.textContent = txt || 'Saving...';
      if (loader) loader.style.display = 'block';
    } else {
      if (txtSpan) txtSpan.textContent = txt || 'Save';
      if (loader) loader.style.display = 'none';
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

})();

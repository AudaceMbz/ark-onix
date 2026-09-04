(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initProjectDetail();
  });

  async function initProjectDetail() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
      window.location.href = '/';
      return;
    }

    try {
      const resp = await fetch(`/api/projects?id=${projectId}`);
      if (!resp.ok) throw new Error('Project not found');
      const project = await resp.json();

      renderProjectDetail(project);
      setupProjectNav(projectId);
    } catch (err) {
      console.error('Failed to load project:', err);
      document.getElementById('project-detail-content').innerHTML = `
        <div style="padding: 100px; text-align: center;">
          <h2>Project Not Found</h2>
          <p>The project you're looking for doesn't exist or has been removed.</p>
          <a href="/" class="btn-minimal">Back to Home</a>
        </div>
      `;
    }
  }

  function renderProjectDetail(p) {
    // Basic Info
    document.title = `${p.title} | ArkiOnix Studio`;
    document.getElementById('pd-title').textContent = p.title;
    document.getElementById('pd-location').textContent = p.location || 'Architecture';
    document.getElementById('pd-status').textContent = p.project_status || 'Completed';
    document.getElementById('pd-featured-img').src = p.image_path;

    // Sidebar
    document.getElementById('pd-client').textContent = p.client || 'Private Client';
    document.getElementById('pd-architect').textContent = p.lead_architect || 'ArkiOnix Team';
    document.getElementById('pd-type').textContent = p.project_type || p.category || 'Architecture';
    document.getElementById('pd-timeline').textContent = p.start_date && p.completion_date 
      ? `${p.start_date} — ${p.completion_date}` 
      : (p.start_date || p.completion_date || '2025');
    document.getElementById('pd-budget').textContent = p.budget || 'Confidential';

    // Description/Story
    document.getElementById('pd-concept').textContent = p.story_concept || p.description || 'Information coming soon...';
    document.getElementById('pd-materials').textContent = p.story_materials || 'High-end architectural materials selected for durability and aesthetic excellence.';
    document.getElementById('pd-challenges').textContent = p.story_challenges || 'Our team overcame significant site constraints to deliver a seamless design.';

    // Stats
    document.getElementById('stat-area').textContent = p.area || '—';
    document.getElementById('stat-floors').textContent = p.stat_floors || '—';
    document.getElementById('stat-height').textContent = p.stat_height || '—';
    document.getElementById('stat-duration').textContent = p.stat_duration || '—';
    document.getElementById('stat-team').textContent = p.stat_team || '—';

    // Gallery
    const grid = document.getElementById('pd-gallery-grid');
    if (p.images && p.images.length > 0) {
      grid.innerHTML = p.images.map(img => `
        <div class="pd-gallery-item" onclick="openFullLightbox('${img.image_path}')">
          <img src="${img.image_path}" alt="Angle" loading="lazy">
        </div>
      `).join('');
    } else {
      document.querySelector('.pd-gallery-section').style.display = 'none';
    }
  }

  async function setupProjectNav(currentId) {
    try {
      const resp = await fetch('/api/projects');
      const projects = await resp.json();
      const idx = projects.findIndex(p => p.id == currentId);

      const prevBtn = document.getElementById('pd-prev');
      const nextBtn = document.getElementById('pd-next');

      if (idx > 0) {
        prevBtn.onclick = () => window.location.href = `project-detail.html?id=${projects[idx - 1].id}`;
      } else {
        prevBtn.style.opacity = '0.3';
        prevBtn.style.pointerEvents = 'none';
      }

      if (idx < projects.length - 1) {
        nextBtn.onclick = () => window.location.href = `project-detail.html?id=${projects[idx + 1].id}`;
      } else {
        nextBtn.style.opacity = '0.3';
        nextBtn.style.pointerEvents = 'none';
      }
    } catch (e) {
      console.warn('Nav setup failed', e);
    }
  }

  // Simple Lightbox Helper for Detail Page
  window.openFullLightbox = function(src) {
    // If global lightbox exists in app.js, we should try to use it
    // For now, if we are on a separate page, we can show a simple full-screen image
    const overlay = document.createElement('div');
    overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    overlay.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;object-fit:contain;box-shadow:0 30px 60px rgba(0,0,0,0.5);">`;
    overlay.onclick = () => document.body.removeChild(overlay);
    document.body.appendChild(overlay);
  };
})();

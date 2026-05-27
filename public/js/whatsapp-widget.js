document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inject link to CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/whatsapp-widget.css';
    document.head.appendChild(link);

    // Fetch teammates
    let teammates = [];
    try {
      const response = await fetch('/api/whatsapp_teammates');
      if (response.ok) {
        teammates = await response.json();
      }
    } catch (e) {
      console.warn('Failed to load whatsapp teammates', e);
    }

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'whatsapp-widget-container';
    widgetContainer.id = 'whatsapp-widget';

    // Widget Popup (initially hidden)
    const popup = document.createElement('div');
    popup.className = 'whatsapp-popup';
    popup.id = 'whatsapp-popup';
    
    let popupHTML = `
      <div class="whatsapp-popup-header">
        <div class="whatsapp-popup-title">
          <div class="header-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"></path>
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path>
            </svg>
          </div>
          <span>Chat with us</span>
        </div>
        <button class="whatsapp-popup-close" id="whatsapp-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="whatsapp-popup-body">
        <p class="whatsapp-popup-subtitle">Select a team member to start chatting</p>
        <div class="whatsapp-teammates-list">
    `;

    if (teammates && teammates.length > 0) {
      teammates.forEach(tm => {
        const imgPath = tm.image_path && tm.image_path.startsWith('http') ? tm.image_path : (tm.image_path ? `/${tm.image_path.replace(/\\\\/g, '/')}`.replace('//', '/') : '/images/default-avatar.png');
        const welcomeMsg = encodeURIComponent(tm.welcome_msg || 'Hi!');
        // Format number: remove + and spaces
        const phone = (tm.phone_number || '').replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${phone}?text=${welcomeMsg}`;

        popupHTML += `
            <a href="${waUrl}" target="_blank" class="whatsapp-teammate-card">
              <img src="${imgPath}" alt="${tm.name}" class="whatsapp-teammate-img" onerror="this.src='/images/default-avatar.png'">
              <div class="whatsapp-teammate-info">
                <div class="whatsapp-teammate-name">${tm.name}</div>
                <div class="whatsapp-teammate-role">${tm.role || ''}</div>
                <div class="whatsapp-teammate-status">${tm.reply_status || 'Typically replies within 1 hour'}</div>
              </div>
              <div class="whatsapp-teammate-icon-wrapper">
                <svg class="whatsapp-teammate-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"></path>
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path>
                </svg>
              </div>
            </a>
        `;
      });
    } else {
      popupHTML += `<div style="text-align:center;padding:20px;color:#888;">No team members available.</div>`;
    }

    popupHTML += `
        </div>
        <div class="whatsapp-popup-footer">Powered by WhatsApp</div>
      </div>
    `;
    popup.innerHTML = popupHTML;

    // Floating Button
    const button = document.createElement('button');
    button.className = 'whatsapp-floating-btn';
    button.id = 'whatsapp-toggle';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M12.01 2C6.49 2 2.01 6.48 2.01 12c0 1.76.46 3.42 1.28 4.88L2 22l5.24-1.28c1.42.76 3.03 1.19 4.77 1.19 5.52 0 10-4.48 10-10S17.53 2 12.01 2z" fill="var(--accent)"/>
        <path d="M16.92 14.88c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.7-.64-1.18-1.44-1.32-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.11 3.64.57.25 1.02.4 1.37.51.58.18 1.11.16 1.53.1.48-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" fill="var(--bg)"/>
      </svg>
    `;

    widgetContainer.appendChild(popup);
    widgetContainer.appendChild(button);
    document.body.appendChild(widgetContainer);

    // Toggle Logic
    const toggleBtn = document.getElementById('whatsapp-toggle');
    const closeBtn = document.getElementById('whatsapp-close');
    const popupEl = document.getElementById('whatsapp-popup');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popupEl.classList.toggle('active');
    });

    closeBtn.addEventListener('click', () => {
      popupEl.classList.remove('active');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!widgetContainer.contains(e.target)) {
        popupEl.classList.remove('active');
      }
    });

  } catch (error) {
    console.error('Error loading WhatsApp widget:', error);
  }
});

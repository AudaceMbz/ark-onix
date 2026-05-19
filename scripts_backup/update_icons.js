const fs = require('fs');

const files = ['index.html', 'about.html', 'contact.html', 'services.html', 'training.html', 'work.html'];

files.forEach(f => {
  const path = 'public/' + f;
  if (!fs.existsSync(path)) return;
  let txt = fs.readFileSync(path, 'utf8');

  // Match the entire LinkedIn <a> tag globally 
  const regex = /<a [^>]*?aria-label="LinkedIn"[^>]*?>[\s\S]*?<\/svg>\s*<\/a>/i;
  
  const whatsappSvg = `<a href="#" aria-label="WhatsApp" class="social-link" style="color:var(--text-3);transition:color 0.3s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-3)'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"></path>
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path>
            </svg>
          </a>`;

  txt = txt.replace(regex, whatsappSvg);
  fs.writeFileSync(path, txt);
  console.log('Fixed:', f);
});

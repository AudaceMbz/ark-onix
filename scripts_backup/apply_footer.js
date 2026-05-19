const fs = require('fs');

const files = ['index.html', 'about.html', 'contact.html', 'services.html', 'training.html', 'work.html'];

files.forEach(f => {
  const path = 'public/' + f;
  if (!fs.existsSync(path)) return;
  let txt = fs.readFileSync(path, 'utf8');

  // Regex to match the footer-brand section flexibly
  const searchRegex = /<div class="footer-brand">[\s\S]*?<p class="footer-tagline">[\s\S]*?<\/p>\s*(?:<div class="footer-social"[\s\S]*?<\/div>\s*)?<\/div>/;

  const replaceWith = `<div class="footer-brand">
        <a href="/" style="display:inline-block; margin-bottom: 20px;">
          <img src="images/lonix-logo.png" alt="ONIX STUDIO Logo" class="footer-logo-img" style="height: 36px; width: auto; object-fit: contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
          <div class="footer-logo-text" style="display:none; font-family: var(--font-serif); font-size: 1.8rem; letter-spacing: 0.2em; color: var(--text);">ONIX STUDIO</div>
        </a>
        <p class="footer-tagline">Architecture is about experience,<br />not only visual.</p>
        
        <div class="footer-social" style="display:flex;gap:16px;margin-top:20px;">
          <a href="#" aria-label="Instagram" class="social-link" style="color:var(--text-3);transition:color 0.3s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-3)'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="#" aria-label="LinkedIn" class="social-link" style="color:var(--text-3);transition:color 0.3s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-3)'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
        </div>
      </div>`;

  txt = txt.replace(searchRegex, replaceWith);
  fs.writeFileSync(path, txt);
  console.log('Fixed:', f);
});

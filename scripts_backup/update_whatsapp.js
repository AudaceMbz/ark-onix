const fs = require('fs');

const files = ['index.html', 'about.html', 'contact.html', 'services.html', 'training.html', 'work.html'];

files.forEach(f => {
  const path = 'public/' + f;
  if (!fs.existsSync(path)) return;
  let txt = fs.readFileSync(path, 'utf8');

  txt = txt.replace(
    /<a href="#" aria-label="WhatsApp"/g,
    '<a href="https://wa.me/250790128174" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"'
  );

  fs.writeFileSync(path, txt);
  console.log('Fixed:', f);
});

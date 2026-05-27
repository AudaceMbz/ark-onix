const fs = require('fs');
const files = ['about.html', 'contact.html', 'services.html', 'training.html', 'work.html'];
files.forEach(f => {
  const p = 'public/' + f;
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/<script src=" \/js\/whatsapp-widget\.js\\><\/script>/g, '<script src="/js/whatsapp-widget.js"></script>');
  fs.writeFileSync(p, text);
});

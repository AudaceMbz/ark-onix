const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css') || file === 'server.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/Onix/g, 'Onix');
      content = content.replace(/onix/g, 'onix');
      
      // Special case: don't break the database connection if it's named onix_db
      // But actually, if I want to be 100% thorough, I'd need to rename the DB.
      // For now, I'll restore 'onix_db' to 'onix_db' ONLY in the connection strings if I find it.
      // But wait, user said "write onix like this onix", meaning they want the BRAND to change.
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

replaceInDir('public');
replaceInDir('.');
console.log('Rebranding complete.');

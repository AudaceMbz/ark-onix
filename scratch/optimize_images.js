const fs = require('fs');
const path = require('path');
const JimpModule = require('c:/Users/HP/OneDrive/Desktop/final projet/arki onix/node_modules/jimp');
const Jimp = JimpModule.Jimp || JimpModule;

const PROJECTS_DIR = 'c:/Users/HP/OneDrive/Desktop/final projet/arki onix/public/images/projects';

async function optimizeImages() {
  console.log('Starting image optimization pass...');
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error('Projects directory does not exist:', PROJECTS_DIR);
    return;
  }

  const files = fs.readdirSync(PROJECTS_DIR);
  let totalSavings = 0;

  for (const file of files) {
    const filePath = path.join(PROJECTS_DIR, file);
    const ext = path.extname(file).toLowerCase();

    // Only process images (jpg, jpeg, png)
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      continue;
    }

    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);

    // If image is larger than 500 KB, compress it!
    if (stats.size > 500 * 1024) {
      console.log(`Processing ${file} (${sizeMB.toFixed(2)} MB)...`);
      try {
        const image = await Jimp.read(filePath);
        
        // Resize to a maximum width of 1200px to maintain crisp desktop displays
        if (image.bitmap.width > 1200) {
          image.resize({ w: 1200 });
        }

        // Compress to 75% quality JPEG using getBuffer which is fully supported in Jimp v1
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        const buffer = await image.getBuffer(mimeType, { quality: 75 });
        
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, buffer);

        // Replace original
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);

        const newStats = fs.statSync(filePath);
        const newSizeMB = newStats.size / (1024 * 1024);
        const savedMB = sizeMB - newSizeMB;
        totalSavings += savedMB;

        console.log(`Optimized ${file}: ${sizeMB.toFixed(2)} MB -> ${newSizeMB.toFixed(2)} MB (Saved ${savedMB.toFixed(2)} MB)`);
      } catch (err) {
        console.error(`Failed to optimize ${file}:`, err);
      }
    }
  }

  console.log(`Image optimization complete. Total disk savings: ${totalSavings.toFixed(2)} MB!`);
}

optimizeImages();

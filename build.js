const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const OUTPUT_FILE = path.join(__dirname, 'public', 'images.json');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

let files = [];

if (fs.existsSync(IMAGES_DIR)) {
  const dirEntries = fs.readdirSync(IMAGES_DIR);
  
  for (const file of dirEntries) {
    if (file.startsWith('.')) continue;
    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
    
    const filePath = path.join(IMAGES_DIR, file);
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) continue;
    
    files.push({
      name: file,
      url: '/images/' + encodeURIComponent(file)
    });
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ images: files, total: files.length }));
console.log('Generated images.json with ' + files.length + ' images');

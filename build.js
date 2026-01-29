const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const OUTPUT_FILE = path.join(__dirname, 'public', 'images.json');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Set your launch date here
const LAUNCH_DATE = new Date('2026-01-29');
const today = new Date();
const daysSinceLaunch = Math.floor((today - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
const maxImages = Math.max(1, daysSinceLaunch + 1);

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
      url: '/images/' + encodeURIComponent(file),
      mtime: stats.mtime.getTime()
    });
  }
  
  // Sort by mtime (oldest first so they appear in order added)
  files.sort((a, b) => a.mtime - b.mtime);
  
  // Only show images up to maxImages
  files = files.slice(0, maxImages);
  
  // Shuffle for random display order
  for (let i = files.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [files[i], files[j]] = [files[j], files[i]];
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ images: files, total: files.length }));
console.log('Day ' + (daysSinceLaunch + 1) + ': Showing ' + files.length + ' of ' + maxImages + ' max images');

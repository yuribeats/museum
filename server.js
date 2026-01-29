const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// In-memory cache
let cache = {
  images: [],
  timestamp: 0
};
const CACHE_TTL = 2000;

// Security: disable x-powered-by header
app.disable('x-powered-by');

// Security: prevent directory traversal in image names
function isValidFilename(filename) {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.includes('..')) return false;
  if (filename.includes('/') || filename.includes('\\')) return false;
  if (filename.startsWith('.')) return false;
  return true;
}

function getImageList() {
  const now = Date.now();

  if (cache.images.length > 0 && (now - cache.timestamp) < CACHE_TTL) {
    return cache.images;
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    try {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    } catch (e) {
      console.error('Failed to create images directory:', e.message);
    }
    cache.images = [];
    cache.timestamp = now;
    return [];
  }

  let files = [];

  try {
    const dirEntries = fs.readdirSync(IMAGES_DIR);

    for (const file of dirEntries) {
      if (!isValidFilename(file)) continue;

      const ext = path.extname(file).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const filePath = path.join(IMAGES_DIR, file);
      let mtime = null;

      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        mtime = stats.mtime.getTime();
      } catch (e) {
        continue;
      }

      files.push({
        name: file,
        url: `/images/${encodeURIComponent(file)}`,
        mtime: mtime
      });
    }

    files.sort((a, b) => {
      if (a.mtime !== null && b.mtime !== null) {
        return b.mtime - a.mtime;
      }
      if (a.mtime !== null) return -1;
      if (b.mtime !== null) return 1;
      return a.name.localeCompare(b.name);
    });

  } catch (e) {
    console.error('Error reading images directory:', e.message);
    files = [];
  }

  cache.images = files;
  cache.timestamp = now;

  return files;
}

// Serve static files with appropriate caching
app.use(express.static('public', {
  index: 'index.html',
  dotfiles: 'ignore',
  etag: true,
  lastModified: true,
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    // Long cache for images (1 year, immutable)
    if (filePath.includes('/images/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Short cache for HTML/CSS/JS (1 hour)
    else if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// API endpoint
app.get('/api/images', (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const allImages = getImageList();
  const total = allImages.length;
  const paginatedImages = allImages.slice(offset, offset + limit);

  res.set('Cache-Control', 'public, max-age=2');
  res.json({
    images: paginatedImages,
    total: total
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).send('Internal server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Museum server running on port ${PORT}`);
  console.log(`Images directory: ${IMAGES_DIR}`);
});

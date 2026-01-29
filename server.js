const express = require('express');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const PINATA_API_KEY = 'e45e5fb53dd47783022c';
const PINATA_SECRET = 'f740458d9919f1d8a669b3ddde0736e10bbee6c648b85a002be6465b1f7705c1';

let cache = { images: [], timestamp: 0 };
const CACHE_TTL = 2000;

let galleryCache = { images: [], timestamp: 0 };
const GALLERY_CACHE_TTL = 30000;

app.disable('x-powered-by');

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));

function isValidFilename(filename) {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;
  if (filename.startsWith('.')) return false;
  return true;
}

function getImageList() {
  const now = Date.now();
  if (cache.images.length > 0 && (now - cache.timestamp) < CACHE_TTL) return cache.images;
  if (!fs.existsSync(IMAGES_DIR)) {
    try { fs.mkdirSync(IMAGES_DIR, { recursive: true }); } catch (e) {}
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
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        files.push({ name: file, url: '/images/' + encodeURIComponent(file), mtime: stats.mtime.getTime() });
      } catch (e) { continue; }
    }
    files.sort((a, b) => b.mtime - a.mtime);
  } catch (e) { files = []; }
  cache.images = files;
  cache.timestamp = now;
  return files;
}

async function getGalleryFromPinata() {
  const now = Date.now();
  if (galleryCache.images.length > 0 && (now - galleryCache.timestamp) < GALLERY_CACHE_TTL) {
    return galleryCache.images;
  }
  try {
    const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=public-gallery', {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET
      }
    });
    const data = await response.json();
    const images = (data.rows || []).map(row => ({
      name: row.metadata.name || row.ipfs_pin_hash,
      url: 'https://gateway.pinata.cloud/ipfs/' + row.ipfs_pin_hash,
      mtime: new Date(row.date_pinned).getTime()
    })).sort((a, b) => b.mtime - a.mtime);
    galleryCache.images = images;
    galleryCache.timestamp = now;
    return images;
  } catch (e) {
    console.error('Pinata fetch error:', e.message);
    return galleryCache.images || [];
  }
}

async function pinToPinata(base64Data, filename) {
  const buffer = Buffer.from(base64Data, 'base64');
  const form = new FormData();
  form.append('file', buffer, { filename: filename, contentType: 'image/png' });
  form.append('pinataMetadata', JSON.stringify({ name: 'public-gallery' }));
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET,
      ...form.getHeaders()
    },
    body: form
  });
  return await response.json();
}

app.use(express.static('public', {
  index: 'index.html',
  dotfiles: 'ignore',
  etag: true,
  lastModified: true,
  maxAge: '1h'
}));

app.get('/api/images', (req, res) => {
  const allImages = getImageList();
  res.json({ images: allImages, total: allImages.length });
});

app.get('/api/gallery', async (req, res) => {
  try {
    const images = await getGalleryFromPinata();
    res.json({ images: images });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || !image.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const filename = 'public-' + Date.now() + '.png';
    const result = await pinToPinata(base64Data, filename);
    console.log('Pinned to IPFS:', result.IpfsHash);
    galleryCache.timestamp = 0;
    res.json({ success: true, url: 'https://gateway.pinata.cloud/ipfs/' + result.IpfsHash });
  } catch (e) {
    console.error('Pinata upload error:', e.message);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));

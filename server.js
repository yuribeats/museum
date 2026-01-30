const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwMzMzMzdmOC0wNTEwLTQ4NTQtYmVjYi1iMGRlNGFlNmExMzAiLCJlbWFpbCI6IncueXVyaS5yeWJha0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTQ1ZTVmYjUzZGQ0Nzc4MzAyMmMiLCJzY29wZWRLZXlTZWNyZXQiOiJmNzQwNDU4ZDk5MTlmMWQ4YTY2OWIzZGRkZTA3MzZlMTBiYmVlNmM2NDhiODVhMDAyYmU2NDY1YjFmNzcwNWMxIiwiZXhwIjoxODAxMjU3MjI0fQ.4pEiKLAZ3leXirocAE0D7g6XrxlnhWUcCyhs745WLmQ';

let cache = { images: [], timestamp: 0 };
const CACHE_TTL = 2000;

let galleryCache = { images: [], timestamp: 0 };
const GALLERY_CACHE_TTL = 10000;

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
    console.log('Fetching gallery from Pinata...');
    const response = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned', {
      headers: {
        'Authorization': 'Bearer ' + PINATA_JWT
      }
    });
    const data = response.data;
    console.log('Pinata rows:', data.rows ? data.rows.length : 0);
    
    const images = (data.rows || [])
      .filter(row => row.metadata && row.metadata.name && row.metadata.name.startsWith('pub9-'))
      .map(row => ({
        name: row.metadata.name,
        url: 'https://gateway.pinata.cloud/ipfs/' + row.ipfs_pin_hash,
        mtime: new Date(row.date_pinned).getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    console.log('Found gallery images:', images.length);
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
  
  form.append('file', buffer, {
    filename: filename,
    contentType: 'image/png'
  });
  
  form.append('pinataMetadata', JSON.stringify({ name: filename }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));
  
  console.log('Uploading to Pinata:', filename, 'size:', buffer.length);
  
  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
      maxBodyLength: Infinity,
      headers: {
        'Authorization': 'Bearer ' + PINATA_JWT,
        ...form.getHeaders()
      }
    });
    console.log('Pinata response:', JSON.stringify(response.data));
    return response.data;
  } catch (e) {
    console.error('Pinata axios error:', e.response ? e.response.data : e.message);
    return { error: e.response ? e.response.data : e.message };
  }
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
    console.error('Gallery error:', e.message);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || !image.startsWith('data:image/png;base64,')) {
      console.log('Invalid image data received');
      return res.status(400).json({ error: 'Invalid image data' });
    }
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const filename = 'pub9-' + Date.now() + '.png';
    const result = await pinToPinata(base64Data, filename);
    
    if (result.IpfsHash) {
      console.log('Successfully pinned:', result.IpfsHash);
      galleryCache.timestamp = 0;
      res.json({ success: true, url: 'https://gateway.pinata.cloud/ipfs/' + result.IpfsHash });
    } else {
      console.error('Pinata error response:', result);
      res.status(500).json({ error: 'Upload failed', details: result });
    }
  } catch (e) {
    console.error('Pinata upload error:', e.message);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));

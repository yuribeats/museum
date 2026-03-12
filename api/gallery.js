const axios = require('axios');
const FormData = require('form-data');

const PINATA_JWT = process.env.PINATA_JWT;

const PREFIX = 'pub16-';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const response = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1000', {
        headers: { 'Authorization': 'Bearer ' + PINATA_JWT }
      });
      
      const images = (response.data.rows || [])
        .filter(row => row.metadata && row.metadata.name && row.metadata.name.startsWith(PREFIX))
        .map(row => ({
          name: row.metadata.name,
          url: 'https://gateway.pinata.cloud/ipfs/' + row.ipfs_pin_hash,
          mtime: new Date(row.date_pinned).getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      return res.status(200).json({ images });
    } catch (e) {
      console.error('Pinata fetch error:', e.message);
      return res.status(500).json({ error: 'Failed to fetch gallery' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { image } = req.body;
      if (!image || !image.startsWith('data:image/png;base64,')) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
      
      const base64Data = image.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = PREFIX + Date.now() + '.png';
      
      const form = new FormData();
      form.append('file', buffer, { filename, contentType: 'image/png' });
      form.append('pinataMetadata', JSON.stringify({ name: filename }));
      form.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));
      
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        maxBodyLength: Infinity,
        headers: {
          'Authorization': 'Bearer ' + PINATA_JWT,
          ...form.getHeaders()
        }
      });
      
      if (response.data.IpfsHash) {
        return res.status(200).json({ 
          success: true, 
          url: 'https://gateway.pinata.cloud/ipfs/' + response.data.IpfsHash 
        });
      } else {
        return res.status(500).json({ error: 'Upload failed' });
      }
    } catch (e) {
      console.error('Pinata upload error:', e.message);
      return res.status(500).json({ error: 'Failed to save image' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

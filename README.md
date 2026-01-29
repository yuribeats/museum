# Museum

Minimal image gallery with infinite scroll. Zero build tools, production-ready.

## Project Structure

```
museum/
├── server.js           # Express server
├── package.json        # Dependencies
├── import.js           # Image import helper
├── Dockerfile          # For Fly.io
├── fly.toml            # Fly.io config
├── render.yaml         # Render config
├── .gitignore
└── public/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── images/         # Your images go here
```

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs at http://localhost:3000
```

## Adding Images

### Manual
```bash
cp ~/Downloads/photo.jpg ./public/images/
```

### Bulk import (supported types only)
```bash
npm run import -- --from ~/Downloads/new_photos
```

### Supported formats
`.jpg` `.jpeg` `.png` `.webp` `.gif`

---

## Deploy to Railway

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and initialize
```bash
railway login
railway init
```

### 3. Deploy
```bash
railway up
```

### 4. Get your URL
```bash
railway open
```

### Environment variables
Railway auto-detects `PORT`. No config needed.

### Adding images in production
Railway doesn't persist filesystem. Options:
- Use Railway Volumes (paid) 
- Commit images to git and redeploy
- Use external storage (S3, Cloudflare R2)

---

## Deploy to Render

### Option A: Via Dashboard
1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add a Disk:
   - **Mount Path:** `/opt/render/project/src/public/images`
   - **Size:** 1 GB (or more)
6. Click "Create Web Service"

### Option B: Via render.yaml
Push repo with `render.yaml` included, Render auto-detects it.

### Adding images in production
```bash
# SSH into Render shell (Dashboard → Shell)
cd /opt/render/project/src/public/images
# Upload via the shell or use SFTP
```

---

## Deploy to Fly.io

### 1. Install Fly CLI
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh
```

### 2. Login
```bash
fly auth login
```

### 3. Launch app
```bash
fly launch --no-deploy
```
When prompted:
- Choose a unique app name (or accept default)
- Choose region closest to you
- Say **No** to Postgres/Redis

### 4. Create persistent volume for images
```bash
fly volumes create museum_images --size 1 --region iad
```
(Replace `iad` with your chosen region)

### 5. Deploy
```bash
fly deploy
```

### 6. Get your URL
```bash
fly open
```

### Adding images in production
```bash
# SSH into the running machine
fly ssh console

# Navigate to images folder
cd /app/public/images

# Upload files via SFTP
fly sftp shell
put /local/path/to/image.jpg /app/public/images/
```

### Useful Fly commands
```bash
fly status          # Check app status
fly logs            # View logs
fly ssh console     # SSH into machine
fly sftp shell      # SFTP file transfer
```

---

## Deploy to VPS (DigitalOcean, Linode, etc.)

### 1. SSH into your server
```bash
ssh root@your-server-ip
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Clone and setup
```bash
cd /var/www
git clone https://github.com/yourusername/museum.git
cd museum
npm install --production
```

### 4. Create systemd service
```bash
sudo nano /etc/systemd/system/museum.service
```

Paste:
```ini
[Unit]
Description=Museum Gallery
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/museum
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 5. Start service
```bash
sudo systemctl daemon-reload
sudo systemctl enable museum
sudo systemctl start museum
```

### 6. Setup nginx reverse proxy
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/museum
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/museum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Adding images in production
```bash
# Via SCP
scp ~/photos/*.jpg root@your-server:/var/www/museum/public/images/

# Via SFTP
sftp root@your-server
put -r ~/photos/* /var/www/museum/public/images/

# Or SSH and pull from git
ssh root@your-server
cd /var/www/museum
git pull
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Server port |

---

## API Reference

### GET /api/images

Returns paginated image list, newest first.

**Query params:**
- `offset` (default: 0)
- `limit` (default: 20, max: 100)

**Response:**
```json
{
  "images": [
    { "name": "photo.jpg", "url": "/images/photo.jpg", "mtime": 1706472000000 }
  ],
  "total": 150
}
```

### GET /health

Returns `OK` with status 200. Use for health checks.

---

## Performance Notes

- Images cached in browser for 1 year (`immutable`)
- API responses cached for 2 seconds
- Directory listing cached in memory (2s TTL)
- Works fine with thousands of images
- No database required

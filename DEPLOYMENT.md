# 🚀 KeySpeed — Complete Production Deployment Guide

This guide covers everything needed to deploy the **KeySpeed** full-stack application (React 19 frontend, NestJS backend, MongoDB, and real-time WebSockets) into production.

---

## 🏗️ System Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Internet / Users              │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS / WSS
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    Nginx / Cloudflare (Port 80/443)    │
                      └──────────────┬──────────────────┬──────┘
                                     │                  │
                    ┌────────────────┴────────┐  ┌──────┴────────────────┐
                    │  Static Assets / SPA    │  │  Reverse Proxy        │
                    │  typearena-frontend     │  │  /api and /socket.io  │
                    │  (React 19 + Vite)      │  │  typearena-backend    │
                    └─────────────────────────┘  │  (NestJS + Socket.io) │
                                                 └──────────────┬────────┘
                                                                │
                                                 ┌──────────────┴────────┐
                                                 │      MongoDB 7.0      │
                                                 └───────────────────────┘
```

---

## 📋 Required Environment Variables

### Backend (`typearena-backend/.env`)
| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `3001` |
| `NODE_ENV` | Runtime environment | `production` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://mongodb:27017/keyspeed` or Atlas URI |
| `JWT_SECRET` | Secret key for signing racer auth tokens | `a-very-long-random-64-char-secret-key` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `FRONTEND_URL` | Public origin of the frontend for CORS & cookies | `https://yourdomain.com` |
| `ADMIN_EMAIL` | Default administrator email | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | Default administrator password | `YourSecureAdminPass123!` |

### Frontend (`typearena-frontend/.env`)
| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API base URL | `https://api.yourdomain.com/api` (or `/api` if proxied) |
| `VITE_SOCKET_URL` | Backend Socket.io base URL | `https://api.yourdomain.com` (or `/` if proxied) |

---

## 🐳 Option 1: 1-Command Docker Compose Deployment (Recommended for VPS)

Ideal for any Linux VPS (Ubuntu, Debian) on DigitalOcean, AWS EC2, Hetzner, Linode, or Vultr.

### Prerequisites
Install Docker & Docker Compose on your server:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

### Step 1: Clone the Repository & Configure Environment
```bash
git clone https://github.com/your-username/typing-arena.git
cd typing-arena

# Copy and edit the environment file
cp .env.example .env
nano .env
```
Ensure `FRONTEND_URL`, `JWT_SECRET`, `VITE_API_URL`, and `VITE_SOCKET_URL` match your domain or VPS public IP.

### Step 2: Build & Start All Services
```bash
docker compose up -d --build
```
This automatically:
1. Starts **MongoDB 7.0** with health checks and persistent storage (`mongo-data`).
2. Builds and starts the **NestJS Backend** on port `3001`.
3. Builds the **React 18 Frontend** with Nginx on port `80`.

### Step 3: Seed the Administrator Account
```bash
docker compose exec backend npm run seed:admin:prod
```
Log in at `http://your-server-ip/login` using your configured `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### Step 4: Add Free SSL via Let's Encrypt (Certbot)
If you point a domain (e.g. `yourdomain.com`) to your server:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## ☁️ Option 2: Cloud / PaaS Deployment (Vercel + Render + MongoDB Atlas)

Zero-server management using free/cheap managed cloud services.

### 1. Database: MongoDB Atlas
1. Create a free M0 cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user (e.g., `keyspeed_user`) and password.
3. Under **Network Access**, whitelist `0.0.0.0/0` (allow connections from anywhere).
4. Copy the connection string:
   `mongodb+srv://keyspeed_user:<password>@cluster0.mongodb.net/keyspeed?retryWrites=true&w=majority`

---

### 2. Backend: Render (or Railway / Fly.io)
1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your Git repository.
3. Configure settings:
   - **Root Directory**: `typearena-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
4. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://keyspeed_user:<password>@cluster0.mongodb.net/keyspeed?retryWrites=true&w=majority
   JWT_SECRET=your-random-64-character-jwt-secret-key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-frontend.vercel.app
   ADMIN_EMAIL=admin@keyspeed.com
   ADMIN_PASSWORD=AdminPass123!
   ```
5. Deploy service and copy your Render URL (e.g., `https://keyspeed-api.onrender.com`).
6. **Seed Admin**: In the Render dashboard, open the **Shell** tab and run:
   ```bash
   npm run seed:admin:prod
   ```

---

### 3. Frontend: Vercel (or Netlify / Cloudflare Pages)
1. Go to [vercel.com](https://vercel.com) and import your Git repository.
2. Configure project:
   - **Root Directory**: `typearena-frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variables**:
   ```env
   VITE_API_URL=https://keyspeed-api.onrender.com/api
   VITE_SOCKET_URL=https://keyspeed-api.onrender.com
   ```
4. Click **Deploy**.
5. Once deployed, copy your Vercel URL and update the `FRONTEND_URL` environment variable in your Backend Render dashboard so CORS and cookies match.

*(Note: [`vercel.json`](file:///media/Data/My%20Projects/typing arena/typearena-frontend/vercel.json) and [`_redirects`](file:///media/Data/My%20Projects/typing arena/typearena-frontend/public/_redirects) are already pre-configured in the repository for client-side SPA routing).*

---

## 🖥️ Option 3: Traditional Linux VPS (PM2 + Nginx)

For developers deploying directly onto an Ubuntu/Debian server without Docker.

### 1. Install Node.js 24 & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### 2. Setup Backend with PM2
```bash
cd /var/www/keyspeed/typearena-backend
npm ci
npm run build

# Start process with PM2
pm2 start dist/main.js --name "keyspeed-backend"
pm2 save
pm2 startup
```

### 3. Build Frontend
```bash
cd /var/www/keyspeed/typearena-frontend
npm ci
npm run build
# Outputs to /var/www/keyspeed/typearena-frontend/dist
```

### 4. Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/keyspeed`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend SPA files
    root /var/www/keyspeed/typearena-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend WebSockets (Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/keyspeed /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## 🔒 Production Security Checklist

- [x] **Rate Limiting**: Configured via `@nestjs/throttler` (max 5 login attempts / min).
- [x] **Security Headers**: Enabled via `helmet` (HSTS, X-Frame-Options, no-sniff, hidden X-Powered-By).
- [x] **NoSQL Injection**: Protected with sanitization middleware.
- [x] **Data Serialization**: `passwordHash` and `tokenVersion` masked in JSON responses.
- [x] **Cookie Security**: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production.
- [x] **Anti-Cheat Heuristics**: Dynamic server verification (>250 WPM, >15 char leaps).
- [x] **Audit Trail**: Every administrative action saved to immutable `AuditLog` collection.
- [x] **Admin Seeding**: Run `npm run seed:admin:prod` after initial database boot.


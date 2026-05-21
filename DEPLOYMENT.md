# دليل النشر - AI Ads Marketing (Node.js)

## 🚀 خطوات النشر السريع

### 1. إعداد المشروع

```bash
# Clone or create project
git init
git add .
git commit -m "Initial commit"
```

### 2. نشر على Render.com (موصى به)

1. أنشئ حساباً على [Render](https://render.com)
2. اذهب إلى **Dashboard > New > Web Service**
3. اربط بمستودع GitHub
4. املأ الإعدادات:
   - **Name**: ai-ads-saas
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. أضف Environment Variables من ملف `.env`
6. اضغط **Create Web Service**

### 3. نشر على Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Add environment variables
railway variables set SUPABASE_URL="..."
railway variables set SUPABASE_ANON_KEY="..."
# ... etc
```

### 4. نشر على DigitalOcean App Platform

1. أنشئ حساباً على [DigitalOcean](https://digitalocean.com)
2. اذهب إلى **Apps > Create App**
3. اختر GitHub واختر المستودع
4. اضبط:
   - **Type**: Web Service
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
5. أضف Environment Variables
6. اختر الخطة (Basic $5/month كافية للبدء)
7. اضغط **Launch**

### 5. نشر على VPS (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm i -g pm2

# Clone project
git clone https://github.com/yourusername/ai-ads-nodejs.git
cd ai-ads-nodejs

# Install dependencies
npm install --production

# Create .env file
nano .env

# Start with PM2
pm2 start server.js --name "ai-ads"
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/ai-ads
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ai-ads /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 إعدادات ما بعد النشر

### 1. تحديث Google OAuth

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. عدل **Authorized JavaScript Origins**:
   - أضف: `https://your-domain.com`
3. عدل **Authorized Redirect URIs**:
   - أضف: `https://your-project.supabase.co/auth/v1/callback`

### 2. تحديث Supabase

1. اذهب إلى **Authentication > URL Configuration**
2. Site URL: `https://your-domain.com`
3. Redirect URLs: أضف `https://your-domain.com/auth/callback`

### 3. تحديث Chargily

1. اذهب إلى [Chargily Dashboard](https://chargily.com)
2. أضف Webhook URL:
   `https://your-domain.com/webhook/chargily`
3. أضف Success URL:
   `https://your-domain.com/payment/success`
4. أضف Failure URL:
   `https://your-domain.com/payment/failure`

### 4. تحديث `.env`

```env
NODE_ENV=production
APP_URL=https://your-domain.com
CHARGILY_MODE=live
```

---

## 📊 مراقبة الأداء

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
pm2 status
```

### Logs
```bash
# View logs
tail -f ~/.pm2/logs/ai-ads-out.log
tail -f ~/.pm2/logs/ai-ads-error.log
```

---

## 🔄 التحديثات

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart PM2
pm2 restart ai-ads

# Or zero-downtime restart
pm2 reload ai-ads
```

---

## 🛡️ الأمان الإضافي

### 1. Firewall
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Rate Limiting (إضافة إلى server.js)
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Security Headers
Helmet.js مدمج بالفعل في المشروع.

---

## 💰 تحسين التكلفة

### Render (Free Tier)
- Web Service: مجاني (ينام بعد 15 دقيقة)
- PostgreSQL: مجاني (Supabase)

### Railway
- $5/month للخادم
- Supabase مجاني حتى 500MB

### DigitalOcean
- $5/month للـ Droplet
- $6/month للـ App Platform

### VPS (Recommended for production)
- $5-10/month DigitalOcean/Linode
- Node.js + Nginx + PM2
- Full control

---

**تم التحديث: مايو 2026**

# Deployment Guide

This guide explains how to deploy the LCCAV video calling application.

## Architecture

- **Frontend**: React app deployed to GitHub Pages
- **Backend**: Node.js signaling server (needs separate hosting)

## Frontend Deployment (GitHub Pages)

The frontend is automatically deployed to GitHub Pages via GitHub Actions when you push to the `main` branch.

### Manual Setup

1. **Configure GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

2. **Set Environment Variable** (Optional):
   - Go to repository Settings > Secrets and variables > Actions
   - Add a secret named `REACT_APP_SERVER_URL` with your backend server URL
   - If not set, it will default to `http://localhost:5000` (for development)

3. **Build and Deploy**:
   ```bash
   cd client
   npm install
   npm run build
   ```
   
   The build output is in `client/build/`

## Backend Deployment

The backend signaling server needs to be deployed separately. 

### Current Setup: Render.com (Recommended for Now)

**We're using Render.com initially. Later we'll migrate to AWS EC2.**

#### Deploy to Render.com

1. Go to https://render.com
2. Create a new account (free tier available)
3. Click "New +" > "Web Service"
4. Connect your GitHub repository: `khanapcalculus/lccav`
5. Configure:
   - **Name**: `lccav-signaling-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Root Directory**: `/` (root of repo)
   - **Plan**: Free (or Starter for better performance)
6. Add Environment Variables:
   - `CLIENT_URL`: `https://khanapcalculus.github.io/lccav`
   - `PORT`: `10000` (Render auto-assigns, but set this)
   - `NODE_ENV`: `production`
7. Click **Create Web Service**
8. Wait for deployment (2-3 minutes)
9. Copy your service URL (e.g., `https://lccav-signaling-server.onrender.com`)

**Note**: Render free tier services spin down after 15 minutes of inactivity. Consider upgrading to Starter plan ($7/month) for always-on service.

### Future Migration: AWS EC2

When you're ready to migrate to your dedicated AWS server, see the [AWS Migration Guide](#aws-migration-guide) below.

---

### Alternative Options (If Needed)

### Option 2: Railway

1. Go to https://railway.app
2. Create a new project
3. Deploy from GitHub
4. Set environment variables:
   - `CLIENT_URL`: Your GitHub Pages URL
   - `PORT`: Railway will auto-assign

### Option 3: Fly.io

1. Install Fly CLI: `npm install -g flyctl`
2. Run `fly launch` in the project root
3. Follow the prompts
4. Set environment variables in Fly dashboard

### Option 4: Heroku

1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Deploy: `git push heroku main`
4. Set config vars in Heroku dashboard

## Update Frontend with Backend URL

After deploying the backend, update the frontend:

1. Go to your repository Settings > Secrets and variables > Actions
2. Add/update `REACT_APP_SERVER_URL` with your deployed backend URL
3. Push a new commit to trigger redeployment

Or manually update `client/.env` and rebuild:
```bash
cd client
echo "REACT_APP_SERVER_URL=https://your-backend-url.com" > .env
npm run build
```

## Testing Deployment

1. Visit your GitHub Pages URL: `https://khanapcalculus.github.io/lccav`
2. Create a room and test video calling
3. Open in multiple tabs/browsers to test multi-user functionality

## Integration with Tutoring App

To integrate this with your tutoring application:

1. **Embed as iframe**:
   ```html
   <iframe 
     src="https://khanapcalculus.github.io/lccav?room=ROOM_ID&name=USER_NAME"
     width="100%" 
     height="600px"
     allow="camera; microphone; display-capture"
   ></iframe>
   ```

2. **Or import components**:
   - Copy the React components from `client/src/components/`
   - Import `VideoCall` component in your tutoring app
   - Pass room ID and user name as props

3. **API Integration**:
   - The backend exposes a REST API at `/health` for health checks
   - Socket.io events are documented in `server/index.js`

## Troubleshooting

### CORS Issues
- Ensure `CLIENT_URL` environment variable in backend matches your GitHub Pages URL
- Check that CORS is properly configured in `server/index.js`

### WebRTC Connection Issues
- Ensure HTTPS is used (required for WebRTC in production)
- Check browser console for errors
- Verify STUN servers are accessible

### Build Failures
- Check GitHub Actions logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

---

## AWS Migration Guide

When you're ready to migrate from Render.com to your dedicated AWS EC2 server:

### Prerequisites
- AWS EC2 instance running (Ubuntu recommended)
- SSH access to your server
- Domain name (optional, but recommended)
- SSL certificate (Let's Encrypt recommended)

### Step 1: Prepare Your EC2 Instance

1. **Connect to your server:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Node.js (if not already installed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone your repository:**
   ```bash
   git clone https://github.com/khanapcalculus/lccav.git
   cd lccav
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file:
```bash
nano .env
```

Add:
```
CLIENT_URL=https://khanapcalculus.github.io/lccav
PORT=5000
NODE_ENV=production
HOST=0.0.0.0
```

### Step 4: Set Up SSL (HTTPS Required for WebRTC)

Using Let's Encrypt with Certbot:

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# If using Nginx
sudo certbot --nginx -d your-domain.com
```

Or if using a different web server, follow Certbot's instructions.

### Step 5: Configure Nginx (Reverse Proxy)

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/lccav
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
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

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/lccav /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Start the Server with PM2

```bash
cd /path/to/lccav
pm2 start server/index.js --name lccav-server
pm2 save
pm2 startup
```

### Step 7: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 8: Update Frontend

1. Go to GitHub repository Settings > Secrets and variables > Actions
2. Update `REACT_APP_SERVER_URL` to your AWS server URL:
   - `https://your-domain.com` (if using domain)
   - Or `https://your-ec2-ip` (if using IP with SSL)
3. Push a commit to trigger redeployment

### Step 9: Test Migration

1. Visit your GitHub Pages frontend
2. Create a room and test video calling
3. Verify connections work through your AWS server
4. Monitor server logs: `pm2 logs lccav-server`

### Step 10: Shut Down Render Service

Once everything is working on AWS:
1. Go to Render dashboard
2. Stop or delete the old service
3. Update any documentation with new server URL

### AWS-Specific Optimizations

**For better performance on AWS:**

1. **Use PM2 Cluster Mode:**
   ```bash
   pm2 start server/index.js -i max --name lccav-server
   ```

2. **Set up auto-restart on reboot:**
   ```bash
   pm2 startup
   pm2 save
   ```

3. **Monitor resources:**
   ```bash
   pm2 monit
   ```

4. **Set up CloudWatch monitoring** (optional):
   - Install CloudWatch agent
   - Monitor CPU, memory, network

### Troubleshooting AWS Deployment

**Server not accessible?**
- Check security groups allow ports 80, 443, 5000
- Verify firewall rules
- Check Nginx is running: `sudo systemctl status nginx`

**WebRTC not working?**
- Ensure HTTPS is configured (required for WebRTC)
- Check SSL certificate is valid
- Verify CORS settings in `server/index.js`

**High CPU/Memory usage?**
- Monitor with `pm2 monit`
- Consider upgrading EC2 instance type
- Use PM2 cluster mode for load balancing

### Cost Optimization

- Use EC2 t3.micro or t3.small for small scale
- Set up auto-scaling if needed
- Use CloudFront for CDN (optional)
- Monitor usage with AWS Cost Explorer


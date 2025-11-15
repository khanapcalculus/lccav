# AWS EC2 Migration Guide

This guide will help you migrate the LCCAV signaling server from Render.com to your dedicated AWS EC2 instance.

## Prerequisites

- AWS EC2 instance running (Ubuntu 20.04 or 22.04 recommended)
- SSH access to your server
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

## Step-by-Step Migration

### Step 1: Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

### Step 2: Install Required Software

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt-get install -y nginx

# Install Git (if not already installed)
sudo apt-get install -y git
```

### Step 3: Clone Repository

```bash
cd ~
git clone https://github.com/khanapcalculus/lccav.git
cd lccav
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Create Environment File

```bash
nano .env
```

Add the following (adjust as needed):
```env
CLIENT_URL=https://khanapcalculus.github.io/lccav
PORT=5000
NODE_ENV=production
HOST=0.0.0.0
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 6: Set Up SSL Certificate (HTTPS Required)

WebRTC requires HTTPS. We'll use Let's Encrypt (free):

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx
```

**If you have a domain name:**
```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**If using IP only (not recommended for production):**
You'll need to use a self-signed certificate or get a domain name. For testing:
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

### Step 7: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/lccav
```

Add the following (replace `your-domain.com` with your domain or IP):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration (Let's Encrypt will update this)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Or for self-signed:
    # ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    # ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Node.js server
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
        
        # WebSocket support (required for Socket.io)
        proxy_set_header Connection "upgrade";
    }

    # Increase timeouts for WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/lccav /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default if exists
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 8: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 9: Start the Server with PM2

```bash
cd ~/lccav
pm2 start server/index.js --name lccav-server
pm2 save
pm2 startup
```

Follow the command output from `pm2 startup` to enable auto-start on reboot.

### Step 10: Verify Server is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs lccav-server

# Monitor in real-time
pm2 monit
```

Test the server:
```bash
curl http://localhost:5000/health
```

### Step 11: Update Frontend Configuration

1. Go to your GitHub repository: https://github.com/khanapcalculus/lccav
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Update `REACT_APP_SERVER_URL` to your AWS server URL:
   - `https://your-domain.com` (if using domain)
   - Or `https://your-ec2-ip` (if using IP with SSL)
4. Push a commit to trigger redeployment:
   ```bash
   git commit --allow-empty -m "Update backend URL to AWS"
   git push
   ```

### Step 12: Test the Migration

1. Wait for GitHub Pages to redeploy (2-3 minutes)
2. Visit: https://khanapcalculus.github.io/lccav
3. Create a room and test video calling
4. Verify connections work through your AWS server
5. Check server logs: `pm2 logs lccav-server`

### Step 13: Shut Down Render Service

Once everything is confirmed working:

1. Go to Render dashboard
2. Stop or delete the old service
3. Update any documentation with new server URL

## Performance Optimization

### Use PM2 Cluster Mode (Multi-core)

```bash
pm2 delete lccav-server
pm2 start server/index.js -i max --name lccav-server
pm2 save
```

### Set Up Auto-Restart

```bash
pm2 startup
pm2 save
```

### Monitor Resources

```bash
# Real-time monitoring
pm2 monit

# View detailed info
pm2 show lccav-server

# View logs
pm2 logs lccav-server --lines 100
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **Set up fail2ban (optional but recommended):**
   ```bash
   sudo apt-get install -y fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Configure AWS Security Groups:**
   - Only allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Restrict SSH access to your IP if possible

4. **Use strong SSH keys:**
   - Don't share your private key
   - Consider using SSH key rotation

5. **Regular backups:**
   - Backup your `.env` file
   - Consider setting up automated backups

## Monitoring and Maintenance

### View Server Status

```bash
pm2 status
pm2 logs lccav-server
```

### Restart Server

```bash
pm2 restart lccav-server
```

### Update Application

```bash
cd ~/lccav
git pull
npm install
pm2 restart lccav-server
```

### Check Nginx Status

```bash
sudo systemctl status nginx
sudo nginx -t
```

## Troubleshooting

### Server Not Accessible

1. **Check PM2:**
   ```bash
   pm2 status
   pm2 logs lccav-server
   ```

2. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. **Check Firewall:**
   ```bash
   sudo ufw status
   ```

4. **Check AWS Security Groups:**
   - Ensure ports 80 and 443 are open
   - Check inbound rules

### WebRTC Not Working

1. **Verify HTTPS is working:**
   - Check SSL certificate is valid
   - Ensure all traffic is redirected to HTTPS

2. **Check CORS settings:**
   - Verify `CLIENT_URL` in `.env` matches your frontend URL

3. **Check browser console:**
   - Look for WebRTC errors
   - Verify STUN servers are accessible

### High Resource Usage

1. **Monitor resources:**
   ```bash
   pm2 monit
   htop
   ```

2. **Consider upgrading EC2 instance:**
   - t3.micro: Good for testing
   - t3.small: Better for production
   - t3.medium: For higher load

3. **Optimize PM2:**
   - Use cluster mode for multi-core utilization
   - Adjust instance count based on CPU cores

## Cost Optimization

- **EC2 Instance Types:**
  - t3.micro: ~$7-8/month (1 vCPU, 1GB RAM) - Good for testing
  - t3.small: ~$15/month (2 vCPU, 2GB RAM) - Recommended for production
  - t3.medium: ~$30/month (2 vCPU, 4GB RAM) - For higher load

- **Data Transfer:**
  - First 100GB/month free
  - Monitor usage in AWS Cost Explorer

- **Storage:**
  - 8GB EBS storage included (usually sufficient)

## Next Steps

1. Set up CloudWatch monitoring (optional)
2. Configure automated backups
3. Set up domain name (if not already done)
4. Consider using AWS Application Load Balancer for high availability
5. Set up auto-scaling if needed

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs lccav-server`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `sudo journalctl -u nginx`
4. Verify all environment variables are set correctly


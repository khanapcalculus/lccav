# Quick Start Guide

Get your video calling application up and running quickly!

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Start Development

```bash
npm run dev
```

This starts:
- Backend server: http://localhost:5000
- Frontend app: http://localhost:3000

### 3. Test Locally

1. Open http://localhost:3000 in your browser
2. Enter a room ID (or generate one)
3. Enter your name
4. Click "Join Room"
5. Open another tab/browser and join the same room
6. Test video/audio communication!

## 📦 Deploy to GitHub Pages

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit: Video calling app"
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to https://github.com/khanapcalculus/lccav/settings/pages
2. Under "Source", select **GitHub Actions**
3. Save

### Step 3: Deploy Backend to Render.com (Required!)

**We're using Render.com now. AWS migration will come later when you have your server details.**

GitHub Pages only serves static files, so you need a separate backend:

1. Go to https://render.com
2. Sign up/login (free tier available)
3. Click **New +** > **Web Service**
4. Connect GitHub repo: `khanapcalculus/lccav`
5. Settings:
   - Name: `lccav-signaling-server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Root Directory: `/`
   - Plan: Free (or Starter $7/month for always-on)
6. Environment Variables:
   - `CLIENT_URL` = `https://khanapcalculus.github.io/lccav`
   - `PORT` = `10000`
   - `NODE_ENV` = `production`
7. Click **Create Web Service**
8. Wait 2-3 minutes for deployment
9. Copy your service URL (e.g., `https://lccav-signaling-server.onrender.com`)

**Note**: Free tier may spin down after 15 min inactivity. Upgrade to Starter or migrate to AWS later for always-on service.

### Step 4: Connect Frontend to Backend

1. Copy your Render URL (e.g., `https://lccav-server.onrender.com`)
2. Go to https://github.com/khanapcalculus/lccav/settings/secrets/actions
3. Click **New repository secret**
4. Name: `REACT_APP_SERVER_URL`
5. Value: Your Render URL
6. Save

### Step 5: Trigger Deployment

Push any change to trigger GitHub Actions:

```bash
git commit --allow-empty -m "Trigger deployment"
git push
```

Wait 2-3 minutes, then visit: **https://khanapcalculus.github.io/lccav**

## 🎓 Integrate with Your Tutoring App

### Option 1: Iframe (Easiest)

```html
<iframe 
  src="https://khanapcalculus.github.io/lccav?room=SESSION_ID&name=USER_NAME"
  width="100%" 
  height="600px"
  allow="camera; microphone; display-capture"
></iframe>
```

### Option 2: Import Components

Copy `client/src/components/VideoCall.tsx` to your app and use it directly.

See `INTEGRATION.md` for detailed integration guide.

## ✅ Checklist

- [ ] Dependencies installed
- [ ] Local development working
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] Backend deployed (Render/Railway/etc.)
- [ ] Backend URL added to GitHub secrets
- [ ] Frontend deployed and accessible
- [ ] Tested video calling in production

## 🐛 Troubleshooting

**Can't connect to video call?**
- Check backend is running and accessible
- Verify `REACT_APP_SERVER_URL` is set correctly
- Check browser console for errors

**GitHub Pages not updating?**
- Check GitHub Actions tab for build status
- Ensure GitHub Pages source is set to "GitHub Actions"
- Wait 2-3 minutes after push

**WebRTC not working?**
- Ensure you're using HTTPS (required for WebRTC)
- Check camera/microphone permissions
- Try different browser

## 📚 Next Steps

- Read `DEPLOYMENT.md` for detailed deployment options
- Read `INTEGRATION.md` for tutoring app integration
- Customize UI in `client/src/components/`

## 🆘 Need Help?

- Check browser console for errors
- Verify all environment variables are set
- Ensure backend is accessible from frontend domain
- Test with multiple browsers/tabs


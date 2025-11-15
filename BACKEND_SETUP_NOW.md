# Backend Setup - Do It Now!

## Why You Need the Backend

Your frontend is deployed to GitHub Pages ✅, but **video calling won't work without the backend**.

The backend (signaling server) is essential for:
- ✅ WebRTC signaling (connecting users)
- ✅ Room management
- ✅ Chat messages
- ✅ User connections

**Without the backend, users can't connect to each other for video calls.**

## When to Set It Up

**Set it up NOW** - before testing the video calling feature.

## Quick Setup Steps (5 minutes)

### Step 1: Go to Render.com
1. Visit: https://render.com
2. Sign up or log in (free account works)

### Step 2: Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**

### Step 3: Connect GitHub Repository
1. Click **"Connect account"** or **"Connect GitHub"**
2. Authorize Render to access your GitHub
3. Select repository: **`khanapcalculus/lccav`**

### Step 4: Configure the Service
Fill in these settings:

- **Name**: `lccav-signaling-server`
- **Environment**: `Node`
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: Leave empty (or `/`)
- **Build Command**: `npm install`
- **Start Command**: `node server/index.js`
- **Plan**: 
  - **Free** (spins down after 15 min inactivity) - Good for testing
  - **Starter ($7/month)** - Always on, better for production

### Step 5: Add Environment Variables
Click **"Advanced"** or scroll to **"Environment Variables"**, add:

| Key | Value |
|-----|-------|
| `CLIENT_URL` | `https://khanapcalculus.github.io/lccav` |
| `PORT` | `10000` |
| `NODE_ENV` | `production` |

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Copy your service URL (e.g., `https://lccav-signaling-server.onrender.com`)

### Step 7: Connect Frontend to Backend
1. Go to: https://github.com/khanapcalculus/lccav/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `REACT_APP_SERVER_URL`
4. Value: Your Render URL (e.g., `https://lccav-signaling-server.onrender.com`)
5. Click **"Add secret"**

### Step 8: Redeploy Frontend
Push a small change to trigger redeployment:

```bash
git commit --allow-empty -m "Update backend URL"
git push
```

Or manually trigger in GitHub Actions.

## Testing

1. Wait for both deployments to complete:
   - Backend on Render (2-3 min)
   - Frontend on GitHub Pages (2-3 min)

2. Visit: https://khanapcalculus.github.io/lccav

3. Test video calling:
   - Create a room
   - Open in two browser tabs
   - Join the same room
   - Video/audio should work!

## Important Notes

- **Free tier on Render**: Services spin down after 15 minutes of inactivity
  - First request after spin-down takes ~30 seconds to wake up
  - Consider Starter plan ($7/month) for always-on service

- **Backend URL**: Keep it secure - don't commit it to code
  - Use GitHub Secrets (we already set this up)

## Timeline

**Do this now:**
1. ✅ Frontend deployed (DONE)
2. ⏳ Backend deployment (DO THIS NOW - 5 minutes)
3. ⏳ Connect them together (2 minutes)
4. ⏳ Test video calling (1 minute)

**Total time: ~8 minutes to get everything working!**


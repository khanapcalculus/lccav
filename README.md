# LCCAV - Video Calling Application

A Google Meet-like video calling application designed for integration with tutoring applications and whiteboards.

## Features

- 🎥 Real-time video and audio communication
- 📺 Screen sharing
- 💬 Text chat
- 🔊 Mute/unmute controls
- 📹 Video on/off controls
- 👥 Multi-participant support
- 🎨 Modern, responsive UI

## Architecture

- **Frontend**: React + TypeScript (deployed to GitHub Pages)
- **Backend**: Node.js + Express + Socket.io (signaling server)

## Setup

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/khanapcalculus/lccav.git
cd lccav
```

2. Install dependencies:
```bash
npm run install-all
```

### Development

1. Start the development server:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:3000`

### Deployment

#### Frontend (GitHub Pages)

The frontend is automatically deployed to GitHub Pages via GitHub Actions when you push to the `main` branch.

**Manual Setup:**

1. Go to your repository: https://github.com/khanapcalculus/lccav
2. Navigate to **Settings** > **Pages**
3. Under "Source", select **GitHub Actions**
4. The workflow will automatically deploy on push to `main`

**Set Backend URL (Important):**

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Name: `REACT_APP_SERVER_URL`
4. Value: Your deployed backend URL (e.g., `https://your-backend.onrender.com`)
5. Click **Add secret**

**Manual Build (if needed):**
```bash
cd client
npm run build
```

The build output will be in `client/build/`

#### Backend (Separate Hosting Required)

The backend signaling server **must** be deployed separately since GitHub Pages only serves static files.

**Current Setup: Render.com**

We're using Render.com initially. Later we'll migrate to AWS EC2 when you have your dedicated server details.

1. Go to https://render.com and sign up
2. Click **New +** > **Web Service**
3. Connect your GitHub repository: `khanapcalculus/lccav`
4. Configure:
   - **Name**: `lccav-signaling-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Root Directory**: `/` (leave empty or use `/`)
5. Add Environment Variables:
   - `CLIENT_URL`: `https://khanapcalculus.github.io/lccav`
   - `PORT`: `10000` (Render auto-assigns, but set this)
   - `NODE_ENV`: `production`
6. Click **Create Web Service**
7. Copy the service URL (e.g., `https://lccav-signaling-server.onrender.com`)
8. Add this URL as `REACT_APP_SERVER_URL` secret in GitHub (see above)

**Future: AWS EC2 Migration**

When ready, we'll migrate to your dedicated AWS server. See `AWS_MIGRATION.md` for detailed step-by-step migration guide, or `DEPLOYMENT.md` for a quick overview.

**Note**: Render free tier services may spin down after inactivity. Consider Starter plan ($7/month) for always-on service, or migrate to AWS for better control.

## Integration with Tutoring App

This application is designed to be embedded in your tutoring application's whiteboard. The main component can be imported and integrated as needed.

## License

MIT

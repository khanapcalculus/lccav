# Fix: GitHub Pages Showing README Instead of React App

## Problem
GitHub Pages is showing the README.md file instead of your React application.

## Solution: Configure Pages to Use gh-pages Branch

The workflow I just pushed will deploy your React app to the `gh-pages` branch. Now you need to configure GitHub Pages to use that branch.

### Step 1: Go to Pages Settings
1. Go to: https://github.com/khanapcalculus/lccav/settings/pages
2. Under **"Source"**, you should see options

### Step 2: Set Source to gh-pages Branch
1. Change **Source** from "GitHub Actions" to **"Deploy from a branch"**
2. **Branch**: Select `gh-pages` (if it exists) or wait for workflow to create it
3. **Folder**: Select `/ (root)`
4. Click **"Save"**

### Step 3: Wait for Workflow to Complete
1. Go to Actions: https://github.com/khanapcalculus/lccav/actions
2. Wait for "Deploy to GitHub Pages" workflow to complete (2-3 minutes)
3. It will create the `gh-pages` branch with your React app

### Step 4: Verify
1. After workflow completes, go back to Pages settings
2. The `gh-pages` branch should now be available
3. Select it and save
4. Visit: https://khanapcalculus.github.io/lccav
5. You should see your React app (Join Room screen), not the README!

## Alternative: If gh-pages Branch Doesn't Appear

If the `gh-pages` branch doesn't show up:

1. **Check Actions tab** - make sure workflow completed successfully
2. **Wait a few minutes** - GitHub needs time to process
3. **Refresh the Pages settings page**
4. The branch should appear after the workflow completes

## What's Happening

- **Before**: Pages was serving from `main` branch root → shows README.md
- **After**: Pages will serve from `gh-pages` branch → shows React app

The workflow I just pushed will:
1. Build your React app
2. Deploy it to `gh-pages` branch
3. Then you configure Pages to use that branch

## Quick Check

After the workflow completes:
- Visit: https://github.com/khanapcalculus/lccav/branches
- You should see a `gh-pages` branch
- Then configure Pages to use it

Your React app should appear once Pages is configured to use the `gh-pages` branch!


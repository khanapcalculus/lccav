# Fix: GitHub Pages DNS Verification Issue

## Problem
GitHub Pages is trying to verify DNS for a custom domain, preventing you from saving.

## Solution: Remove Custom Domain

### Step 1: Clear the Custom Domain
1. In the GitHub Pages settings, find the **"Custom domain"** section
2. **Delete/clear** any text in the custom domain field
3. If there's a domain already saved, click **"Remove"** or the **X** button next to it
4. Make sure the field is completely empty

### Step 2: Wait for Verification to Cancel
- If it's currently verifying, wait for it to finish (or cancel if there's a cancel button)
- The verification will fail if the domain isn't configured, which is fine

### Step 3: Save Without Custom Domain
1. Ensure **Source** is set to **"GitHub Actions"**
2. Leave **Custom domain** completely blank
3. Click **"Save"** - it should work now

## Alternative: Use Branch Deployment (If Still Not Working)

If you still can't save with GitHub Actions:

1. **Change Source to "Deploy from a branch"**
2. **Branch**: Select `main` (or create `gh-pages` branch)
3. **Folder**: `/ (root)` or `/docs`
4. Click **Save** - this should work immediately
5. After it works, you can switch back to GitHub Actions later

## Manual Workaround: Deploy Without Pages Settings

Even if you can't save the Pages settings, the GitHub Actions workflow will still deploy:

1. **Check Actions tab**: https://github.com/khanapcalculus/lccav/actions
2. The workflow should run automatically
3. After it completes, manually enable Pages:
   - Go to Settings > Pages
   - The site should be available even without the settings saved

## Quick Fix Steps

1. **Remove any custom domain** from the field
2. **Wait for DNS verification to timeout/fail** (if it's running)
3. **Clear the field completely**
4. **Set Source to "GitHub Actions"**
5. **Click Save**

If that doesn't work, use the branch deployment method temporarily.


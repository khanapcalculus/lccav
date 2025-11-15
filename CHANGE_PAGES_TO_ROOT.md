# Change Pages to Use Root Instead of /docs

## New Approach

Since creating the docs folder isn't working, let's deploy to root and configure Pages to use root.

## Steps

### Step 1: Update Pages Settings
1. Go to: https://github.com/khanapcalculus/lccav/settings/pages
2. Change:
   - Source: "Deploy from a branch" 
   - Branch: `gh-pages`
   - Folder: **Change from `/docs` to `/ (root)`**
3. Click Save

### Step 2: Wait for Workflow
The workflow will now deploy directly to root of gh-pages branch.

### Step 3: Test
Visit: https://khanapcalculus.github.io/lccav

This should work because the React app will be at the root of gh-pages branch.


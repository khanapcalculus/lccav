# GitHub Pages Setup - Troubleshooting

## Issue: Save Button Not Enabling

If the "Save" button is disabled when the custom domain field is blank, try these solutions:

### Solution 1: Enter and Remove Domain
1. Type something temporary in the custom domain field (e.g., `temp`)
2. Click outside the field or press Tab
3. Delete the text to make it blank again
4. The Save button should now be enabled

### Solution 2: Check Other Settings
Make sure:
- **Source** is set to **"GitHub Actions"** (not "Deploy from a branch")
- No other required fields are missing
- You're on the correct repository settings page

### Solution 3: Use a Temporary Domain
1. Enter a placeholder: `lccav-video.yourdomain.com` (even if you don't own it)
2. Click Save
3. After saving, you can remove it later by going back to Settings > Pages

### Solution 4: Alternative - Deploy from Branch First
If GitHub Actions isn't working:
1. Temporarily set Source to **"Deploy from a branch"**
2. Select branch: `main` or `gh-pages`
3. Select folder: `/ (root)` or `/docs`
4. Click Save
5. Then switch back to "GitHub Actions" after the first deployment

### Solution 5: Check Browser/Refresh
- Try refreshing the page
- Try a different browser
- Clear browser cache
- Make sure JavaScript is enabled

## Recommended Approach

**Best option**: Use Solution 1 (enter and remove text) - this usually triggers the validation and enables the Save button.

## After Saving

Once you've saved:
1. Go to the **Actions** tab: https://github.com/khanapcalculus/lccav/actions
2. You should see the "Deploy to GitHub Pages" workflow running
3. Wait 2-3 minutes for it to complete
4. Your site will be live at: https://khanapcalculus.github.io/lccav

## If Nothing Works

If you still can't save:
1. You can manually trigger the workflow by making a small change and pushing
2. Or use the branch deployment method temporarily
3. The GitHub Actions workflow will still work even if Pages settings aren't perfect


# Fix: Save Button Not Enabling in Pages Settings

## Troubleshooting Steps

### Step 1: Clear Browser Cache
1. Try a **hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or try a **different browser** (Chrome, Firefox, Edge)
3. Or open in **Incognito/Private mode**

### Step 2: Check All Fields
Make sure:
- **Source** dropdown has a value selected
- **Branch** dropdown has `gh-pages` selected (if using "Deploy from a branch")
- **Folder** dropdown has `/ (root)` selected
- **Custom domain** field is completely empty (no spaces, no text)

### Step 3: Try Different Approach
Instead of "Deploy from a branch", try:
1. Set Source to **"GitHub Actions"** first
2. Save (if it lets you)
3. Then switch to "Deploy from a branch"

### Step 4: Remove Custom Domain First
1. If there's ANY text in custom domain field:
   - Delete it completely
   - Click outside the field
   - Wait a moment
   - Then try to change source and save

### Step 5: Alternative - Use GitHub CLI
If the UI won't work, we can configure it via command line.

## Alternative Solution: Verify gh-pages Has React App

Let's make sure the React app is actually in the gh-pages branch, then we can try a different approach.

## Most Common Issue

The save button often won't enable if:
- Custom domain field has text (even spaces)
- A dropdown doesn't have a value selected
- Browser JavaScript is blocked
- There's a validation error you can't see

Try clearing the custom domain field completely first, then selecting all dropdowns, then save.


# GitHub Pages Setup Guide

## Setting Up GitHub Pages

When configuring GitHub Pages, you may see an option for a custom domain. Here's what to do:

### Option 1: Skip Custom Domain (Recommended for Now)

1. **Leave the custom domain field empty**
2. **Click "Save"** or continue without setting a domain
3. Your site will be available at: `https://khanapcalculus.github.io/lccav`

This is the easiest option and works perfectly fine. You can always add a custom domain later if needed.

### Option 2: Set Custom Domain (Optional)

If you want to use your own domain (e.g., `video.yourdomain.com`):

1. **Enter your custom domain** in the field
2. **Click "Save"**
3. **Configure DNS records** in your domain registrar:
   - Add a CNAME record pointing to `khanapcalculus.github.io`
   - Or add A records pointing to GitHub's IP addresses:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
4. **Wait for DNS propagation** (can take up to 24 hours)
5. **Enable HTTPS** (GitHub will automatically provision SSL)

**Note**: Custom domain is completely optional. The default `*.github.io` URL works perfectly for your video calling application.

## After Saving

Once you've saved (with or without custom domain):

1. **Check GitHub Actions**: Go to https://github.com/khanapcalculus/lccav/actions
2. **Wait for deployment**: The workflow will build and deploy (takes 2-3 minutes)
3. **Visit your site**: https://khanapcalculus.github.io/lccav

## Troubleshooting

**If the site doesn't load:**
- Check GitHub Actions for build errors
- Ensure the workflow completed successfully
- Wait a few minutes for DNS propagation (if using custom domain)
- Check that GitHub Pages is enabled in Settings > Pages

**If you see a 404:**
- The build might still be in progress
- Check the Actions tab for status
- Ensure the workflow file is in `.github/workflows/deploy.yml`

## Next Steps

After GitHub Pages is set up:
1. Deploy backend to Render.com (see `QUICKSTART.md`)
2. Set `REACT_APP_SERVER_URL` secret in GitHub
3. Test your video calling application!


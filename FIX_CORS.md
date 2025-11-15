# Fix CORS Error

## Problem
The backend CORS configuration is too strict. It's checking for exact match of `https://khanapcalculus.github.io/lccav` but the actual origin is `https://khanapcalculus.github.io`.

## Solution
I've updated the backend to allow origins that match or start with the CLIENT_URL.

## Update Render.com Environment Variable

The CLIENT_URL should be set to the base domain without the path:

1. Go to your Render.com dashboard
2. Select your `lccav-signaling-server` service
3. Go to **Environment** tab
4. Update `CLIENT_URL` to: `https://khanapcalculus.github.io`
   - Remove `/lccav` from the end
5. Click **Save Changes**
6. The service will automatically redeploy

## Alternative: Keep Current CLIENT_URL

The code I just pushed will handle both:
- `https://khanapcalculus.github.io/lccav` (with path)
- `https://khanapcalculus.github.io` (without path)

So you can keep your current CLIENT_URL as is, and it should work after the backend redeploys.

## After Fix

1. Wait for Render to redeploy (2-3 minutes)
2. Hard refresh your browser: `Ctrl + Shift + R`
3. The CORS error should be gone
4. Video calling should work!


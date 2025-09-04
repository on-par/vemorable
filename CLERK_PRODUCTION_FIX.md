# Clerk Production Keys Configuration Fix

## Issue
The application is currently using Clerk **development keys** in production, which causes:
- Security vulnerabilities
- Strict usage limits 
- API authentication failures (401 errors)

## Current Situation
- GitHub Secrets are configured with Clerk keys
- Keys appear to be development keys (pk_test_/sk_test_) based on the console warnings
- Vercel deployment is pulling these keys from GitHub Secrets during build

## Solution Required

### Step 1: Get Production Keys from Clerk Dashboard
1. Log into [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your production instance (or create one if only development exists)
3. Navigate to **API Keys** section
4. Copy the production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (should start with `pk_live_`)
   - `CLERK_SECRET_KEY` (should start with `sk_live_`)

### Step 2: Update GitHub Secrets
Using GitHub CLI or GitHub web interface:

#### Option A: Using GitHub CLI
```bash
# Update the production keys
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --body "pk_live_YOUR_ACTUAL_KEY"
gh secret set CLERK_SECRET_KEY --body "sk_live_YOUR_ACTUAL_KEY"
```

#### Option B: Using GitHub Web Interface
1. Go to Repository Settings → Secrets and Variables → Actions
2. Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` with production key
3. Update `CLERK_SECRET_KEY` with production key

### Step 3: Update Vercel Environment Variables
Since Vercel is deploying from GitHub Actions, it should pull the updated secrets automatically on the next deployment. However, you may also want to set them directly in Vercel:

1. Log into [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables
4. Update both Clerk keys for Production environment

### Step 4: Trigger Redeployment
```bash
# Option 1: Push to main branch (triggers GitHub Actions)
git commit --allow-empty -m "fix: Update Clerk production keys"
git push origin main

# Option 2: Manual deployment from Vercel dashboard
# Go to Vercel Dashboard → Project → Deployments → Redeploy
```

## Verification
After deployment, verify the fix:
1. Check browser console - should NOT show "development keys" warning
2. API calls to `/api/notes` should return 200 instead of 401
3. Notes should load successfully on the dashboard

## Important Notes
- **Never commit actual keys to the repository**
- Keep development keys in `.env.local` for local development
- Production keys should only exist in GitHub Secrets and Vercel Environment Variables
- Consider setting up different Clerk instances for staging if needed

## Related Files to Update
After updating keys, also fix the deprecated props:
- Replace `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` with modern equivalents
- Update components using `afterSignInUrl` prop to use `fallbackRedirectUrl`
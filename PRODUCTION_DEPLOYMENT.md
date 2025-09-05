# VemoRable Production Deployment Guide

## Critical Issues Fixed

### 1. Authentication System Migration
- **Issue**: API was using Supabase auth while frontend used Clerk
- **Fix**: Updated `/src/lib/api/auth.ts` to use Clerk authentication
- **Impact**: Resolves 401 errors on all API endpoints

### 2. Clerk Configuration
- **Issue**: Development keys being used in production
- **Fix**: Need to add production Clerk keys to Vercel environment variables
- **Impact**: Removes development instance limitations and warnings

## Required Environment Variables

Add these to your Vercel project settings:

### Clerk (Production Keys)
```bash
# Get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[YOUR_PRODUCTION_KEY]
CLERK_SECRET_KEY=sk_live_[YOUR_PRODUCTION_SECRET]

# Optional but recommended
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Supabase
```bash
# Get these from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### OpenAI
```bash
OPENAI_API_KEY=sk-[YOUR_OPENAI_API_KEY]
```

### Application
```bash
NEXT_PUBLIC_APP_URL=https://vemorable.vercel.app
```

## Deployment Steps

1. **Set Environment Variables in Vercel**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add all variables listed above
   - Ensure they're set for "Production" environment

2. **Update Clerk Production Instance**
   - Go to https://dashboard.clerk.com
   - Create or select your production instance
   - Configure OAuth providers (Google, etc.)
   - Add your production domain to allowed origins
   - Copy production keys to Vercel

3. **Database Setup**
   - Ensure Supabase database is properly configured
   - Run any pending migrations
   - Verify RLS policies are in place

4. **Deploy**
   ```bash
   git push origin main
   ```

5. **Verify Deployment**
   - Check that Clerk authentication works
   - Test API endpoints (especially /api/notes)
   - Verify no console errors about development keys
   - Test voice recording and note creation

## Security Checklist

- [ ] Production Clerk keys are set (not development keys)
- [ ] Supabase RLS policies are enabled
- [ ] All sensitive keys are in environment variables (not in code)
- [ ] CORS settings are properly configured
- [ ] Rate limiting is enabled on API routes
- [ ] Error messages don't expose sensitive information

## Monitoring

### Key Metrics to Track
- Authentication success/failure rates
- API response times
- Error rates by endpoint
- User sign-up conversions

### Tools
- Vercel Analytics (already integrated)
- Clerk Dashboard for auth metrics
- Supabase Dashboard for database metrics

## Common Issues & Solutions

### Issue: "Clerk has been loaded with development keys"
**Solution**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` use production keys (starting with `pk_live_` and `sk_live_`)

### Issue: 401 Unauthorized on API endpoints
**Solution**: Verify that `/src/lib/api/auth.ts` is using Clerk auth and production keys are set

### Issue: "Failed to fetch notes"
**Solution**: Check that:
1. User is properly authenticated with Clerk
2. Database connection is working
3. Supabase RLS policies allow user access

## Support

For issues, check:
- Clerk Dashboard: https://dashboard.clerk.com
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Logs: https://vercel.com/[your-team]/vemorable/logs
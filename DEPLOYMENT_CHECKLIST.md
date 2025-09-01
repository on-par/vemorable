# VemoRable Production Deployment Checklist

Use this checklist to ensure all deployment steps are completed correctly.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code is committed to GitHub
- [ ] Main branch is up to date
- [ ] All tests are passing locally
- [ ] No console.log statements in production code
- [ ] Environment-specific code uses proper checks

### 2. Dependencies
- [ ] All dependencies are in package.json
- [ ] No missing dependencies
- [ ] Versions are locked in package-lock.json
- [ ] Security audit passed (`npm audit`)

### 3. Environment Variables
- [ ] `.env.example` is up to date with all required variables
- [ ] Production API keys are ready (not test keys)
- [ ] All NEXT_PUBLIC_ variables for client-side are prefixed correctly

## Vercel Setup Checklist

### 1. Initial Connection
- [ ] GitHub repository connected to Vercel
- [ ] Correct branch selected for production (main)
- [ ] Build settings verified in vercel.json

### 2. Environment Variables Configuration

#### Authentication (Clerk)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Production key from Clerk dashboard
- [ ] `CLERK_SECRET_KEY` - Production secret from Clerk dashboard  
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Set to `/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Set to `/sign-up`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - Set to `/dashboard`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - Set to `/dashboard`

#### Database (Supabase)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)
- [ ] `DATABASE_URL` - Full PostgreSQL connection string

#### AI Services (OpenAI)
- [ ] `OPENAI_API_KEY` - Production OpenAI API key with proper limits

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` - Set to production domain (e.g., https://vemorable.com)

### 3. Database Setup
- [ ] pgvector extension enabled in Supabase
- [ ] All migrations run successfully
- [ ] Database indexes created for performance
- [ ] Row Level Security (RLS) policies configured
- [ ] Storage bucket created for file uploads
- [ ] Storage policies configured

### 4. Domain Configuration
- [ ] Custom domain added in Vercel (if applicable)
- [ ] DNS records configured correctly:
  - [ ] A record pointing to Vercel
  - [ ] CNAME for www subdomain
- [ ] SSL certificate provisioned (automatic)
- [ ] Domain verified and active

### 5. Analytics & Monitoring
- [ ] Vercel Analytics enabled in dashboard
- [ ] @vercel/analytics package installed
- [ ] Analytics component added to layout
- [ ] Web Vitals monitoring active

## Deployment Verification Checklist

### 1. Initial Deployment
- [ ] Build completed successfully
- [ ] No build warnings that affect functionality
- [ ] Deployment URL is accessible
- [ ] Custom domain working (if configured)

### 2. Functionality Testing

#### Authentication
- [ ] Sign up with new account works
- [ ] Sign in with existing account works
- [ ] Sign out works correctly
- [ ] Protected routes redirect to sign-in
- [ ] User profile/avatar displays correctly

#### Core Features
- [ ] Voice recording works (microphone permission)
- [ ] Audio transcription processes successfully
- [ ] Notes are created and saved
- [ ] Notes list displays correctly
- [ ] Note editing works
- [ ] Note deletion works
- [ ] Search functionality returns results
- [ ] Tags are generated and displayed

#### AI Features
- [ ] Note processing (title, summary) works
- [ ] Chat interface loads
- [ ] Chat responses are generated
- [ ] Semantic search works
- [ ] Context retrieval in chat works

#### File Upload
- [ ] File upload interface works
- [ ] PDFs are processed correctly
- [ ] Images can be uploaded
- [ ] Files are stored in Supabase Storage
- [ ] File size limits are enforced

#### Data Management
- [ ] Export functionality works
- [ ] Downloaded export contains correct data
- [ ] Data is properly formatted

### 3. Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] No memory leaks detected
- [ ] API responses < 2 seconds (except AI processing)
- [ ] Images are optimized and loading

### 4. Security Verification
- [ ] HTTPS enforced on all pages
- [ ] Security headers present (check DevTools)
- [ ] API routes require authentication
- [ ] Rate limiting working
- [ ] No sensitive data in client-side code
- [ ] CORS configured correctly

### 5. Error Handling
- [ ] 404 page displays correctly
- [ ] API errors show user-friendly messages
- [ ] Network errors handled gracefully
- [ ] Form validation messages display
- [ ] Loading states show during operations

## Post-Deployment Checklist

### 1. Monitoring Setup
- [ ] Vercel deployment notifications configured
- [ ] Error tracking configured (if using Sentry)
- [ ] Performance baselines established
- [ ] Analytics data collecting

### 2. Documentation
- [ ] README updated with production URL
- [ ] DEPLOYMENT.md reviewed and current
- [ ] API documentation updated
- [ ] Known issues documented

### 3. Backup & Recovery
- [ ] Database backup strategy in place
- [ ] Rollback procedure documented
- [ ] Critical data export tested
- [ ] Disaster recovery plan created

### 4. Communication
- [ ] Team notified of deployment
- [ ] Changelog updated
- [ ] Users notified of new features (if applicable)
- [ ] Support documentation updated

## Rollback Procedure

If issues are discovered post-deployment:

1. **Immediate Rollback:**
   - Go to Vercel dashboard
   - Navigate to Deployments tab
   - Find previous working deployment
   - Click "..." menu → "Promote to Production"

2. **Fix Issues:**
   - Create hotfix branch from main
   - Fix identified issues
   - Test thoroughly locally
   - Create PR and review
   - Merge and deploy

3. **Post-Mortem:**
   - Document what went wrong
   - Update checklist if needed
   - Implement additional tests
   - Review deployment process

## Common Issues & Solutions

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies installed
- Review build logs for specific errors
- Ensure environment variables are set

### Runtime Errors
- Check browser console for client-side errors
- Review Vercel function logs
- Verify API endpoints are accessible
- Check environment variable values

### Performance Issues
- Review bundle size
- Check for unnecessary re-renders
- Optimize images and assets
- Review API query efficiency

### Database Issues
- Verify connection string
- Check Supabase service status
- Review query performance
- Ensure migrations completed

## Sign-off

- [ ] Deployment completed successfully
- [ ] All checklist items verified
- [ ] Production environment stable
- [ ] Team informed of completion

**Deployed by:** _________________  
**Date:** _________________  
**Version/Commit:** _________________  
**Notes:** _________________

---

Last Updated: 2025-09-01
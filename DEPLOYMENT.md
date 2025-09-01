# VemoRable Deployment Guide

This guide provides step-by-step instructions for deploying VemoRable to Vercel.

## Prerequisites

Before deploying, ensure you have:
1. A GitHub account with your code repository
2. A Vercel account (free tier is sufficient for getting started)
3. All required API keys and service accounts set up:
   - Clerk authentication
   - Supabase database
   - OpenAI API

## Step 1: Connect GitHub Repository to Vercel

1. **Log in to Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project" or "Import Project"

2. **Import GitHub Repository**
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub account if needed
   - Select the `vemorable` repository
   - Click "Import"

3. **Configure Project Settings**
   - Framework Preset: Next.js (should be auto-detected)
   - Root Directory: `.` (leave as default)
   - Build Command: `npm run build` (auto-detected from vercel.json)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

## Step 2: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Environment Variables

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page URL | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page URL | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post sign-in redirect | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post sign-up redirect | `/dashboard` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | Production app URL | `https://vemorable.com` |

### How to Add Environment Variables in Vercel:

1. Go to your project dashboard in Vercel
2. Click on "Settings" tab
3. Navigate to "Environment Variables" in the sidebar
4. For each variable:
   - Enter the key name (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - Enter the value
   - Select environments (Production, Preview, Development)
   - Click "Save"

### Environment-Specific Configuration:

- **Production**: Use production API keys from Clerk, Supabase, and OpenAI
- **Preview**: Can use the same as production or separate staging keys
- **Development**: Use test/development keys to avoid affecting production data

## Step 3: Set Up Production Domain

### Using a Custom Domain:

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Click on "Domains" tab
   - Add your custom domain (e.g., `vemorable.com`)

2. **Configure DNS:**
   - Add the DNS records provided by Vercel to your domain registrar:
     - A record: `76.76.21.21` (Vercel's IP)
     - CNAME record: `cname.vercel-dns.com` (for www subdomain)

3. **SSL Certificate:**
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - No additional configuration needed
   - HTTPS is enforced by default

### Using Vercel's Default Domain:

- Your app will be available at `[project-name].vercel.app`
- SSL is included automatically
- Good for testing before setting up custom domain

## Step 4: Add Vercel Analytics

### Install Vercel Analytics Package:

```bash
npm install @vercel/analytics
```

### Update Layout Component:

Add the Analytics component to your root layout (`app/layout.tsx`):

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable in Vercel Dashboard:

1. Go to your project dashboard
2. Click on "Analytics" tab
3. Enable Web Analytics
4. Choose your pricing plan (free tier available)

## Step 5: Deploy and Test

### Initial Deployment:

1. **Trigger Deployment:**
   - Push to your main branch, or
   - Click "Redeploy" in Vercel dashboard

2. **Monitor Build:**
   - Watch the build logs in real-time
   - Check for any errors or warnings
   - Build typically takes 2-5 minutes

3. **Verify Deployment:**
   - Visit your production URL
   - Test all critical features:
     - [ ] User authentication (sign up/sign in)
     - [ ] Voice recording and transcription
     - [ ] Note creation and management
     - [ ] Chat functionality
     - [ ] Search capabilities
     - [ ] File upload

### Production Checklist:

Before considering your deployment production-ready:

- [ ] All environment variables are set correctly
- [ ] Database migrations have been run
- [ ] Supabase Storage bucket is configured
- [ ] API rate limits are configured
- [ ] Error tracking is set up (optional: Sentry)
- [ ] Analytics is working
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] All features tested in production environment

## Deployment Commands

### Using Vercel CLI (Optional):

Install Vercel CLI:
```bash
npm i -g vercel
```

Deploy from command line:
```bash
vercel --prod
```

Preview deployment:
```bash
vercel
```

## Troubleshooting

### Common Issues and Solutions:

1. **Build Failures:**
   - Check build logs for specific errors
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Environment Variable Issues:**
   - Double-check all variables are set
   - Ensure no trailing spaces in values
   - Verify NEXT_PUBLIC_ prefix for client-side variables

3. **Database Connection Issues:**
   - Verify DATABASE_URL is correct
   - Check Supabase allows connections from Vercel IPs
   - Ensure pgvector extension is enabled

4. **API Timeout Issues:**
   - Check `vercel.json` for function timeout settings
   - Consider upgrading Vercel plan for longer timeouts
   - Optimize API endpoints for performance

## Continuous Deployment

### Automatic Deployments:

- Every push to `main` branch triggers production deployment
- Pull requests create preview deployments
- Branch deployments available for testing

### GitHub Integration Features:

- Deployment status checks on PRs
- Preview URLs in PR comments
- Automatic rollback on failed deployments

## Performance Monitoring

### Key Metrics to Monitor:

- **Core Web Vitals:** LCP, FID, CLS
- **API Response Times:** Track slow endpoints
- **Error Rates:** Monitor 4xx and 5xx responses
- **User Analytics:** Page views, user sessions

### Using Vercel Analytics:

- Real User Monitoring (RUM) data
- Performance insights dashboard
- Automatic alerting for degradation

## Security Considerations

### Production Security Checklist:

- [ ] All API keys are production keys
- [ ] Rate limiting is configured
- [ ] CORS settings are appropriate
- [ ] Security headers are set (via vercel.json)
- [ ] Input validation is enforced
- [ ] File upload restrictions are in place

## Scaling Considerations

### When to Upgrade:

- Consistent function timeout issues
- Need for longer audio processing
- Higher concurrent user load
- Custom infrastructure requirements

### Vercel Plan Options:

- **Hobby:** Free, good for testing
- **Pro:** $20/month, better limits
- **Enterprise:** Custom pricing, dedicated support

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)
- GitHub Issues for application-specific problems

---

Last Updated: 2025-09-01
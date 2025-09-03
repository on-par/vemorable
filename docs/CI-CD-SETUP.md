# CI/CD Setup Guide for VemoRable

## Overview
This document explains the GitHub Actions CI/CD pipeline setup for VemoRable, including automated testing, Supabase migration management, and Vercel deployment.

## Prerequisites

### Required GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Source | Description |
|------------|---------|-------------|
| `CLERK_SECRET_KEY` | `.env.local` | Clerk authentication secret |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.env.local` | Clerk public key |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Supabase service role key |
| `OPENAI_API_KEY` | `.env.local` | OpenAI API key |
| `DATABASE_URL` | `.env.local` | PostgreSQL connection string |
| `SUPABASE_PROJECT_ID` | Extract from Supabase URL | e.g., `scqplbwapvhvytraehec` |
| `SUPABASE_DB_PASSWORD` | Extract from DATABASE_URL | Database password |
| `SUPABASE_ACCESS_TOKEN` | [Create here](https://supabase.com/dashboard/account/tokens) | Personal access token |
| `VERCEL_TOKEN` | [Create here](https://vercel.com/account/tokens) | Vercel deployment token |
| `VERCEL_ORG_ID` | `.vercel/project.json` | After running `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` | After running `vercel link` |

## Pipeline Structure

### 1. PR Verification (`pr-verify.yml`)
Runs on: Pull requests to `main` branch

**Checks performed:**
- ✅ TypeScript type checking
- ✅ ESLint code quality
- ✅ Build verification
- ✅ Jest unit tests
- ✅ Migration file validation (syntax, naming, conflicts)
- ✅ Security audit
- ✅ Bundle size analysis

**Migration validation (NO execution):**
- SQL syntax validation
- File naming convention checks
- Sequence validation
- RLS policy warnings
- Destructive operation warnings

### 2. Main Branch Checks & Migrations (`main-branch.yml`)
Runs on: 
- Push to `main` branch (after merge)
- Manual workflow dispatch

**Stages:**
1. **Code Quality Verification**
   - TypeScript type checking
   - ESLint linting
   - Unit test execution
   - Build verification

2. **Database Migrations**
   - Links to Supabase project
   - Checks current migration status
   - Applies pending migrations
   - Verifies migration success
   - Can be skipped via workflow dispatch

3. **End-to-End Tests** (if configured)
   - Waits for Vercel deployment
   - Runs Playwright tests against production URL
   - Uploads test results

4. **Post-deployment Verification**
   - Health checks on deployed app
   - Critical route verification
   - API endpoint testing

**Note:** Vercel automatically deploys on push to main - no manual deployment needed!

## Migration Management

### Creating New Migrations

1. **File naming convention:**
   ```
   supabase/migrations/XXX_description.sql
   ```
   Example: `004_add_user_preferences.sql`

2. **Migration structure:**
   ```sql
   -- Migration: 004_add_user_preferences
   BEGIN;

   -- Your migration SQL here
   CREATE TABLE user_preferences (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT NOT NULL,
     -- ... columns
   );

   -- Always enable RLS for new tables
   ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

   -- Add RLS policies
   CREATE POLICY "Users can manage own preferences" 
     ON user_preferences
     FOR ALL 
     USING (auth.uid()::text = user_id);

   COMMIT;
   ```

3. **Testing migrations locally:**
   ```bash
   # Install Supabase CLI
   brew install supabase/tap/supabase

   # Start local Supabase
   supabase start

   # Apply migrations locally
   supabase db push

   # Reset local database
   supabase db reset
   ```

### Migration Safety Checklist

Before creating a PR with migrations:
- [ ] Migration is backwards compatible
- [ ] No data loss will occur
- [ ] Tested locally with `supabase db push`
- [ ] Includes rollback strategy (document in PR)
- [ ] RLS policies are included for new tables
- [ ] Follows naming convention

## Local Development Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Install Supabase CLI
brew install supabase/tap/supabase

# Install Vercel CLI
npm install -g vercel

# Link to Vercel project
vercel link

# Start local Supabase (optional)
supabase start
```

### Running CI Checks Locally
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm test

# Build
npm run build

# Validate migrations
./.github/scripts/validate-migrations.sh
```

## Deployment Process

### Automatic Deployment (Recommended)
1. Create feature branch
2. Make changes and test locally
3. Push branch and create PR
4. Wait for PR checks to pass
5. Merge to main → Auto-deploys

### Manual Deployment
```bash
# Via GitHub Actions
# Go to Actions → Deploy to Production → Run workflow

# Can skip migrations if needed
# Check "Skip database migrations" option
```

### Rollback Process
1. **For code changes:**
   - Revert the merge commit
   - Create new PR
   - Merge to trigger rollback deployment

2. **For migrations:**
   - Create a new migration to undo changes
   - Never modify existing migration files
   - Test rollback migration locally first

## Monitoring

### Check Deployment Status
- GitHub Actions: Check workflow runs
- Vercel Dashboard: Monitor deployments
- Supabase Dashboard: Check migration status

### Debugging Failed Deployments
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Check Supabase migration logs
4. Review Vercel build logs

## Security Notes

- Never commit `.env.local` or secrets to git
- Rotate tokens periodically
- Use separate Supabase projects for staging/production
- Enable branch protection rules on `main`

## Troubleshooting

### Common Issues

**Migration validation fails:**
- Check file naming (XXX_description.sql)
- Ensure sequential numbering
- Validate SQL syntax

**Vercel deployment fails:**
- Verify VERCEL_TOKEN is valid
- Check project is linked (`vercel link`)
- Ensure build succeeds locally

**Supabase migrations fail:**
- Check SUPABASE_ACCESS_TOKEN is valid
- Verify database password is correct
- Test migration locally first

## Support

For issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Check Vercel and Supabase dashboards
4. Contact the development team
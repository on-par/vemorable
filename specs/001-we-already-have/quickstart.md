# VeMorable Quickstart Guide

**Version**: 1.0.0  
**Target**: Production-ready deployment  
**Estimated Time**: 15 minutes  

## Prerequisites

- Node.js 18+ installed
- Git access to repository
- Supabase project with database access
- OpenAI API key with GPT-4 access
- Vercel account for deployment

## Quick Start Steps

### 1. Environment Setup (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd vemorable

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

Configure your `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. Database Setup (3 minutes)

```bash
# Run database migrations
npx supabase db reset

# Verify tables created
npx supabase db diff
```

Expected tables:
- `notes` - Core note storage with embeddings
- `tags` - Auto-generated tags
- `note_tags` - Many-to-many relationships
- `summaries` - AI-generated summaries
- `user_preferences` - User settings

### 3. Development Server (1 minute)

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

You should see the VeMorable login screen.

### 4. Smoke Test - User Journey (5 minutes)

#### Test 1: Account Creation & Authentication
1. Navigate to `http://localhost:3000`
2. Click "Sign Up" and create account with valid email
3. Verify email confirmation (check Supabase Auth logs)
4. Login successfully ✅

**Expected Result**: Dashboard loads with empty state

#### Test 2: Text Note Creation
1. Click "Create Note" button
2. Type: "This is a test note about project planning and deadlines"
3. Click "Save"
4. Wait 2-3 seconds for AI processing

**Expected Result**: 
- Note appears in dashboard ✅
- Status shows "Processing" then "Complete" ✅
- Auto-generated tags appear (e.g., "planning", "project") ✅

#### Test 3: Voice Note Creation
1. Click "Voice Note" button
2. Allow microphone permissions
3. Record 5-10 seconds: "This is a voice note about the meeting with Sarah"
4. Click "Stop Recording"
5. Wait for transcription and processing

**Expected Result**:
- Audio transcribed to text ✅
- Note processed with tags ✅
- Confidence score shown (>0.8 for clear audio) ✅

#### Test 4: Semantic Search
1. Click search bar
2. Type natural language query: "notes about projects"
3. Press Enter

**Expected Result**:
- Returns both test notes ✅
- Similarity scores shown ✅
- Relevant snippets highlighted ✅

#### Test 5: AI Summary Generation
1. Click "Generate Summary"
2. Type query: "summarize my project-related notes"
3. Wait for AI processing

**Expected Result**:
- Summary combining both notes ✅
- References source notes ✅
- Coherent synthesis of content ✅

### 5. Production Deployment (4 minutes)

#### Deploy to Vercel
```bash
# Connect to Vercel
npx vercel login
npx vercel --prod

# Configure environment variables in Vercel dashboard:
# - All .env.local variables
# - Update NEXT_PUBLIC_APP_URL to production domain
```

#### Supabase Production Setup
1. Create production Supabase project
2. Run migrations: `npx supabase db push`
3. Enable RLS policies: `npx supabase db reset --schema=public`
4. Update environment variables with production credentials

#### Verify Production Deployment
1. Visit deployed URL
2. Run same smoke tests as development
3. Check Vercel function logs for errors
4. Monitor Supabase dashboard for query performance

## Performance Validation

### Expected Performance Metrics
- **Page Load**: <2s for dashboard with 100+ notes
- **Voice Transcription**: <5s for 30-second audio clip
- **Search Response**: <300ms for semantic queries
- **AI Processing**: <10s for note analysis and tagging

### Load Testing (Optional)
```bash
# Install k6 for load testing
npm install -g k6

# Run basic load test
k6 run tests/load/basic-flow.js

# Expected results:
# - 50 VUs: avg response <500ms
# - Error rate: <1%
# - 95th percentile: <1s
```

## Troubleshooting

### Common Issues

**Issue**: Voice transcription fails
- **Cause**: OpenAI API rate limiting or invalid key
- **Solution**: Check API key permissions and usage limits
- **Debug**: Check browser console and `/api/transcribe` logs

**Issue**: Search returns no results
- **Cause**: Vector embeddings not generated
- **Solution**: Verify OpenAI embedding API is working
- **Debug**: Check `notes` table for non-null `embedding` column

**Issue**: Authentication redirects loop
- **Cause**: Supabase URL/key mismatch
- **Solution**: Verify environment variables match Supabase project
- **Debug**: Check browser network tab for 401/403 responses

**Issue**: Slow AI processing
- **Cause**: Cold start or API rate limits
- **Solution**: Consider upgrading OpenAI plan or implement queuing
- **Debug**: Monitor OpenAI dashboard for usage patterns

### Health Checks

```bash
# API Health Check
curl http://localhost:3000/api/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2025-09-09T10:00:00Z",
  "services": {
    "database": "connected",
    "openai": "available"
  }
}

# Database Connection Test
npx supabase db list

# AI Services Test
node scripts/test-openai.js
```

### Monitoring Setup

1. **Error Tracking**: Sentry integration
2. **Performance**: Vercel Analytics
3. **Database**: Supabase dashboard metrics
4. **AI Usage**: OpenAI dashboard monitoring

## Next Steps

After quickstart completion:
1. **Security Review**: Audit API endpoints and RLS policies
2. **Performance Optimization**: Implement caching strategies
3. **User Testing**: Gather feedback on transcription accuracy
4. **Scaling**: Configure database connection pooling
5. **Monitoring**: Set up alerts for critical metrics

## Success Criteria

✅ All smoke tests pass  
✅ Production deployment successful  
✅ Performance metrics within targets  
✅ Security policies enforced  
✅ Error handling graceful  
✅ User experience smooth and intuitive  

**Time to Value**: Users can create, search, and organize notes within 2 minutes of account creation.
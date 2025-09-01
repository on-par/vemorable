# Supabase Database Setup

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard
3. Get your project credentials (URL and anon key) from the project settings

## Setup Instructions

### 1. Update Environment Variables

Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```

### 2. Run Database Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

The migration will:
- Enable the pgvector extension for semantic search
- Create the `notes` table for storing voice notes
- Create the `chat_sessions` table for conversation sessions
- Create the `chat_messages` table for individual messages
- Set up proper indexes for query performance
- Configure Row Level Security (RLS) policies
- Create automatic timestamp update triggers

### 3. Verify Setup

After running the migration, you can test the connection by:

1. Running the development server: `npm run dev`
2. The Supabase client in `src/lib/supabase.ts` will automatically validate the connection
3. Check the browser console for connection status

## Database Schema

### Notes Table
- `id`: UUID primary key
- `user_id`: Clerk user ID (text)
- `title`: Note title
- `raw_transcript`: Original voice transcription
- `processed_content`: AI-enhanced content
- `summary`: AI-generated summary
- `tags`: Array of AI-generated tags
- `embedding`: Vector for semantic search (1536 dimensions)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Chat Sessions Table
- `id`: UUID primary key
- `user_id`: Clerk user ID (text)
- `title`: Session title (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Chat Messages Table
- `id`: UUID primary key
- `session_id`: Foreign key to chat_sessions
- `role`: Message role (user/assistant/system)
- `content`: Message content
- `created_at`: Timestamp

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only access their own data
- Proper authentication is required for all operations
- Data isolation between users is enforced at the database level

## Troubleshooting

If you encounter issues:

1. **Connection errors**: Verify your environment variables are correct
2. **Table not found**: Ensure the migration has been run successfully
3. **Permission denied**: Check that RLS policies are properly configured
4. **pgvector not found**: Make sure the pgvector extension is enabled

For more help, consult the [Supabase documentation](https://supabase.com/docs).
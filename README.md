# VemoRable

VemoRable is a voice-first AI-powered note-taking micro SaaS application that enables verbal processors to capture thoughts via voice, automatically organize them with AI, and interact with their knowledge base through natural conversation.

## Features

- 🎤 Voice recording and transcription using OpenAI Whisper
- 🤖 AI-powered note processing and enhancement
- 💬 Chat with your notes using natural language
- 🔍 Semantic search across all your notes
- 📁 Automatic organization with tags and summaries
- 🔐 Secure authentication with Clerk
- 📱 Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI/ML**: OpenAI (Whisper, GPT-3.5-turbo, Embeddings)
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Accounts for:
  - [Clerk](https://clerk.com) (authentication)
  - [Supabase](https://supabase.com) (database)
  - [OpenAI](https://platform.openai.com) (AI services)
  - [Vercel](https://vercel.com) (deployment, optional)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vemorable.git
cd vemorable
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Application URL (for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Getting Your API Keys:

**Clerk:**
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the Publishable Key and Secret Key from the dashboard

**Supabase:**
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the Project URL and anon/public key
5. Go to Settings → Database
6. Copy the connection string for DATABASE_URL

**OpenAI:**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys
3. Create a new secret key

### 4. Database Setup

1. **Enable pgvector extension in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the following command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Run database migrations:**
   - Copy the schema from `supabase/migrations/001_initial_schema.sql`
   - Execute it in the Supabase SQL Editor

3. **Generate Prisma client (if using Prisma):**
   ```bash
   npm run db:generate
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
vemorable/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions and configurations
│   ├── types/           # TypeScript type definitions
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
├── supabase/           # Database migrations
└── context/            # Project documentation and roadmap
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client

## Database Schema

The application uses three main tables:

- **notes**: Stores user notes with AI-generated metadata
- **chat_sessions**: Stores chat conversation sessions
- **chat_messages**: Stores individual chat messages

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Development Workflow

1. Check `context/roadmap.md` for the project roadmap and user stories
2. Follow the TDD approach for new features
3. Ensure all tests pass before committing
4. Use conventional commit messages (feat:, fix:, docs:, etc.)

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Contributing

Please read the development guidelines in `CLAUDE.md` for coding standards and best practices.

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the GitHub repository.
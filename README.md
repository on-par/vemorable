# Vemorable

A mobile brain dump app. Record voice memos, get one sharp insight back, and let everything auto-organize into a searchable archive you never manually maintain.

## Core Concept

**Input:** Voice recording triggered by a single tap. A rotating prompt greets the user to spark reflection.

**Processing:** Transcription → AI analysis in one of four "insight modes" → auto-tagging.

**Output:** One actionable insight ("The One Thing") + auto-generated tags + full transcript stored and embedded for semantic search.

**Retrieval:** Search bar with semantic search across all dumps. Browse by auto-generated tags. No manual organization ever.

## Tech Stack

| Layer         | Technology                                    |
| ------------- | --------------------------------------------- |
| Framework     | Expo (React Native) with Expo Router          |
| Audio         | expo-av                                       |
| Transcription | Whisper API (OpenAI)                          |
| AI Processing | Claude API (claude-sonnet-4-20250514)                       |
| Database      | Supabase (Postgres + pgvector for embeddings) |
| Embeddings    | OpenAI text-embedding-3-small                 |
| Auth          | Supabase Auth (magic link)                    |
| State         | Zustand                                       |
| Styling       | NativeWind (Tailwind for React Native)        |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenAI API key
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start the development server
npm start
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/20240101000000_init.sql`
3. Deploy the Edge Functions:

```bash
supabase functions deploy process-dump
supabase functions deploy search-dumps
```

4. Set the Edge Function secrets:

```bash
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set ANTHROPIC_API_KEY=your_key
```

## Project Structure

```
vemorable/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Main recording screen
│   ├── result.tsx          # Post-recording insight display
│   ├── archive.tsx         # Browse past dumps by tag
│   ├── search.tsx          # Semantic search interface
│   └── dump/[id].tsx       # Dump detail view
├── components/             # React Native components
│   ├── RecordButton.tsx
│   ├── Waveform.tsx
│   ├── PromptDisplay.tsx
│   ├── InsightCard.tsx
│   ├── TagCloud.tsx
│   ├── DumpListItem.tsx
│   ├── InsightModeSelector.tsx
│   └── ProcessingOverlay.tsx
├── lib/                    # Utility libraries
│   ├── audio.ts            # Recording utilities
│   ├── transcription.ts    # Transcription helpers
│   ├── ai.ts               # AI insight utilities
│   ├── embeddings.ts       # Embedding utilities
│   ├── supabase.ts         # Supabase client + queries
│   └── prompts.ts          # Rotating prompt bank
├── stores/                 # Zustand state management
│   └── dumpStore.ts
├── types/                  # TypeScript types
│   └── index.ts
├── constants/              # App constants
│   └── insightModes.ts
└── supabase/
    ├── functions/          # Edge Functions
    │   ├── process-dump/
    │   └── search-dumps/
    └── migrations/         # Database migrations
```

## Insight Modes

| Mode    | Description                   |
| ------- | ----------------------------- |
| Action  | Surface a concrete next step  |
| Tension | Name the unresolved conflict  |
| Clarity | Distill the core thought      |
| Pattern | Connect to recurring themes   |

## Features

- [x] Tap to record, tap to stop
- [x] Rotating prompt display on main screen
- [x] Audio transcription via Whisper
- [x] "The One Thing" insight generation (4 modes)
- [x] Auto-tagging (3-5 tags per dump)
- [x] Result screen showing insight + tags
- [x] Semantic search across all dumps
- [x] Tag-based archive browsing
- [x] Dark minimal UI

## Development

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test
```

## Environment Variables

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key          # For Edge Functions
ANTHROPIC_API_KEY=your_anthropic_key    # For Edge Functions
```

## License

MIT

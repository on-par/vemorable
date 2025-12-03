import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const INSIGHT_MODES = {
  action: 'Extract the single most important actionable next step from this brain dump. Be specific and concrete. One sentence only.',
  tension: "Identify the core unresolved tension or conflict in this brain dump. Name what's pulling in opposite directions. One sentence only.",
  clarity: 'Distill this brain dump into the single clearest statement of what the speaker is actually trying to say. Cut through the noise. One sentence only.',
  pattern: "Given the transcript and the user's previous dump summaries provided, identify how this connects to recurring themes or patterns in their thinking. One sentence only.",
} as const;

const TAG_PROMPT = `Analyze this brain dump transcript and generate 3-5 descriptive tags.

Rules:
- Tags should be lowercase, single words or short phrases (use hyphens for multi-word tags)
- Focus on themes, topics, emotions, and contexts
- Avoid generic tags like "thoughts" or "ideas"
- Be specific and meaningful

Return ONLY a JSON array of strings, nothing else. Example: ["project-x", "career", "decision-making"]`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDumpRequest {
  audio_base64: string;
  insight_mode: keyof typeof INSIGHT_MODES;
  prompt_shown: string;
}

async function transcribeAudio(audioBase64: string): Promise<{ text: string; duration: number }> {
  // Decode base64 to binary
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create form data for Whisper API
  const formData = new FormData();
  formData.append('file', new Blob([bytes], { type: 'audio/m4a' }), 'audio.m4a');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  const result = await response.json();
  return {
    text: result.text,
    duration: Math.round(result.duration || 0),
  };
}

async function generateInsight(
  transcript: string,
  mode: keyof typeof INSIGHT_MODES,
  previousSummaries?: string[]
): Promise<string> {
  let systemPrompt = INSIGHT_MODES[mode];

  if (mode === 'pattern' && previousSummaries && previousSummaries.length > 0) {
    systemPrompt += `\n\nPrevious dump summaries for context:\n${previousSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the brain dump transcript:\n\n${transcript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Insight generation failed: ${error}`);
  }

  const result = await response.json();
  return result.content[0].text.trim();
}

async function generateTags(transcript: string): Promise<string[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: TAG_PROMPT,
      messages: [
        {
          role: 'user',
          content: transcript,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tag generation failed: ${error}`);
  }

  const result = await response.json();
  const tagsText = result.content[0].text.trim();

  try {
    const tags = JSON.parse(tagsText);
    if (Array.isArray(tags) && tags.every((t: unknown) => typeof t === 'string')) {
      return tags.slice(0, 5);
    }
  } catch {
    // If parsing fails, try to extract tags from the response
    const matches = tagsText.match(/["']([^"']+)["']/g);
    if (matches) {
      return matches.map((m: string) => m.replace(/["']/g, '')).slice(0, 5);
    }
  }

  return ['uncategorized'];
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding generation failed: ${error}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's auth
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: ProcessDumpRequest = await req.json();
    const { audio_base64, insight_mode, prompt_shown } = body;

    if (!audio_base64 || !insight_mode) {
      throw new Error('Missing required fields: audio_base64, insight_mode');
    }

    // Step 1: Transcribe audio
    const { text: transcript, duration } = await transcribeAudio(audio_base64);

    // Step 2: Get previous summaries for pattern mode
    let previousSummaries: string[] = [];
    if (insight_mode === 'pattern') {
      const { data: prevDumps } = await supabase
        .from('dumps')
        .select('one_thing')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (prevDumps) {
        previousSummaries = prevDumps.map((d) => d.one_thing);
      }
    }

    // Step 3: Generate insight and tags in parallel
    const [insight, tags] = await Promise.all([
      generateInsight(transcript, insight_mode, previousSummaries),
      generateTags(transcript),
    ]);

    // Step 4: Generate embedding
    const embedding = await generateEmbedding(`${insight}\n\n${transcript}`);

    // Step 5: Store in database
    const { data: dump, error: insertError } = await supabase
      .from('dumps')
      .insert({
        user_id: user.id,
        transcript,
        one_thing: insight,
        insight_mode,
        tags,
        embedding,
        duration_seconds: duration,
        prompt_shown,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to save dump: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        id: dump.id,
        transcript,
        one_thing: insight,
        tags,
        duration_seconds: duration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing dump:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

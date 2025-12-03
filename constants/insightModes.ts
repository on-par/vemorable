import type { InsightMode, InsightModeConfig } from '@/types';

export const INSIGHT_MODES: Record<InsightMode, InsightModeConfig> = {
  action: {
    name: 'Action',
    description: 'Surface a concrete next step',
    prompt: 'Extract the single most important actionable next step from this brain dump. Be specific and concrete. One sentence only.',
  },
  tension: {
    name: 'Tension',
    description: 'Name the unresolved conflict',
    prompt: 'Identify the core unresolved tension or conflict in this brain dump. Name what\'s pulling in opposite directions. One sentence only.',
  },
  clarity: {
    name: 'Clarity',
    description: 'Distill the core thought',
    prompt: 'Distill this brain dump into the single clearest statement of what the speaker is actually trying to say. Cut through the noise. One sentence only.',
  },
  pattern: {
    name: 'Pattern',
    description: 'Connect to recurring themes',
    prompt: 'Given the transcript and the user\'s previous dump summaries provided, identify how this connects to recurring themes or patterns in their thinking. One sentence only.',
  },
} as const;

export const DEFAULT_INSIGHT_MODE: InsightMode = 'clarity';

/**
 * AI utilities for insight generation and tagging
 * Note: Actual AI processing happens in Edge Functions
 * This file contains client-side helpers and type definitions
 */

import { INSIGHT_MODES } from '@/constants/insightModes';
import type { InsightMode } from '@/types';

/**
 * Get the prompt for a specific insight mode
 */
export function getInsightPrompt(mode: InsightMode): string {
  return INSIGHT_MODES[mode].prompt;
}

/**
 * Get the display name for an insight mode
 */
export function getInsightModeName(mode: InsightMode): string {
  return INSIGHT_MODES[mode].name;
}

/**
 * Get the description for an insight mode
 */
export function getInsightModeDescription(mode: InsightMode): string {
  return INSIGHT_MODES[mode].description;
}

/**
 * All available insight modes
 */
export function getAllInsightModes(): InsightMode[] {
  return Object.keys(INSIGHT_MODES) as InsightMode[];
}

/**
 * System prompt for generating tags from a transcript
 */
export const TAG_GENERATION_PROMPT = `Analyze this brain dump transcript and generate 3-5 descriptive tags.

Rules:
- Tags should be lowercase, single words or short phrases
- Focus on themes, topics, emotions, and contexts
- Avoid generic tags like "thoughts" or "ideas"
- Be specific and meaningful
- Return as a JSON array of strings

Example output: ["project-x", "career", "decision-making", "uncertainty", "next-steps"]`;

/**
 * System prompt for generating the insight
 */
export function getInsightSystemPrompt(mode: InsightMode, previousSummaries?: string[]): string {
  const basePrompt = INSIGHT_MODES[mode].prompt;

  if (mode === 'pattern' && previousSummaries && previousSummaries.length > 0) {
    return `${basePrompt}

Previous dump summaries for context:
${previousSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  return basePrompt;
}

/**
 * Validate that a generated insight meets quality standards
 */
export function validateInsight(insight: string): boolean {
  // Must be a single sentence (roughly)
  const sentenceCount = (insight.match(/[.!?]+/g) || []).length;
  if (sentenceCount > 2) {
    return false;
  }

  // Must be at least 10 characters
  if (insight.length < 10) {
    return false;
  }

  // Must be less than 300 characters
  if (insight.length > 300) {
    return false;
  }

  return true;
}

/**
 * Validate generated tags
 */
export function validateTags(tags: string[]): boolean {
  // Must have between 3 and 5 tags
  if (tags.length < 3 || tags.length > 5) {
    return false;
  }

  // Each tag must be reasonable length
  for (const tag of tags) {
    if (tag.length < 2 || tag.length > 30) {
      return false;
    }
  }

  return true;
}

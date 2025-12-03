/**
 * Rotating prompts to spark reflection during voice recording
 */

export const PROMPTS = [
  // Clarity prompts
  "What's on your mind?",
  "What happened today?",
  "What are you processing?",

  // Tension prompts
  "What's stuck?",
  "What are you avoiding?",
  "What's unresolved?",

  // Spark prompts
  "What excited you recently?",
  "What's pulling your attention?",
  "What would you build if you had no fear?",

  // Reflection prompts
  "What did you learn today?",
  "What surprised you?",
  "What would you do differently?",

  // Future prompts
  "What's next?",
  "What are you looking forward to?",
  "What needs your attention?",
] as const;

/**
 * Get a random prompt from the bank
 */
export function getRandomPrompt(): string {
  const index = Math.floor(Math.random() * PROMPTS.length);
  return PROMPTS[index];
}

/**
 * Get a prompt based on time of day
 */
export function getTimeBasedPrompt(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    // Morning - future-focused
    const morningPrompts = [
      "What's on your mind?",
      "What's pulling your attention?",
      "What needs your attention?",
    ];
    return morningPrompts[Math.floor(Math.random() * morningPrompts.length)];
  } else if (hour < 18) {
    // Afternoon - action-focused
    const afternoonPrompts = [
      "What happened today?",
      "What are you processing?",
      "What's stuck?",
    ];
    return afternoonPrompts[Math.floor(Math.random() * afternoonPrompts.length)];
  } else {
    // Evening - reflection-focused
    const eveningPrompts = [
      "What did you learn today?",
      "What surprised you?",
      "What would you do differently?",
    ];
    return eveningPrompts[Math.floor(Math.random() * eveningPrompts.length)];
  }
}

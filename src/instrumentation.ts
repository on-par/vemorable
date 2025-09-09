/**
 * Next.js Instrumentation file with Sentry integration
 * 
 * This file is automatically loaded by Next.js when the app starts
 * and is the recommended place to initialize Sentry for server-side tracking.
 */

export async function register() {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    const { initSentryServer } = await import('./shared/lib/sentry');
    initSentryServer();
  }
}
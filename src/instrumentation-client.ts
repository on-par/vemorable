/**
 * Next.js Client-side instrumentation with Sentry integration
 * 
 * This file initializes Sentry for client-side error tracking
 * and is the recommended approach for Next.js 15+
 */

import { initSentryClient } from './shared/lib/sentry';

// Initialize Sentry for client-side error tracking
initSentryClient();
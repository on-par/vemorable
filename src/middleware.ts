import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/notes(.*)',
  '/api/transcribe(.*)',
  '/api/process-note(.*)',
  '/api/chat(.*)',
  '/api/search(.*)',
  '/api/export(.*)',
  '/api/upload(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Skip authentication ONLY in test environments (never in production)
  const isTestEnvironment = 
    process.env.NODE_ENV === 'test' || 
    process.env.PLAYWRIGHT_TEST === 'true'

  if (isTestEnvironment) {
    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
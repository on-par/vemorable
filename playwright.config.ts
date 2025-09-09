import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for VeMorable e2e tests
 * Comprehensive E2E testing configuration with multi-browser support
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Global timeout for all tests (30 minutes) */
  globalTimeout: 30 * 60 * 1000,
  
  /* Test timeout for individual tests (30 seconds) */
  timeout: 30 * 1000,
  
  /* Expect timeout for assertions (5 seconds) */
  expect: {
    timeout: 5 * 1000,
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only - more retries for stability */
  retries: process.env.CI ? 3 : 0,
  
  /* Configure parallel workers - optimize for CI vs local development */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter configuration */
  reporter: process.env.CI ? [
    ['line'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ] : [
    ['list'],
    ['html', { open: 'on-failure' }],
  ],
  
  /* Shared settings for all tests */
  use: {
    /* Base URL configuration for different environments */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Run tests in headless mode by default, allow override */
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    
    /* Browser context options */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Screenshot configuration */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Video recording configuration */
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },
    
    /* Trace configuration for debugging */
    trace: 'retain-on-failure',
    
    /* Context options for better test isolation */
    contextOptions: {
      /* Reduce flakiness by ignoring service worker updates */
      serviceWorkers: 'block',
      /* Clear permissions for each test */
      permissions: [],
    },
    
    /* Test environment variables */
    extraHTTPHeaders: {
      /* Mark requests as coming from E2E tests */
      'X-E2E-Test': 'true',
    },
  },
  
  /* Output directory for test artifacts */
  outputDir: 'test-results/',
  
  /* Configure projects for comprehensive browser testing */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Chrome-specific settings */
        launchOptions: {
          args: [
            /* Disable web security for testing */
            '--disable-web-security',
            /* Allow running with fake media devices */
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            /* Reduce noise in CI */
            '--no-sandbox',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        /* Firefox-specific settings */
        launchOptions: {
          firefoxUserPrefs: {
            /* Allow fake media devices for voice testing */
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
          },
        },
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        /* WebKit-specific settings */
      },
    },
    
    /* Mobile browser testing */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],
  
  /* Run local dev server before starting tests */
  webServer: {
    command: process.env.CI 
      ? 'npm run build && npm start' 
      : 'PLAYWRIGHT_TEST=true npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      /* Test environment variables */
      PLAYWRIGHT_TEST: 'true',
      NODE_ENV: process.env.CI ? 'production' : 'development',
      /* Database configuration for testing */
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '',
      /* Supabase test configuration */
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      /* Clerk test configuration */
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.TEST_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      CLERK_SECRET_KEY: process.env.TEST_CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY || '',
      /* OpenAI test configuration (use test key or mock) */
      OPENAI_API_KEY: process.env.TEST_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    },
  },
});
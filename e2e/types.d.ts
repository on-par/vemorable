/**
 * Type declarations for e2e testing environment
 */

declare global {
  interface Window {
    __PLAYWRIGHT_TEST__?: boolean;
    Clerk?: any;
    __clerk_loaded?: boolean;
    __clerk_frontend_loaded?: boolean;
    __CLERK_PUBLISHABLE_KEY?: string;
    __clerk_db_jwt?: string;
    __clerk_ssr_state?: any;
    __CLERK_MOCKS__?: any;
    __CLERK_NEXTJS_MOCK__?: any;
    __clerk_react_mocks?: boolean;
    __webpack_require__?: any;
    require?: any;
    define?: any;
  }
}

export {};
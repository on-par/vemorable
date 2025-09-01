// Mock for @clerk/nextjs/server in Jest tests
module.exports = {
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: jest.fn(() => Promise.resolve('test-token')),
  })),
  currentUser: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })),
}
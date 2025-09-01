// Test helper to mock Next.js server components
export const mockNextRequest = () => {
  // Mock the global Request if it doesn't exist (Node.js environment)
  if (typeof Request === 'undefined') {
    global.Request = class Request {
      constructor(public url: string, public init?: RequestInit) {}
    } as any
  }

  // Mock the global Response if it doesn't exist (Node.js environment)
  if (typeof Response === 'undefined') {
    global.Response = class Response {
      constructor(public body?: any, public init?: ResponseInit) {}
      json() {
        return Promise.resolve(this.body)
      }
    } as any
  }

  // Mock Headers if it doesn't exist
  if (typeof Headers === 'undefined') {
    global.Headers = class Headers {
      private headers: Record<string, string> = {}
      
      append(name: string, value: string) {
        this.headers[name] = value
      }
      
      get(name: string) {
        return this.headers[name]
      }
      
      set(name: string, value: string) {
        this.headers[name] = value
      }
      
      delete(name: string) {
        delete this.headers[name]
      }
      
      forEach(callback: (value: string, key: string) => void) {
        Object.entries(this.headers).forEach(([key, value]) => callback(value, key))
      }
    } as any
  }
}
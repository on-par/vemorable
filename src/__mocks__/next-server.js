// Mock for next/server in Jest tests
class NextRequest {
  constructor(url, init = {}) {
    this.url = typeof url === 'string' ? new URL(url) : url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers || {})
    this.body = init.body
    this.nextUrl = this.url
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }

  async formData() {
    return this.body
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers || {})
  }

  static json(data, init = {}) {
    const response = new NextResponse(JSON.stringify(data), init)
    response.headers.set('content-type', 'application/json')
    response._jsonData = data
    return response
  }

  async json() {
    if (this._jsonData) {
      return this._jsonData
    }
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }
}

module.exports = {
  NextRequest,
  NextResponse,
}
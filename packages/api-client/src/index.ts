export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  async getStatus() {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }
}

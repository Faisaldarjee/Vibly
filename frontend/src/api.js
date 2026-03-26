const API = process.env.REACT_APP_BACKEND_URL;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('vibly_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('vibly_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('vibly_token');
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 401) {
      this.clearToken();
      window.location.reload();
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  }

  get(path) { return this.request(path); }
  post(path, data) { return this.request(path, { method: 'POST', body: JSON.stringify(data) }); }
  put(path, data) { return this.request(path, { method: 'PUT', body: JSON.stringify(data) }); }
  del(path) { return this.request(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();

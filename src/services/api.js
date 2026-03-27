// API Service — Fetch wrapper for all backend calls
// In development, Vite proxies /api to wrangler dev (port 8788)
// In production on CF Pages, /api routes are handled by Pages Functions

const API_BASE = '/api';

async function request(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // send cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, config);

  if (res.status === 401) {
    // Let the caller handle 401 (AuthContext sets user=null, ProtectedRoute redirects)
    throw new Error('Unauthorized');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

// Auth
export const auth = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// Shopping List
export const list = {
  get: () => request('/list'),
  add: (productId, quantity = 1, note = '', name = '', category = '') =>
    request('/list', { method: 'POST', body: { productId, quantity, note, name, category } }),
  update: (id, data) =>
    request(`/list/${id}`, { method: 'PUT', body: data }),
  remove: (id) =>
    request(`/list/${id}`, { method: 'DELETE' }),
  completeAll: () =>
    request('/list/complete-all', { method: 'POST' }),
  clearCompleted: () =>
    request('/list/clear-completed', { method: 'POST' }),
  checkout: () =>
    request('/list/checkout', {
      method: 'POST',
      body: { tzOffset: new Date().getTimezoneOffset() }
    }),
};

// Products
export const products = {
  getAll: () => request('/products'),
  addCustom: (product) =>
    request('/products/custom', { method: 'POST', body: product }),
  deleteCustom: (id) =>
    request('/products/custom', { method: 'POST', body: { action: 'delete', id } }),
  editCustom: (id, name, emoji) =>
    request('/products/custom', { method: 'POST', body: { action: 'edit', id, name, emoji } }),
};

// History
export const history = {
  get: (page = 1) => request(`/history?page=${page}`),
  deleteItem: (id) => request(`/history/${id}`, { method: 'DELETE' }),
  deleteSession: (sessionId) => request('/history', { method: 'DELETE', body: { sessionId } }),
  deleteByDate: (date) => request('/history', { method: 'DELETE', body: { date } }),
  deleteAll: () => request('/history', { method: 'DELETE' }),
};

// Recommendations
export const recommend = {
  get: () => request('/recommend'),
};

// Frequencies
export const frequencies = {
  get: () => request('/frequencies'),
  update: (productId, freqDays) =>
    request('/frequencies', { method: 'POST', body: { productId, freqDays } }),
};

// Admin
export const admin = {
  getOverview: () => request('/admin?tab=overview'),
  getUsers: () => request('/admin?tab=users'),
  getProducts: () => request('/admin?tab=products'),
  deleteProduct: (id) => request('/admin', { method: 'POST', body: { action: 'delete_product', id } }),
  toggleAdmin: (userId) => request('/admin', { method: 'POST', body: { action: 'toggle_admin', userId } }),
  deleteUser: (userId) => request('/admin', { method: 'POST', body: { action: 'delete_user', userId } }),
};

export default { auth, list, products, history, recommend, frequencies, admin };

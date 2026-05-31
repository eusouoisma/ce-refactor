import { getToken } from './storage';
import { API_URL } from './env';

export function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

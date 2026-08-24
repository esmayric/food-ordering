export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiFetch = (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('token');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
};

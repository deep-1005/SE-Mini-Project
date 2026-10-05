// Axios client (SAD 3.4): the access token lives in memory only; on TOKEN_EXPIRED the request is
// retried once after a silent refresh using the HttpOnly refresh cookie.
import axios from 'axios';

let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1', withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.error?.code;
    if (code === 'TOKEN_EXPIRED' && !original._retried) {
      original._retried = true;
      refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null; });
      const { data } = await refreshing;
      setAccessToken(data.accessToken);
      return api(original);
    }
    return Promise.reject(error);
  },
);

// Standard error envelope -> { message, fields } for inline display (SRS 3.1).
export function readError(err) {
  const e = err.response?.data?.error;
  if (!e) return { message: 'Network error. Please try again.', fields: {} };
  const fields = Object.fromEntries((e.details || []).map((d) => [d.field, d.issue]));
  return { message: e.message, code: e.code, fields };
}

export const rupees = (paise) => (paise == null ? '-' : `₹${(paise / 100).toFixed(2)}`);
export default api;

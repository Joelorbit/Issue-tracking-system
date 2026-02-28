const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('astu_token');
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let message = 'Request failed';
      try {
        const data = await res.json();
        message = data.message || message;
      } catch {
        // If JSON parsing fails, use status text
        message = res.statusText || message;
      }
      
      // Handle authentication errors
      if (res.status === 401) {
        localStorage.removeItem('astu_token');
        localStorage.removeItem('astu_user');
        window.location.href = '/login';
      }
      
      throw new Error(message);
    }

    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }
    throw err;
  }
}

export default apiFetch;

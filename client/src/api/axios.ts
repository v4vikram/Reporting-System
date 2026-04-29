import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Check if the response matches our standard wrapper { success: true, data: ... }
    if (
      response.data && 
      typeof response.data === 'object' && 
      response.data.success === true && 
      'data' in response.data
    ) {
      const payload = response.data.data;
      
      // Optionally attach the top-level message to the payload for convenience
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        (payload as any)._message = response.data.message;
      }
      
      // Inject the unwrapped payload back into response.data
      response.data = payload;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

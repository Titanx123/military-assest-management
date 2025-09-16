import axios from 'axios';

const API_URL = 'https://military-assest-management-h3xx.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`[API] ${config.method.toUpperCase()} ${config.url} - Adding auth token`);
    console.log('[API] Token from localStorage:', token);
    
    if (token) {
      config.headers['x-auth-token'] = token;
      console.log('[API] Request headers with auth:', config.headers);
    } else {
      console.warn('[API] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[API] Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.config.method.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    const errorDetails = {
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      },
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      }
    };
    
    console.error('[API] Response Error:', JSON.stringify(errorDetails, null, 2));
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized - Token may be invalid or expired');
      // Optionally clear the invalid token
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  register: (userData) =>
    api.post('/auth/register', userData),
    
  registerAsAdmin: (userData, token) =>
    api.post('/auth/register', userData, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
  
  getUser: () => 
    api.get('/auth/user'),
    
  // Admin user management endpoints
  getUsers: () =>
    api.get('/auth/users'),
    
  deleteUser: (id) =>
    api.delete(`/auth/users/${id}`)
};

export const assetsAPI = {
  getAssets: () => 
    api.get('/assets'),
    
  getAsset: (id) => 
    api.get(`/assets/${id}`),
    
  createAsset: (assetData) => 
    api.post('/assets', assetData),
    
  updateAsset: (id, assetData) => 
    api.put(`/assets/${id}`, assetData),
    
  deleteAsset: (id) => 
    api.delete(`/assets/${id}`),
};

export const basesAPI = {
  getBases: () => 
    api.get('/bases'),
};

export default api;

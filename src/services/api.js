import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://192.168.1.42:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Goals API calls (to be implemented)
export const goalsAPI = {
  createGoal: (goalData) => api.post('/goals', goalData),
  getGoals: (filters = {}) => api.get('/goals', { params: filters }),
  getGoal: (id) => api.get(`/goals/${id}`),
  updateGoal: (id, updates) => api.put(`/goals/${id}`, updates),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  checkIn: (id) => api.post(`/goals/${id}/checkin`),
  getAnalytics: () => api.get('/goals/analytics'),
  getCategories: () => api.get('/goals/categories'),
};

// Progress API calls (to be implemented)
export const progressAPI = {
  getProgress: (goalId) => api.get(`/goals/${goalId}/progress`),
  logProgress: (goalId, data) => api.post(`/goals/${goalId}/progress`, data),
};

export default api; 
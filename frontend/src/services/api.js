import axios from 'axios';

// L'URL de base est définie par la variable d'environnement VITE_API_URL
// Si elle n'existe pas, on utilise localhost en développement
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour loguer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
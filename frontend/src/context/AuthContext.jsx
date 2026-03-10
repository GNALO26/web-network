// /frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si un token existe au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/auth/profile')
        .then(({ data }) => {
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
  };

  // Fonction d'inscription
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Valeurs exposées par le contexte
  const value = {
    user,
    setUser,      // utile pour mettre à jour l'avatar par exemple
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
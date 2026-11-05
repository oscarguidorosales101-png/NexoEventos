import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('nexoeventos_token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nexoeventos_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verificar sesión activa contra el backend al iniciar
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('nexoeventos_token');
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('nexoeventos_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Sesión no válida o expirada:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();

    // Escuchar eventos globales de 401 desencadenados por el cliente api.js
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (correo, password) => {
    const data = await authService.login(correo, password);
    setToken(data.token);
    setUser(data.usuario);
    localStorage.setItem('nexoeventos_token', data.token);
    localStorage.setItem('nexoeventos_user', JSON.stringify(data.usuario));
    return data.usuario;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexoeventos_token');
    localStorage.removeItem('nexoeventos_user');
  };

  const refreshUser = async () => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      localStorage.setItem('nexoeventos_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.error('Error al refrescar usuario:', err);
    }
  };

  const isAdmin = user?.rol?.toLowerCase() === 'administrador';
  const isSupervisor = user?.rol?.toLowerCase() === 'supervisor';
  const isClient = user?.rol?.toLowerCase() === 'cliente';
  const isAuthenticated = !!token && !!user;

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin,
    isSupervisor,
    isClient,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};


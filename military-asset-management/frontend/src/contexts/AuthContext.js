import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create a ref to hold the latest version of the functions
  const authRef = useRef({
    user: null,
    login: null,
    logout: null,
    validateToken: null,
    hasRole: null
  });

  // Update the ref whenever user changes
  useEffect(() => {
    authRef.current.user = user;
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const validateToken = useCallback(async (token) => {
    try {
      const response = await authAPI.getUser();
      setUser(response.data);
      localStorage.setItem('token', token);
      return true;
    } catch (err) {
      console.error('Token validation failed:', err);
      logout();
      return false;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = useCallback(async (username, password) => {
    try {
      setError('');
      console.log('Attempting login with:', { username });
      
      const response = await authAPI.login(username, password);
      console.log('Login response:', response.data);
      
      if (!response.data.token) {
        throw new Error('No token received in response');
      }
      
      const { token, user } = response.data;
      console.log('Storing token in localStorage:', token);
      localStorage.setItem('token', token);
      setUser(user);
      return { success: true };
    } catch (err) {
      console.error('Login error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    return Array.isArray(roles) ? roles.includes(user.role) : roles === user.role;
  }, [user]);

  // Initialize the ref with the latest functions
  useEffect(() => {
    authRef.current = {
      user,
      login,
      logout,
      validateToken,
      hasRole
    };
  }, [user, login, logout, validateToken, hasRole]);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await validateToken(token);
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [validateToken]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      hasRole,
      isAuthenticated: !!user
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

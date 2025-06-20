import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => {
          setAuth({
            token: token,
            user: res.data,
            isAuthenticated: true,
            loading: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setAuth({ token: null, user: null, isAuthenticated: false, loading: false });
        });
    } else {
      setAuth({ token: null, user: null, isAuthenticated: false, loading: false });
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    const { data: userData } = await api.get('/auth/me');
    setAuth({
      token: data.token,
      user: userData,
      isAuthenticated: true,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setAuth({ token: null, user: null, isAuthenticated: false, loading: false });
  };
  
  const updateUser = (updatedUserData) => {
      setAuth(prevAuth => ({
          ...prevAuth,
          user: {...prevAuth.user, ...updatedUserData}
      }));
  };

  const value = { auth, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {!auth.loading && children}
    </AuthContext.Provider>
  );
};

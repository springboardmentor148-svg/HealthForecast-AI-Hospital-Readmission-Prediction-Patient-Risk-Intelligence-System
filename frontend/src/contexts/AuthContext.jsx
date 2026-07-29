import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../config/rbac';
import {
  clearStoredToken,
  getStoredToken,
  normalizeAuthUser,
  setStoredToken,
} from '../utils/auth';
import { loginRequest, meRequest, registerRequest } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isActive) {
          clearStoredToken();
          setToken(null);
          setUser(null);
          setIsAuthReady(true);
        }
        return;
      }

      try {
        const response = await meRequest(storedToken);
        if (!isActive) return;

        setStoredToken(storedToken);
        setToken(storedToken);
        setUser(normalizeAuthUser(response.user));
      } catch {
        clearStoredToken();
        if (isActive) {
          setToken(null);
          setUser(null);
          setRedirectToLogin(true);
        }
      } finally {
        if (isActive) {
          setIsAuthReady(true);
        }
      }
    }

    restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (redirectToLogin) {
      setRedirectToLogin(false);
      navigate('/login', { replace: true });
    }
  }, [navigate, redirectToLogin]);

  const login = async (email, password) => {
    const response = await loginRequest(email, password);
    setStoredToken(response.access_token);
    setToken(response.access_token);
    setUser(normalizeAuthUser(response.user));
    return normalizeAuthUser(response.user);
  };

  const register = async (payload) => {
    return registerRequest(payload);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => {
    const currentRole = user?.role || ROLES.DOCTOR;
    return {
      user,
      token,
      currentRole,
      isAuthenticated: Boolean(token && user),
      isAuthReady,
      login,
      register,
      logout,
      setUser,
    };
  }, [isAuthReady, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

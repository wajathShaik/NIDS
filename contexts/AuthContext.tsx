
import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { logService, LogAction } from '../services/logService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect can be used to check for an existing session on app load
    // For now, we assume no session persistence and start fresh
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const loggedInUser = await authService.login(email, password);
      if (loggedInUser.status !== 'Active') {
        logService.addLog({ action: LogAction.LOGIN_FAILED, userEmail: email, details: `Login failed: User status is ${loggedInUser.status}` });
        let errMessage = 'Your account is not active.';
        if (loggedInUser.status === 'Disabled') {
          errMessage = 'Your account has been disabled by an administrator.';
        } else if (loggedInUser.status === 'Pending') {
            errMessage = 'Your account is pending administrator approval.';
        }
        throw new Error(errMessage);
      }
      setUser(loggedInUser);
      logService.addLog({ action: LogAction.LOGIN, userEmail: loggedInUser.email, userId: loggedInUser.id });
    } catch (error) {
      if (!String(error).includes('status')) {
         logService.addLog({ action: LogAction.LOGIN_FAILED, userEmail: email, details: `Login failed: Invalid credentials` });
      }
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    await authService.register(email, password);
    // After registration, user needs admin approval, so we don't log them in.
  };

  const logout = () => {
    if (user) {
        logService.addLog({ action: LogAction.LOGOUT, userEmail: user.email, userId: user.id });
    }
    authService.logout();
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    register,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

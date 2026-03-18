import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, AuthResponse, PasswordData } from '../services/authService';
import { User } from '../../user/types';

const STORAGE_KEY = 'petpal_user';
const REMEMBER_KEY = 'petpal_remember';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getStoredUser(): AuthResponse | null {
  const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
  const storage = remember ? localStorage : sessionStorage;
  const raw = storage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    if (user?.token && isTokenExpired(user.token)) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function persistUser(user: AuthResponse, remember: boolean) {
  const data = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, data);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(REMEMBER_KEY, 'false');
    sessionStorage.setItem(STORAGE_KEY, data);
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface AuthContextType {
  user: AuthResponse | null;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  updateProfile: (profileData: Partial<User>) => Promise<AuthResponse>;
  changePassword: (passwordData: PasswordData) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => getStoredUser());

  useEffect(() => {
    if (user?.token && isTokenExpired(user.token)) {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (identifier: string, password: string, rememberMe = false) => {
    const userData = await authService.login(identifier, password);
    setUser(userData);
    persistUser(userData, rememberMe);
    return userData;
  };

  const register = async (userData: any) => {
    return await authService.register(userData);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) throw new Error('Not authenticated');
    const updatedUserData = await authService.updateProfile({
      ...profileData,
      id: user.userId,
    });
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
    persistUser(newUser, remember);
    return newUser;
  };

  const changePassword = async (passwordData: PasswordData) => {
    if (!user) throw new Error('Not authenticated');
    await authService.changePassword(passwordData);
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('Not authenticated');
    await authService.deleteAccount();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, updateProfile, changePassword, logout, deleteAccount, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

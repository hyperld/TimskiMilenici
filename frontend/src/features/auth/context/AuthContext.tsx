import React, { createContext, useState, ReactNode } from 'react';
import { authService, AuthResponse, PasswordData } from '../services/authService';
import { User } from '../../user/types';

interface AuthContextType {
  user: AuthResponse | null;
  login: (identifier: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  updateProfile: (profileData: Partial<User>) => Promise<AuthResponse>;
  changePassword: (passwordData: PasswordData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const storedUser = localStorage.getItem('petpal_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (identifier: string, password: string) => {
    try {
      const userData = await authService.login(identifier, password);
      setUser(userData);
      localStorage.setItem('petpal_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const registeredUser = await authService.register(userData);
      return registeredUser;
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      if (!user) throw new Error('Not authenticated');

      const updatedUserData = await authService.updateProfile({
        ...profileData,
        id: user.userId
      });
      // Merge with existing user data (to keep the token)
      const newUser = { ...user, ...updatedUserData };
      setUser(newUser);
      localStorage.setItem('petpal_user', JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (passwordData: PasswordData) => {
    try {
      if (!user) throw new Error('Not authenticated');
      await authService.changePassword(passwordData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('petpal_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, changePassword, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

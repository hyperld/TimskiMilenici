import React, { ReactNode } from 'react';
import { AuthProvider as BaseAuthProvider } from '../../features/auth/context/AuthContext';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseAuthProvider>{children}</BaseAuthProvider>;
};

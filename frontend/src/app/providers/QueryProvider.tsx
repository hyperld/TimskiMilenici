import React, { ReactNode } from 'react';

// For now, this is a placeholder as react-query is not installed.
// If it were installed, we would initialize QueryClient here.

export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

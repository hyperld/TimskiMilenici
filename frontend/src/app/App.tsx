import React, { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';
import { CartProvider } from '../features/cart/context/CartContext';
import { PawPalProvider } from '../features/pawpal/context/PawPalContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import CartIcon from '../shared/components/CartIcon/CartIcon';
import Footer from '../shared/components/Footer/Footer';
import PawPalWidget from '../features/pawpal/components/PawPalWidget/PawPalWidget';

const PUBLIC_PATHS = ['/', '/login', '/register'];

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const TokenGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  const checkToken = useCallback(() => {
    if (!user?.token) return;
    if (isTokenExpired(user.token) && !hasRedirected.current) {
      hasRedirected.current = true;
      logout();
      if (!PUBLIC_PATHS.includes(location.pathname)) {
        navigate('/', { replace: true });
      }
    }
  }, [user, logout, navigate, location.pathname]);

  useEffect(() => {
    checkToken();
    const interval = setInterval(checkToken, 60_000);
    return () => clearInterval(interval);
  }, [checkToken]);

  useEffect(() => {
    const onFocus = () => checkToken();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkToken]);

  useEffect(() => {
    hasRedirected.current = false;
  }, [user]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <Router>
        <TokenGuard>
          <CartProvider>
            <PawPalProvider>
              <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <AppRoutes />
                  <CartIcon />
                </div>
                <PawPalWidget />
                <Footer />
              </div>
            </PawPalProvider>
          </CartProvider>
        </TokenGuard>
      </Router>
    </AppProviders>
  );
};

export default App;

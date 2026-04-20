import React, { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';
import { CartProvider } from '../features/cart/context/CartContext';
import { PawPalProvider } from '../features/pawpal/context/PawPalContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import CartIcon from '../shared/components/CartIcon/CartIcon';
import PawPalWidget from '../features/pawpal/components/PawPalWidget/PawPalWidget';
import FloatingActionStack from '../shared/components/FloatingActionStack/FloatingActionStack';

const PUBLIC_PATHS = ['/', '/login', '/register'];
const PAWPAL_HIDDEN_PATHS = ['/', '/login', '/register'];
const OWNER_DASHBOARD_PATHS = ['/owner-dashboard'];

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

const GlobalFloatingControls: React.FC = () => {
  const location = useLocation();
  const hidePawPal = PAWPAL_HIDDEN_PATHS.includes(location.pathname);
  const isOwnerDashboard = OWNER_DASHBOARD_PATHS.includes(location.pathname);
  const pawpalMode = isOwnerDashboard ? 'owner' : 'customer';

  return (
    <FloatingActionStack>
      <CartIcon />
      {!hidePawPal && (
        <PawPalWidget key={pawpalMode} variant="stack" mode={pawpalMode} />
      )}
    </FloatingActionStack>
  );
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <Router>
        <TokenGuard>
          <CartProvider>
            <PawPalProvider>
              <div
                style={{
                  height: '100%',
                  minHeight: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <AppRoutes />
                </div>
                <GlobalFloatingControls />
              </div>
            </PawPalProvider>
          </CartProvider>
        </TokenGuard>
      </Router>
    </AppProviders>
  );
};

export default App;

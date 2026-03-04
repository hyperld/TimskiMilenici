import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';
import { CartProvider } from '../features/cart/context/CartContext';
import CartIcon from '../shared/components/CartIcon/CartIcon';
import Footer from '../shared/components/Footer/Footer';

const App: React.FC = () => {
  return (
    <AppProviders>
      <Router>
        <CartProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <AppRoutes />
              <CartIcon />
            </div>
            <Footer />
          </div>
        </CartProvider>
      </Router>
    </AppProviders>
  );
};

export default App;

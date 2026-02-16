import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';
import { CartProvider } from '../features/cart/context/CartContext';
import CartIcon from '../shared/components/CartIcon/CartIcon';

const App: React.FC = () => {
  return (
    <AppProviders>
      <Router>
        <CartProvider>
          <AppRoutes />
          <CartIcon />
        </CartProvider>
      </Router>
    </AppProviders>
  );
};

export default App;

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { cartService, CartResponse } from '../services/cartService';
import { useAuth } from '../../auth/hooks/useAuth';

interface CartContextType {
  itemCount: number;
  cart: CartResponse | null;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = useCallback(async () => {
    const count = await cartService.getItemCount();
    setItemCount(count);
    if (count > 0) {
      const c = await cartService.getCart();
      setCart(c);
    } else {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
    } else {
      setItemCount(0);
      setCart(null);
    }
  }, [isAuthenticated, user?.userId, refreshCart]);

  const addItem = useCallback(
    async (productId: number, quantity: number = 1) => {
      const updated = await cartService.addItem(productId, quantity);
      if (updated) {
        setCart(updated);
        setItemCount(updated.items.reduce((s, i) => s + i.quantity, 0));
      }
    },
    []
  );

  const updateQuantity = useCallback(async (cartItemId: number, quantity: number) => {
    const updated = await cartService.updateItemQuantity(cartItemId, quantity);
    if (updated) {
      setCart(updated);
      setItemCount(updated.items.reduce((s, i) => s + i.quantity, 0));
    }
  }, []);

  const removeItem = useCallback(async (cartItemId: number) => {
    await cartService.removeItem(cartItemId);
    await refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, cart, addItem, updateQuantity, removeItem, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

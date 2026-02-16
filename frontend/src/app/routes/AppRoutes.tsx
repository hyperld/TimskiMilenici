import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../features/auth/components/ProtectedRoute/ProtectedRoute';

// Screens
import WelcomeScreen from '../../features/welcome/WelcomeScreen';
import LoginScreen from '../../features/auth/LoginScreen';
import RegisterScreen from '../../features/auth/RegisterScreen';
import HomeScreen from '../../features/business/HomeScreen';
import StoreDetailsScreen from '../../features/business/StoreDetailsScreen';
import BookingScreen from '../../features/booking/BookingScreen';
import CartScreen from '../../features/cart/screens/CartScreen';
import EditProfileScreen from '../../features/user/EditProfileScreen';
import OwnerDashboardScreen from '../../features/business/OwnerDashboardScreen';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/store/:id" element={<StoreDetailsScreen />} />

      <Route path="/cart" element={
        <ProtectedRoute>
          <CartScreen />
        </ProtectedRoute>
      } />
      
      <Route path="/booking/:serviceId" element={
        <ProtectedRoute>
          <BookingScreen />
        </ProtectedRoute>
      } />
      
      <Route path="/account" element={<Navigate to="/owner-dashboard" replace />} />
      
      <Route path="/edit-profile" element={
        <ProtectedRoute>
          <EditProfileScreen />
        </ProtectedRoute>
      } />
      
      <Route path="/owner-dashboard" element={
        <ProtectedRoute requiredRole="OWNER">
          <OwnerDashboardScreen />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

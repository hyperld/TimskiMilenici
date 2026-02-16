import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { businessService } from './services/businessService';
import { Business } from './types';
import StoreFilters from './components/StoreFilters/StoreFilters';
import StoreGrid from './components/StoreGrid/StoreGrid';
import AccountCard from '../user/components/AccountCard/AccountCard';
import PendingBookings from '../user/components/PendingBookings/PendingBookings';
import NotificationTab from '../../shared/components/NotificationTab/NotificationTab';
import styles from './HomeScreen.module.css';

const HomeScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [stores, setStores] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await businessService.getAllBusinesses();
        setStores(data);
        setError('');
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Failed to load stores. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

    const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
    const storeType = (store as any).type || (store as any).category;
    const matchesType = filterType === 'All' || storeType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar userName={user?.fullName || 'User'} />

      <div style={{ display: 'flex', flex: 1 }}>
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {isAuthenticated && user && (
            <div className={styles.topRow}>
              <AccountCard
                userData={user}
                onEdit={() => navigate('/edit-profile')}
              />
              <div className={styles.rightColumn}>
                {user.userId != null && <PendingBookings userId={user.userId} />}
                <NotificationTab />
              </div>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            marginBottom: '2.5rem', 
            gap: '1.5rem' 
          }}>
            <div style={{ 
              backgroundColor: 'var(--color-primary)',
              padding: '1.5rem 2.5rem', 
              borderRadius: '50px', 
              boxShadow: 'var(--shadow-md)', 
              display: 'inline-block' 
            }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                Available Stores
              </h2>
              <p style={{ color: 'white', margin: '0.5rem 0 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                Find the best services and products for your pet.
              </p>
            </div>
            
            <StoreFilters 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterChange={setFilterType}
            />
          </div>
          
          <StoreGrid 
            stores={filteredStores}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
};

export default HomeScreen;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { businessService } from './services/businessService';
import { Business } from './types';
import BusinessList from './components/OwnerDashboard/BusinessList';
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import AccountCard from '../user/components/AccountCard/AccountCard';
import OwnerAnalyticsOverview from '../analytics/components/OwnerAnalyticsOverview';
import NotificationTab from '../notifications/components/NotificationTab/NotificationTab';
import CreateStoreModal from './components/StoreModals/CreateStoreModal';
import ManageStoreModal from './components/StoreModals/ManageStoreModal';
import { ownerAnalyticsService, OverviewResult } from '../analytics/services/ownerAnalyticsService';
import styles from './OwnerDashboardScreen.module.css';

const OwnerDashboardScreen: React.FC = () => {
  const STORES_PER_PAGE = 4;
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const userId = user?.userId;
  const userRole = user?.role || '';

  useEffect(() => {
    if (isAuthenticated && userRole !== 'OWNER' && userRole?.toUpperCase() !== 'OWNER' && userRole?.toUpperCase() !== 'BUSINESS_OWNER') {
      navigate('/home');
    }
  }, [userRole, isAuthenticated, navigate]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ownerStores, setOwnerStores] = useState<Business[]>([]);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [managingStore, setManagingStore] = useState<any | null>(null);

  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    ownerAnalyticsService.getOverview().then(setOverview).catch(() => {});
  }, [ownerStores]);

  const ownerStats = useMemo(() => {
    const totalProducts = ownerStores.reduce((sum, s) => sum + (s.products?.length || 0), 0);
    const totalServices = ownerStores.reduce((sum, s) => sum + (s.services?.length || 0), 0);
    const stats = [
      { icon: '🏪', label: 'Stores', value: ownerStores.length },
      { icon: '📦', label: 'Products', value: totalProducts },
      { icon: '🐾', label: 'Services', value: totalServices },
    ];
    if (overview) {
      stats.push({ icon: '📅', label: 'Bookings', value: overview.totalBookings });
    }
    return stats;
  }, [ownerStores, overview]);

  const [newStore, setNewStore] = useState({
    name: '',
    type: 'Supplies',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    mainImageUrl: '',
    imageUrls: [] as string[]
  });

  const fetchStores = async () => {
    if (userId) {
      try {
        setLoading(true);
        const businesses = await businessService.getBusinessByOwner(userId);
        setOwnerStores(businesses || []);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStores();
  }, [userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [ownerStores.length]);

  const handleEditStore = (store: Business) => {
    setEditingStore({...store});
    setShowEditModal(true);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { buildAddress } = await import('./utils/addressUtils');
      const address = buildAddress(newStore.street, newStore.city, newStore.postalCode, newStore.country);
      const result = await businessService.createBusiness({
        ...newStore,
        address,
        ownerId: userId
      });
      setOwnerStores(prev => [...prev, result]);
      setShowCreateModal(false);
      setNewStore({
        name: '',
        type: 'Supplies',
        street: '',
        city: '',
        postalCode: '',
        country: '',
        description: '',
        contactPhone: '',
        contactEmail: '',
        mainImageUrl: '',
        imageUrls: []
      });
    } catch (error) {
      alert("Failed to create store");
    }
  };

  const handleDeleteStore = async (storeId: number) => {
    await businessService.deleteBusiness(storeId);
    setOwnerStores(prev => prev.filter(s => s.id !== storeId));
    setShowEditModal(false);
    setEditingStore(null);
  };

  const handleUpdateStore = async (updatedStore: any, itemsToSave: any[], itemsToDelete: {id: number, type: string}[]) => {
    try {
      setLoading(true);
      // 1. Update basic info
      const result = await businessService.updateBusiness(updatedStore.id, updatedStore);
      
      // 2. Process pending item deletions
      for (const item of itemsToDelete) {
        if (item.type === 'product') {
          await businessService.deleteProduct(item.id);
        } else {
          await businessService.deleteService(item.id);
        }
      }

      // 3. Process pending item saves (add/update)
      for (const item of itemsToSave) {
        const payload = {
          ...item,
          storeId: updatedStore.id
        };
        // If it was a temp ID, remove it so backend can assign one (or it handles it as new)
        if (typeof payload.id === 'string' && payload.id.startsWith('temp-')) {
          delete payload.id;
        }

        if (item.type === 'product') {
          await businessService.saveProduct(payload);
        } else {
          await businessService.saveService(payload);
        }
      }
      
      await fetchStores();
      setShowEditModal(false);
      setEditingStore(null);
    } catch (error) {
      alert("Failed to update store and items");
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.fullName || 'User';
  const totalPages = Math.max(1, Math.ceil(ownerStores.length / STORES_PER_PAGE));
  const pagedStores = ownerStores.slice((currentPage - 1) * STORES_PER_PAGE, currentPage * STORES_PER_PAGE);

  return (
    <div className={styles.pageShell}>
      <TopBar userName={userName} />
      <main className={styles.main}>
        <DashboardHeader 
          title="Owner Dashboard" 
          description="Manage your pet businesses and services." 
          onAddClick={() => setShowCreateModal(true)} 
        />
        <div className={styles.pageLayout}>
          <section className={styles.leftPanel}>
            {user && (
              <AccountCard
                userData={user}
                onEdit={() => navigate('/edit-profile')}
                greeting={`Welcome back, ${user.fullName.split(' ')[0]}!`}
                stats={ownerStats}
                variant="expanded"
              >
                <OwnerAnalyticsOverview stores={ownerStores} />
                <NotificationTab />
              </AccountCard>
            )}
          </section>

          <section className={styles.rightPanel}>
            {!loading && totalPages > 1 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.listViewport}>
              <BusinessList 
                loading={loading}
                stores={pagedStores}
                onEditStore={handleEditStore}
                onAddStore={() => setShowCreateModal(true)}
              />
            </div>
          </section>
        </div>

        {showCreateModal && (
          <CreateStoreModal 
            newStore={newStore}
            setNewStore={setNewStore}
            onSubmit={handleCreateStore}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showEditModal && editingStore && (
          <ManageStoreModal 
            editingStore={editingStore}
            onUpdate={handleUpdateStore}
            onDelete={handleDeleteStore}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default OwnerDashboardScreen;

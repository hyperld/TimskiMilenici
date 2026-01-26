import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { businessService } from './services/businessService';
import { Business } from './types';
import BusinessList from './components/OwnerDashboard/BusinessList';
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import CreateStoreModal from './components/StoreModals/CreateStoreModal';
import ManageStoreModal from './components/StoreModals/ManageStoreModal';
import ItemModal from './components/StoreModals/ItemModal';

const OwnerDashboardScreen: React.FC = () => {
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
  const [showItemModal, setShowItemModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ownerStores, setOwnerStores] = useState<Business[]>([]);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [managingStore, setManagingStore] = useState<any | null>(null);
  
  const [itemFormData, setItemFormData] = useState({
    name: '',
    price: '',
    description: '',
    type: 'product',
    stockQuantity: '',
    capacity: '',
    durationMinutes: '',
    id: null as number | null
  });

  const [newStore, setNewStore] = useState({
    name: '',
    type: 'Supplies',
    location: '',
    address: '',
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

  const handleEditStore = (store: Business) => {
    setEditingStore({...store});
    setShowEditModal(true);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await businessService.createBusiness({
        ...newStore,
        ownerId: userId
      });
      
      setOwnerStores(prev => [...prev, result]);
      setShowCreateModal(false);
      setNewStore({ 
        name: '', 
        type: 'Supplies', 
        location: '', 
        address: '', 
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

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar userName={userName} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <DashboardHeader 
          title="Owner Dashboard" 
          description="Manage your pet businesses and services." 
          onAddClick={() => setShowCreateModal(true)} 
        />

        <BusinessList 
          loading={loading}
          stores={ownerStores}
          onEditStore={handleEditStore}
          onAddStore={() => setShowCreateModal(true)}
        />

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
            onClose={() => setShowEditModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default OwnerDashboardScreen;

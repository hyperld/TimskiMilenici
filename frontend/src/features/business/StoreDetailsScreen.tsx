import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCart } from '../../features/cart/context/CartContext';
import { businessService } from './services/businessService';
import { Business } from './types';
import StoreDetails from './components/StoreDetails/StoreDetails';
import Button from '../../shared/components/Button/Button';

const StoreDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await businessService.getBusinessById(id);
        
        const allImages = [...(data.images || [])];
        if (data.mainImageUrl && !allImages.includes(data.mainImageUrl)) {
          allImages.unshift(data.mainImageUrl);
        }
        
        setStore({
          ...data,
          images: allImages
        });
        setError('');
      } catch (err) {
        console.error('Error fetching store:', err);
        setError('Store not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [id]);

  const handleNextImage = () => {
    if (!store?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % (store.images?.length || 1));
  };

  const handlePrevImage = () => {
    if (!store?.images) return;
    const len = store.images.length || 1;
    setCurrentImageIndex((prev) => (prev - 1 + len) % len);
  };

  const handleDotClick = (idx: number) => {
    setCurrentImageIndex(idx);
  };

  const userName = user?.fullName || 'User';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopBar userName={userName} />
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-light)', fontSize: '1.2rem' }}>
          Loading store details...
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopBar userName={userName} />
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-error)' }}>
          <h2>{error || 'Store not found'}</h2>
          <Button 
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/home')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar userName={userName} />
      <StoreDetails 
        store={store}
        currentImageIndex={currentImageIndex}
        onNextImage={handleNextImage}
        onPrevImage={handlePrevImage}
        onDotClick={handleDotClick}
        onBookService={(serviceId) => {
          const service = store.services?.find((s: any) => s.id === Number(serviceId) || s.id === serviceId);
          navigate(`/booking/${serviceId}`, { state: { service, storeId: store.id } });
        }}
        onAddToCart={user ? (product) => addItem(product.id).catch(() => alert('Failed to add to cart')) : undefined}
        onBack={() => navigate('/home')}
      />
    </div>
  );
};

export default StoreDetailsScreen;

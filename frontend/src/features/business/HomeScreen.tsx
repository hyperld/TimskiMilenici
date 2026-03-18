import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCart } from '../../features/cart/context/CartContext';
import { businessService } from './services/businessService';
import { Business, ProductWithStore, PetServiceWithStore } from './types';
import StoreFilters, { FilterMode } from './components/StoreFilters/StoreFilters';
import StoreGrid from './components/StoreGrid/StoreGrid';
import ProductCard from './components/ProductCard/ProductCard';
import ServiceCard from './components/ServiceCard/ServiceCard';
import ProductDetailModal from './components/ProductDetailModal/ProductDetailModal';
import AccountCard from '../user/components/AccountCard/AccountCard';
import PendingBookings from '../user/components/PendingBookings/PendingBookings';
import NotificationTab from '../notifications/components/NotificationTab/NotificationTab';
import styles from './HomeScreen.module.css';

type TabKey = 'stores' | 'products' | 'services';

const TAB_LABELS: Record<TabKey, string> = {
  stores: 'Stores',
  products: 'Products',
  services: 'Services',
};

const HomeScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('stores');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const [stores, setStores] = useState<Business[]>([]);
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [services, setServices] = useState<PetServiceWithStore[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<ProductWithStore | null>(null);

  useEffect(() => {
    setSearchTerm('');
    setFilterType('All');
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'stores') {
          const data = await businessService.getAllBusinesses();
          setStores(data);
        } else if (activeTab === 'products') {
          const data = await businessService.getAllProducts();
          setProducts(data);
        } else {
          const data = await businessService.getAllServices();
          setServices(data);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const filteredStores = stores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
    const rawType = (store as any).type || (store as any).category;
    const storeTypes: string[] =
      Array.isArray((store as any).types) && (store as any).types.length > 0
        ? (store as any).types
        : rawType
          ? [rawType]
          : [];
    const matchesType = filterType === 'All' || storeTypes.includes(filterType);
    return matchesSearch && matchesType;
  });

  const getFilteredProducts = () => {
    let filtered = products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterType === 'price-low') {
      filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filterType === 'price-high') {
      filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
    }
    return filtered;
  };

  const getFilteredServices = () => {
    let filtered = services.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterType === 'price-low') {
      filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filterType === 'price-high') {
      filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
    }
    return filtered;
  };

  const handleAddToCart = (productId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    addItem(productId).catch(() => alert('Failed to add to cart'));
  };

  const renderContent = () => {
    if (loading) {
      return <div className={styles.statusMessage}>Loading {activeTab}...</div>;
    }
    if (error) {
      return <div className={styles.errorMessage}>{error}</div>;
    }

    if (activeTab === 'stores') {
      return <StoreGrid stores={filteredStores} loading={false} error="" />;
    }

    if (activeTab === 'products') {
      const filtered = getFilteredProducts();
      if (filtered.length === 0) {
        return <div className={styles.noResults}>No products found matching your criteria.</div>;
      }
      return (
        <div className={styles.grid}>
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>
      );
    }

    const filtered = getFilteredServices();
    if (filtered.length === 0) {
      return <div className={styles.noResults}>No services found matching your criteria.</div>;
    }
    return (
      <div className={styles.grid}>
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    );
  };

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

          <div className={styles.headerSection}>
            <div className={styles.headerBanner}>
              <h2 className={styles.headerTitle}>Explore PetPal</h2>
              <span className={styles.headerDot}>·</span>
              <p className={styles.headerSubtitle}>
                Find the best stores, products, and services for your pet
              </p>
            </div>

            <div className={styles.tabBar}>
              {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            <StoreFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterChange={setFilterType}
              mode={activeTab as FilterMode}
            />
          </div>

          <div style={{ minHeight: '400px' }}>
            {renderContent()}
          </div>

          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={handleAddToCart}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default HomeScreen;

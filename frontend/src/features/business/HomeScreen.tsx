import React, { useState, useEffect, useCallback } from 'react';
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
import RecommendedPanel from '../recommendations/components/RecommendedPanel/RecommendedPanel';
import SpecialOffersTab, { SpecialOfferItem } from '../recommendations/components/SpecialOffersTab/SpecialOffersTab';
import styles from './HomeScreen.module.css';

type TabKey = 'stores' | 'products' | 'services';

const TAB_LABELS: Record<TabKey, string> = {
  stores: 'Stores',
  products: 'Products',
  services: 'Services',
};

const STORES_PER_PAGE = 4;
const PRODUCTS_PER_PAGE = 10;
const SERVICES_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [specialOffers, setSpecialOffers] = useState<SpecialOfferItem[]>([]);

  useEffect(() => {
    setSearchTerm('');
    setFilterType('All');
    setCurrentPage(1);
  }, [activeTab]);

  const loadSpecialOffers = useCallback(async () => {
    try {
      const [promoProducts, promoServices] = await Promise.all([
        businessService.getPromotedProducts(),
        businessService.getPromotedServices(),
      ]);

      const mappedProducts: SpecialOfferItem[] = promoProducts
        .filter((p: any) => p.promotionPrice != null && Number(p.promotionPrice) < Number(p.price))
        .map((p: any) => ({
          id: p.id,
          type: 'product',
          name: p.name,
          businessId: p.businessId,
          businessName: p.businessName,
          price: Number(p.price),
          promotionPrice: Number(p.promotionPrice),
        }));

      const mappedServices: SpecialOfferItem[] = promoServices
        .filter((s: any) => s.promotionPrice != null && Number(s.promotionPrice) < Number(s.price))
        .map((s: any) => ({
          id: s.id,
          type: 'service',
          name: s.name,
          businessId: s.businessId,
          businessName: s.businessName,
          price: Number(s.price),
          promotionPrice: Number(s.promotionPrice),
        }));

      const combined = [...mappedProducts, ...mappedServices];
      setSpecialOffers(combined);
    } catch {
      setSpecialOffers([]);
    }
  }, []);

  useEffect(() => {
    loadSpecialOffers();
  }, [loadSpecialOffers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

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
      const pagedStores = filteredStores.slice(
        (currentPage - 1) * STORES_PER_PAGE,
        currentPage * STORES_PER_PAGE
      );
      return <StoreGrid stores={pagedStores} loading={false} error="" />;
    }

    if (activeTab === 'products') {
      const filtered = getFilteredProducts();
      if (filtered.length === 0) {
        return <div className={styles.noResults}>No products found matching your criteria.</div>;
      }
      return (
        <div className={styles.grid}>
          {filtered
            .slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)
            .map((product) => (
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
        {filtered
          .slice((currentPage - 1) * SERVICES_PER_PAGE, currentPage * SERVICES_PER_PAGE)
          .map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    );
  };

  const getTotalPages = (): number => {
    if (activeTab === 'stores') {
      return Math.max(1, Math.ceil(filteredStores.length / STORES_PER_PAGE));
    }
    if (activeTab === 'products') {
      return Math.max(1, Math.ceil(getFilteredProducts().length / PRODUCTS_PER_PAGE));
    }
    return Math.max(1, Math.ceil(getFilteredServices().length / SERVICES_PER_PAGE));
  };

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1 || loading || error) return null;
    return (
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
    );
  };

  const recommendedItems = [
    { title: 'Top Stores', subtitle: 'Browse popular pet stores', tab: 'stores' as TabKey },
    { title: 'Best Products', subtitle: 'Quick picks for your pets', tab: 'products' as TabKey },
    { title: 'Popular Services', subtitle: 'Most booked services', tab: 'services' as TabKey },
    { title: 'Special Offers', subtitle: 'Find current deals', tab: 'products' as TabKey },
  ].map((item) => ({
    title: item.title,
    subtitle: item.subtitle,
    onClick: () => {
      setActiveTab(item.tab);
      setCurrentPage(1);
    },
  }));

  return (
    <div className={styles.pageShell}>
      <TopBar userName={user?.fullName || 'User'} />

      <main className={styles.main}>
        {isAuthenticated && user ? (
          <div className={styles.pageLayout}>
            <section className={styles.leftPanel}>
              <div className={styles.specialOffersSlot}>
                <SpecialOffersTab
                  items={specialOffers}
                  onRefresh={loadSpecialOffers}
                  onExploreOffer={(offer) => navigate(`/store/${offer.businessId}`)}
                />
              </div>
              <div className={styles.accountSlot}>
                <AccountCard
                  userData={user}
                  onEdit={() => navigate('/edit-profile')}
                  variant="homeCompact"
                >
                  {user.userId != null && <PendingBookings userId={user.userId} />}
                  <NotificationTab />
                </AccountCard>
              </div>
              <RecommendedPanel items={recommendedItems} />
            </section>

            <section className={styles.rightPanel}>
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

                <div className={styles.filtersRow}>
                  <StoreFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterType={filterType}
                    onFilterChange={setFilterType}
                    mode={activeTab as FilterMode}
                  />
                  {renderPagination()}
                </div>
              </div>

              <div className={styles.contentArea}>
                {renderContent()}
              </div>
            </section>
          </div>
        ) : (
          <section className={styles.rightPanelFull}>
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

              <div className={styles.filtersRow}>
                <StoreFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                  mode={activeTab as FilterMode}
                />
                {renderPagination()}
              </div>
            </div>

            <div className={styles.contentArea}>
              {renderContent()}
            </div>
          </section>
        )}

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>
    </div>
  );
};

export default HomeScreen;

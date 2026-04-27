import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import PendingBookings from '../user/components/PendingBookings/PendingBookings';
import RecommendedPanel from '../recommendations/components/RecommendedPanel/RecommendedPanel';
import NotificationHeaderButton from '../notifications/components/NotificationHeaderButton/NotificationHeaderButton';
import SpecialOffersTab, { SpecialOfferItem } from '../recommendations/components/SpecialOffersTab/SpecialOffersTab';
import PaginationBar from '../../shared/components/PaginationBar/PaginationBar';
import { useUserLocation } from '../location/hooks/useUserLocation';
import LocationConsentModal from '../location/components/LocationConsentModal/LocationConsentModal';
import styles from './HomeScreen.module.css';

/** Effectively "the whole planet" so we can grab a distance for every
 *  geocoded store and rank them by proximity while still showing the rest. */
const NEAR_ME_RADIUS_KM = 20000;

type TabKey = 'stores' | 'products' | 'services';

const TAB_LABELS: Record<TabKey, string> = {
  stores: 'Stores',
  products: 'Products',
  services: 'Services',
};

const STORES_PER_PAGE = 6;
const PRODUCTS_PER_PAGE = 6;
const SERVICES_PER_PAGE = 6;

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

  const { coords, status, requestLocation, clearLocation } = useUserLocation(true);
  const [consentOpen, setConsentOpen] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<Business[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const nearMeActive = nearbyStores != null;

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
    if (!coords) return;
    let cancelled = false;
    setNearbyLoading(true);
    businessService
      .getNearbyBusinesses(coords.latitude, coords.longitude, NEAR_ME_RADIUS_KM)
      .then((data) => {
        if (cancelled) return;
        setNearbyStores(data);
      })
      .catch((err) => {
        console.error('getNearbyBusinesses error:', err);
        if (!cancelled) setNearbyStores([]);
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const handleNearMeToggle = useCallback(() => {
    if (nearMeActive) {
      setNearbyStores(null);
      clearLocation();
      return;
    }
    if (coords) {
      setNearbyLoading(true);
      businessService
        .getNearbyBusinesses(coords.latitude, coords.longitude, NEAR_ME_RADIUS_KM)
        .then((data) => setNearbyStores(data))
        .catch(() => setNearbyStores([]))
        .finally(() => setNearbyLoading(false));
      return;
    }
    setConsentOpen(true);
  }, [nearMeActive, coords, clearLocation]);

  const handleConsentAllow = useCallback(() => {
    setConsentOpen(false);
    requestLocation();
  }, [requestLocation]);

  const handleConsentDeny = useCallback(() => {
    setConsentOpen(false);
  }, []);

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

  const activeStoreList = useMemo(() => {
    if (!nearMeActive || !nearbyStores) {
      return stores;
    }
    const distanceById = new Map<number | string, number>();
    for (const s of nearbyStores) {
      const raw = (s as Business & { distanceKm?: number }).distanceKm;
      if (s.id != null && typeof raw === 'number' && isFinite(raw)) {
        distanceById.set(s.id, raw);
      }
    }
    const annotated: (Business & { distanceKm?: number })[] = stores.map((store) => {
      const d = store.id != null ? distanceById.get(store.id) : undefined;
      return typeof d === 'number' ? { ...store, distanceKm: d } : store;
    });
    return [...annotated].sort((a, b) => {
      const ad = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
      const bd = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return a.name.localeCompare(b.name);
    });
  }, [nearMeActive, nearbyStores, stores]);

  const filteredStores = activeStoreList.filter((store) => {
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

  const filtersPagination = (() => {
    const totalPages = getTotalPages();
    if (totalPages <= 1 || loading || error) return null;
    return (
      <PaginationBar
        size="inline"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        disabled={loading || !!error}
      />
    );
  })();

  const recommendedItems = [
    { title: 'Top Stores', subtitle: 'Browse popular pet stores', tab: 'stores' as TabKey },
    { title: 'Best Products', subtitle: 'Quick picks for your pets', tab: 'products' as TabKey },
    { title: 'Popular Services', subtitle: 'Most booked services', tab: 'services' as TabKey },
  ].map((item) => ({
    title: item.title,
    subtitle: item.subtitle,
    onClick: () => {
      setActiveTab(item.tab);
      setCurrentPage(1);
    },
  }));

  const homeHeaderTools = isAuthenticated ? <NotificationHeaderButton /> : undefined;

  return (
    <div className={`${styles.pageShell} appRouteRoot`}>
      <TopBar userName={user?.fullName || 'User'} beforeUserMenu={homeHeaderTools} />

      <main className={styles.main}>
        {isAuthenticated && user ? (
          <div className={styles.pageLayout}>
            {/* First column: 70% — store / product / service listings */}
            <section className={styles.listingPanel}>
              <div className={styles.headerSection}>
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
                    pagination={filtersPagination}
                    nearMe={{
                      active: nearMeActive,
                      loading: nearbyLoading || status === 'prompting',
                      onToggle: handleNearMeToggle,
                      label: nearMeActive ? 'Near me · on' : 'Near me',
                    }}
                  />
                </div>
              </div>

              <div className={styles.contentArea}>
                {renderContent()}
              </div>
            </section>

            {/* Second column: 30% — offers, bookings, recommended (stacked) */}
            <aside className={styles.sidebarPanel}>
              <div className={styles.specialOffersSlot}>
                <SpecialOffersTab
                  items={specialOffers}
                  onRefresh={loadSpecialOffers}
                  onExploreOffer={(offer) => navigate(`/store/${offer.businessId}`)}
                  onViewAll={() => navigate('/special-offers')}
                />
              </div>
              {user.userId != null && (
                <div className={styles.sidebarBookingsSlot}>
                  <PendingBookings userId={user.userId} compact />
                </div>
              )}
              <div className={styles.sidebarRecommendedSlot}>
                <RecommendedPanel items={recommendedItems} variant="sidebar" />
              </div>
            </aside>
          </div>
        ) : (
          <section className={styles.rightPanelFull}>
            <div className={styles.headerSection}>
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
                  pagination={filtersPagination}
                  nearMe={{
                    active: nearMeActive,
                    loading: nearbyLoading || status === 'prompting',
                    onToggle: handleNearMeToggle,
                    label: nearMeActive ? 'Near me · on' : 'Near me',
                  }}
                />
              </div>
            </div>

            <div className={styles.contentArea}>
              {renderContent()}
            </div>
            <div className={styles.recommendedBelow}>
              <RecommendedPanel items={recommendedItems} variant="full" />
            </div>
          </section>
        )}

        <LocationConsentModal
          open={consentOpen}
          onAllow={handleConsentAllow}
          onDeny={handleConsentDeny}
        />

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

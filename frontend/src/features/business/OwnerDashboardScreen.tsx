import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { businessService } from './services/businessService';
import { bookingService } from '../booking/services/bookingService';
import { Business, ProductWithStore, PetServiceWithStore } from './types';
import BusinessList from './components/OwnerDashboard/BusinessList';
import OwnerProductList from './components/OwnerDashboard/OwnerProductList';
import OwnerServiceList from './components/OwnerDashboard/OwnerServiceList';
import OwnerBookingList from './components/OwnerDashboard/OwnerBookingList';
import OwnerDashboardStatsBar from './components/OwnerDashboard/OwnerDashboardStatsBar';
import OwnerStoreToolbar from './components/OwnerStoreToolbar/OwnerStoreToolbar';
import OwnerItemToolbar from './components/OwnerDashboard/OwnerItemToolbar';
import OwnerAnalyticsCarousel from '../analytics/components/OwnerAnalyticsCarousel/OwnerAnalyticsCarousel';
import NotificationWidget from '../notifications/components/NotificationWidget/NotificationWidget';
import CreateStoreModal from './components/StoreModals/CreateStoreModal';
import ManageStoreModal from './components/StoreModals/ManageStoreModal';
import ProductModal from './components/StoreModals/ProductModal';
import ServiceModal from './components/StoreModals/ServiceModal';
import BookingDetailModal from './components/StoreModals/BookingDetailModal';
import PaginationBar from '../../shared/components/PaginationBar/PaginationBar';
import { ownerAnalyticsService, OverviewResult } from '../analytics/services/ownerAnalyticsService';
import { getDefaultAnalyticsRange } from '../analytics/ownerAnalyticsDisplayUtils';
import { createDefaultWorkingSchedule, validateWorkingSchedule } from './utils/workingSchedule';
import styles from './OwnerDashboardScreen.module.css';

type ActiveView = 'Stores' | 'Products' | 'Services' | 'Bookings';

const STORES_PER_PAGE = 2;
const ITEMS_PER_PAGE = 4;

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
  const [loading, setLoading] = useState(true);
  const [ownerStores, setOwnerStores] = useState<Business[]>([]);
  const [editingStore, setEditingStore] = useState<any | null>(null);

  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('Stores');
  const [currentPage, setCurrentPage] = useState(1);
  const [storeFilter, setStoreFilter] = useState<number | null>(null);

  // Product/Service edit modal state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // Booking detail modal state
  const [detailBooking, setDetailBooking] = useState<any | null>(null);

  // Bookings data (lazy-loaded) + date range filter
  const [ownerBookings, setOwnerBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const bookingsFetchedRef = useRef(false);

  const defaultDateRange = useMemo(() => {
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    const future = new Date(now);
    future.setDate(future.getDate() + 60);
    return {
      from: past.toISOString().split('T')[0],
      to: future.toISOString().split('T')[0],
    };
  }, []);
  const [bookingDateRange, setBookingDateRange] = useState(defaultDateRange);

  const statsOverviewParams = useMemo(() => {
    const { from, to } = getDefaultAnalyticsRange();
    return { from, to };
  }, []);

  useEffect(() => {
    let cancelled = false;
    ownerAnalyticsService
      .getOverview(statsOverviewParams)
      .then((o) => {
        if (!cancelled) setOverview(o);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerStores, statsOverviewParams]);

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

  // Derived flat lists (respecting store filter)
  const filteredStoresForItems = useMemo(() =>
    storeFilter ? ownerStores.filter(s => s.id === storeFilter) : ownerStores,
    [ownerStores, storeFilter]);

  const allProducts = useMemo<ProductWithStore[]>(() =>
    filteredStoresForItems.flatMap(s =>
      (s.products || []).map(p => ({ ...p, businessName: s.name }))
    ), [filteredStoresForItems]);

  const allServices = useMemo<PetServiceWithStore[]>(() =>
    filteredStoresForItems.flatMap(s =>
      (s.services || []).map(svc => ({ ...svc, businessName: s.name }))
    ), [filteredStoresForItems]);

  const filteredBookings = useMemo(() =>
    storeFilter
      ? ownerBookings.filter((b: any) => {
          const bStoreId = b.business?.id || b.businessId;
          return bStoreId === storeFilter || ownerStores.find(s => s.id === storeFilter && s.name === b.storeName);
        })
      : ownerBookings,
    [ownerBookings, storeFilter, ownerStores]);

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
    imageUrls: [] as string[],
    workingSchedule: createDefaultWorkingSchedule(),
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

  const fetchBookings = useCallback(async () => {
    if (ownerStores.length === 0) {
      setOwnerBookings([]);
      return;
    }
    setBookingsLoading(true);
    try {
      const results = await Promise.all(
        ownerStores.map(async (store) => {
          const bookings = await bookingService.getBookingsByStoreInRange(
            store.id, bookingDateRange.from, bookingDateRange.to
          );
          return bookings.map((b: any) => ({ ...b, storeName: store.name }));
        })
      );
      setOwnerBookings(results.flat());
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setOwnerBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [ownerStores, bookingDateRange]);

  useEffect(() => {
    fetchStores();
  }, [userId]);

  // Reset page and fetch bookings lazily when switching to Bookings tab
  useEffect(() => {
    setCurrentPage(1);
    setStoreFilter(null);
    if (activeView === 'Bookings' && !bookingsFetchedRef.current) {
      bookingsFetchedRef.current = true;
      fetchBookings();
    }
  }, [activeView, fetchBookings]);

  // Reset page when store filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [storeFilter]);

  // Re-fetch bookings when stores change (only if already fetched once)
  useEffect(() => {
    if (bookingsFetchedRef.current) {
      fetchBookings();
    }
  }, [ownerStores, fetchBookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [ownerStores.length]);

  const handleEditStore = (store: Business) => {
    setEditingStore({...store});
    setShowEditModal(true);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const schedule = newStore.workingSchedule ?? createDefaultWorkingSchedule();
    const scheduleErr = validateWorkingSchedule(schedule);
    if (scheduleErr) {
      alert(scheduleErr);
      return;
    }
    try {
      const { buildAddress } = await import('./utils/addressUtils');
      const address = buildAddress(newStore.street, newStore.city, newStore.postalCode, newStore.country);
      const result = await businessService.createBusiness({
        ...newStore,
        workingSchedule: schedule,
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
        imageUrls: [],
        workingSchedule: createDefaultWorkingSchedule(),
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
      await businessService.updateBusiness(updatedStore.id, updatedStore);
      
      for (const item of itemsToDelete) {
        if (item.type === 'product') {
          await businessService.deleteProduct(item.id);
        } else {
          await businessService.deleteService(item.id);
        }
      }

      for (const item of itemsToSave) {
        const payload = {
          ...item,
          storeId: updatedStore.id
        };
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

  // Product edit/delete handlers (from the Products tab)
  const handleEditProduct = (product: ProductWithStore) => {
    setEditingProduct({
      ...product,
      type: 'product',
      stockQuantity: product.stockQuantity ?? product.stock ?? 0,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const payload = { ...editingProduct, storeId: editingProduct.businessId };
      if (isNewItem) delete payload.id;
      await businessService.saveProduct(payload);
      await fetchStores();
      setEditingProduct(null);
      setIsNewItem(false);
    } catch {
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (product: ProductWithStore) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await businessService.deleteProduct(product.id);
      await fetchStores();
    } catch {
      alert('Failed to delete product');
    }
  };

  // Service edit/delete handlers (from the Services tab)
  const handleEditService = (service: PetServiceWithStore) => {
    setEditingService({
      ...service,
      type: 'service',
      durationMinutes: service.durationMinutes ?? service.duration ?? 30,
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const payload = { ...editingService, storeId: editingService.businessId };
      if (isNewItem) delete payload.id;
      await businessService.saveService(payload);
      await fetchStores();
      setEditingService(null);
      setIsNewItem(false);
    } catch {
      alert('Failed to save service');
    }
  };

  const handleDeleteService = async (service: PetServiceWithStore) => {
    if (!window.confirm(`Delete service "${service.name}"?`)) return;
    try {
      await businessService.deleteService(service.id);
      await fetchStores();
    } catch {
      alert('Failed to delete service');
    }
  };

  // "Add new" from the Products / Services tab
  const handleAddNewProduct = () => {
    setIsNewItem(true);
    setEditingProduct({
      name: '',
      originalPrice: '',
      stockQuantity: '',
      promotionPrice: '',
      promoted: false,
      description: '',
      businessId: ownerStores.length === 1 ? ownerStores[0].id : '',
      type: 'product',
    });
  };

  const handleAddNewService = () => {
    setIsNewItem(true);
    setEditingService({
      name: '',
      originalPrice: '',
      durationMinutes: '',
      promotionPrice: '',
      promoted: false,
      capacity: '',
      description: '',
      businessId: ownerStores.length === 1 ? ownerStores[0].id : '',
      type: 'service',
    });
  };

  // Booking actions: dismiss (cancel) and mark completed
  const handleDismissBooking = async (booking: any) => {
    if (!window.confirm('Dismiss this booking? The customer will be notified.')) return;
    try {
      await bookingService.updateBookingStatus(booking.id, 'CANCELLED');
      await fetchBookings();
    } catch {
      alert('Failed to dismiss booking');
    }
  };

  const handleCompleteBooking = async (booking: any) => {
    try {
      await bookingService.updateBookingStatus(booking.id, 'COMPLETED');
      await fetchBookings();
    } catch {
      alert('Failed to mark booking as completed');
    }
  };

  // Date range change for bookings
  const handleBookingDateRangeChange = useCallback((from: string, to: string) => {
    setBookingDateRange({ from, to });
    setCurrentPage(1);
  }, []);

  // Re-fetch bookings when date range changes (only if already fetched once)
  useEffect(() => {
    if (bookingsFetchedRef.current) {
      fetchBookings();
    }
  }, [bookingDateRange, fetchBookings]);

  // Pagination logic per view
  const userName = user?.fullName || 'User';

  const getPagedData = <T,>(items: T[], perPage: number) => {
    const total = Math.max(1, Math.ceil(items.length / perPage));
    const safePage = Math.min(currentPage, total);
    const paged = items.slice((safePage - 1) * perPage, safePage * perPage);
    return { paged, totalPages: total };
  };

  const { paged: pagedStores, totalPages: storeTotalPages } = getPagedData(ownerStores, STORES_PER_PAGE);
  const { paged: pagedProducts, totalPages: productTotalPages } = getPagedData(allProducts, ITEMS_PER_PAGE);
  const { paged: pagedServices, totalPages: serviceTotalPages } = getPagedData(allServices, ITEMS_PER_PAGE);
  const { paged: pagedBookings, totalPages: bookingTotalPages } = getPagedData(filteredBookings, ITEMS_PER_PAGE);

  const buildPagination = (totalPages: number) =>
    totalPages > 1 ? (
      <PaginationBar
        size="inline"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    ) : null;

  const storePagination = !loading ? buildPagination(storeTotalPages) : null;

  const storeOptions = useMemo(() =>
    ownerStores.map(s => ({ id: s.id, name: s.name })),
    [ownerStores]);

  const renderListContent = () => {
    switch (activeView) {
      case 'Products':
        return (
          <OwnerProductList
            products={pagedProducts}
            loading={loading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        );
      case 'Services':
        return (
          <OwnerServiceList
            services={pagedServices}
            loading={loading}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
          />
        );
      case 'Bookings':
        return (
          <OwnerBookingList
            bookings={pagedBookings}
            loading={bookingsLoading}
            onViewDetails={setDetailBooking}
            onDismiss={handleDismissBooking}
            onComplete={handleCompleteBooking}
          />
        );
      default:
        return (
          <BusinessList
            loading={loading}
            stores={pagedStores}
            onEditStore={handleEditStore}
            variant="ownerLarge"
          />
        );
    }
  };

  const itemToolbarPagination = (() => {
    switch (activeView) {
      case 'Products': return buildPagination(productTotalPages);
      case 'Services': return buildPagination(serviceTotalPages);
      case 'Bookings': return buildPagination(bookingTotalPages);
      default: return null;
    }
  })();

  return (
    <div className={`${styles.pageShell} appRouteRoot`}>
      <TopBar userName={userName} beforeUserMenu={<NotificationWidget />} />
      <main className={styles.main}>
        <div className={styles.pageLayout}>
          <section className={styles.leftPanel}>
            <div className={styles.ownerStatsSlot}>
              <OwnerDashboardStatsBar
                stats={ownerStats}
                activeLabel={activeView}
                onStatClick={(label) => setActiveView(label as ActiveView)}
              />
            </div>
            {activeView === 'Stores' ? (
              <OwnerStoreToolbar
                onAddStore={() => setShowCreateModal(true)}
                pagination={storePagination}
              />
            ) : (
              <OwnerItemToolbar
                stores={storeOptions}
                selectedStoreId={storeFilter}
                onStoreFilterChange={setStoreFilter}
                pagination={itemToolbarPagination}
                onAdd={
                  activeView === 'Products' ? handleAddNewProduct
                    : activeView === 'Services' ? handleAddNewService
                    : undefined
                }
                addLabel={
                  activeView === 'Products' ? '+ Add Product'
                    : activeView === 'Services' ? '+ Add Service'
                    : undefined
                }
                dateRange={activeView === 'Bookings' ? bookingDateRange : undefined}
                onDateRangeChange={activeView === 'Bookings' ? handleBookingDateRangeChange : undefined}
              />
            )}
            <div className={styles.listViewport}>
              {renderListContent()}
            </div>
          </section>

          <section className={styles.rightPanel}>
            {user && (
              <div className={styles.analyticsStack}>
                <OwnerAnalyticsCarousel
                  stores={ownerStores.map((s) => ({ id: s.id, name: s.name }))}
                />
              </div>
            )}
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

        {editingProduct && (
          <ProductModal
            itemFormData={editingProduct}
            setItemFormData={setEditingProduct}
            onSave={handleSaveProduct}
            onClose={() => { setEditingProduct(null); setIsNewItem(false); }}
            stores={isNewItem ? storeOptions : undefined}
          />
        )}

        {editingService && (
          <ServiceModal
            itemFormData={editingService}
            setItemFormData={setEditingService}
            onSave={handleSaveService}
            onClose={() => { setEditingService(null); setIsNewItem(false); }}
            stores={isNewItem ? storeOptions : undefined}
          />
        )}

        {detailBooking && (
          <BookingDetailModal
            booking={detailBooking}
            onClose={() => setDetailBooking(null)}
          />
        )}
      </main>
    </div>
  );
};

export default OwnerDashboardScreen;

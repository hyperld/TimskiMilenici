import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { businessService } from './services/businessService';
import { Business } from './types';
import BusinessList from './components/OwnerDashboard/BusinessList';
import OwnerDashboardStatsBar from './components/OwnerDashboard/OwnerDashboardStatsBar';
import OwnerStoreToolbar from './components/OwnerStoreToolbar/OwnerStoreToolbar';
import OwnerAnalyticsPanels from '../analytics/components/OwnerAnalyticsPanels/OwnerAnalyticsPanels';
import NotificationWidget from '../notifications/components/NotificationWidget/NotificationWidget';
import CreateStoreModal from './components/StoreModals/CreateStoreModal';
import ManageStoreModal from './components/StoreModals/ManageStoreModal';
import PaginationBar from '../../shared/components/PaginationBar/PaginationBar';
import { ownerAnalyticsService, OverviewResult } from '../analytics/services/ownerAnalyticsService';
import { getDefaultAnalyticsRange } from '../analytics/ownerAnalyticsDisplayUtils';
import { createDefaultWorkingSchedule, validateWorkingSchedule } from './utils/workingSchedule';
import styles from './OwnerDashboardScreen.module.css';

const OwnerDashboardScreen: React.FC = () => {
  const STORES_PER_PAGE = 2;
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
  const [currentPage, setCurrentPage] = useState(1);

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
      const result = await businessService.updateBusiness(updatedStore.id, updatedStore);
      
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

  const userName = user?.fullName || 'User';
  const totalPages = Math.max(1, Math.ceil(ownerStores.length / STORES_PER_PAGE));
  const pagedStores = ownerStores.slice((currentPage - 1) * STORES_PER_PAGE, currentPage * STORES_PER_PAGE);

  const leftPanelRef = useRef<HTMLElement>(null);
  const [analyticsColumnHeight, setAnalyticsColumnHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = leftPanelRef.current;
    if (!el) return;
    const measure = () => setAnalyticsColumnHeight(Math.round(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, ownerStores.length, currentPage, pagedStores.length]);

  const ownerPagination =
    !loading && totalPages > 1 ? (
      <PaginationBar
        size="inline"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    ) : null;

  return (
    <div className={`${styles.pageShell} appRouteRoot`}>
      <TopBar userName={userName} beforeUserMenu={<NotificationWidget />} />
      <main className={styles.main}>
        <div className={styles.pageLayout}>
          <section ref={leftPanelRef} className={styles.leftPanel}>
            <div className={styles.ownerStatsSlot}>
              <OwnerDashboardStatsBar stats={ownerStats} />
            </div>
            <OwnerStoreToolbar
              onAddStore={() => setShowCreateModal(true)}
              pagination={ownerPagination}
            />
            <div className={styles.listViewport}>
              <BusinessList
                loading={loading}
                stores={pagedStores}
                onEditStore={handleEditStore}
                variant="ownerLarge"
              />
            </div>
          </section>

          <section
            className={styles.rightPanel}
            style={
              analyticsColumnHeight != null
                ? { height: analyticsColumnHeight, minHeight: 0 }
                : undefined
            }
          >
            {user && (
              <div className={styles.analyticsStack}>
                <OwnerAnalyticsPanels
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
      </main>
    </div>
  );
};

export default OwnerDashboardScreen;

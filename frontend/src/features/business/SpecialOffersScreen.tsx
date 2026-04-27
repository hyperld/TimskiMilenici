import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { businessService } from './services/businessService';
import { Business } from './types';
import StoreFilters from './components/StoreFilters/StoreFilters';
import PaginationBar from '../../shared/components/PaginationBar/PaginationBar';
import { useUserLocation } from '../location/hooks/useUserLocation';
import LocationConsentModal from '../location/components/LocationConsentModal/LocationConsentModal';
import NotificationHeaderButton from '../notifications/components/NotificationHeaderButton/NotificationHeaderButton';
import styles from './SpecialOffersScreen.module.css';

const NEAR_ME_RADIUS_KM = 20000;
const OFFERS_PER_PAGE = 9;

interface OfferItem {
  id: number;
  type: 'product' | 'service';
  name: string;
  businessId: number;
  businessName: string;
  price: number;
  promotionPrice: number;
}

const SpecialOffersScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const { coords, status, requestLocation, clearLocation } = useUserLocation(true);
  const [consentOpen, setConsentOpen] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<(Business & { distanceKm: number })[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const nearMeActive = nearbyStores != null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      businessService.getPromotedProducts(),
      businessService.getPromotedServices(),
    ])
      .then(([products, services]) => {
        if (cancelled) return;
        const mapped: OfferItem[] = [
          ...products
            .filter((p: any) => p.promotionPrice != null && Number(p.promotionPrice) < Number(p.price))
            .map((p: any) => ({
              id: p.id,
              type: 'product' as const,
              name: p.name,
              businessId: p.businessId,
              businessName: p.businessName,
              price: Number(p.price),
              promotionPrice: Number(p.promotionPrice),
            })),
          ...services
            .filter((s: any) => s.promotionPrice != null && Number(s.promotionPrice) < Number(s.price))
            .map((s: any) => ({
              id: s.id,
              type: 'service' as const,
              name: s.name,
              businessId: s.businessId,
              businessName: s.businessName,
              price: Number(s.price),
              promotionPrice: Number(s.promotionPrice),
            })),
        ];
        setOffers(mapped);
      })
      .catch(() => setOffers([]))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setNearbyLoading(true);
    businessService
      .getNearbyBusinesses(coords.latitude, coords.longitude, NEAR_ME_RADIUS_KM)
      .then((data) => {
        if (!cancelled) setNearbyStores(data);
      })
      .catch(() => {
        if (!cancelled) setNearbyStores([]);
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });
    return () => { cancelled = true; };
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
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const filteredOffers = useMemo(() => {
    let result = offers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (o) => o.name.toLowerCase().includes(term) || o.businessName.toLowerCase().includes(term),
      );
    }

    if (filterType === 'product') {
      result = result.filter((o) => o.type === 'product');
    } else if (filterType === 'service') {
      result = result.filter((o) => o.type === 'service');
    }

    if (nearMeActive && nearbyStores) {
      const distanceById = new Map<number, number>();
      for (const s of nearbyStores) {
        if (s.id != null && typeof s.distanceKm === 'number' && isFinite(s.distanceKm)) {
          distanceById.set(s.id, s.distanceKm);
        }
      }
      const annotated = result.map((o) => ({
        ...o,
        distanceKm: distanceById.get(o.businessId),
      }));
      annotated.sort((a, b) => {
        const ad = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
        const bd = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
        return ad - bd;
      });
      return annotated;
    }

    return result.map((o) => ({ ...o, distanceKm: undefined as number | undefined }));
  }, [offers, searchTerm, filterType, nearMeActive, nearbyStores]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / OFFERS_PER_PAGE));
  const pagedOffers = filteredOffers.slice(
    (currentPage - 1) * OFFERS_PER_PAGE,
    currentPage * OFFERS_PER_PAGE,
  );

  const headerTools = isAuthenticated ? <NotificationHeaderButton /> : undefined;

  const filtersPagination = (() => {
    if (totalPages <= 1 || loading) return null;
    return (
      <PaginationBar
        size="inline"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    );
  })();

  return (
    <div className={`${styles.pageShell} appRouteRoot`}>
      <TopBar userName={user?.fullName || 'User'} beforeUserMenu={headerTools} />

      <main className={styles.main}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Special Offers</h1>
          <div className={styles.filtersRow}>
            <StoreFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterChange={setFilterType}
              mode="offers"
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
          {loading ? (
            <div className={styles.statusMessage}>Loading offers...</div>
          ) : filteredOffers.length === 0 ? (
            <div className={styles.noResults}>No offers found matching your criteria.</div>
          ) : (
            <div className={styles.grid}>
              {pagedOffers.map((offer) => {
                const discountPercent =
                  offer.price > 0
                    ? Math.max(0, Math.round(((offer.price - offer.promotionPrice) / offer.price) * 100))
                    : 0;
                return (
                  <article
                    key={`${offer.type}-${offer.id}`}
                    className={styles.card}
                    onClick={() => navigate(`/store/${offer.businessId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') navigate(`/store/${offer.businessId}`);
                    }}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.typeBadge}>
                        {offer.type === 'product' ? 'Product' : 'Service'}
                      </span>
                      <span className={styles.discount}>{discountPercent}% off</span>
                    </div>
                    <h3 className={styles.offerName}>{offer.name}</h3>
                    <p className={styles.storeName}>{offer.businessName}</p>
                    {nearMeActive && typeof offer.distanceKm === 'number' && (
                      <p className={styles.distanceTag}>
                        {offer.distanceKm < 1
                          ? `${Math.round(offer.distanceKm * 1000)} m away`
                          : `${offer.distanceKm.toFixed(1)} km away`}
                      </p>
                    )}
                    <div className={styles.priceRow}>
                      <span className={styles.oldPrice}>${offer.price.toFixed(2)}</span>
                      <span className={styles.newPrice}>${offer.promotionPrice.toFixed(2)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <LocationConsentModal
          open={consentOpen}
          onAllow={handleConsentAllow}
          onDeny={handleConsentDeny}
        />
      </main>
    </div>
  );
};

export default SpecialOffersScreen;

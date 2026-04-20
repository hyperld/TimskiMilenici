import React, { useEffect, useMemo, useState } from 'react';
import { reviewService, ReviewItem } from '../../../business/services/reviewService';
import type { OwnerAnalyticsStoreOption } from '../OwnerAnalyticsCarousel/ownerAnalyticsCarouselTypes';
import panelStyles from '../OwnerAnalyticsPanels/OwnerAnalyticsPanels.module.css';
import styles from './OwnerReviewsPanel.module.css';

interface AggregatedReview extends ReviewItem {
  businessId?: number;
  businessName?: string;
}

export interface OwnerReviewsPanelProps {
  businessId: number | null;
  from: string;
  to: string;
  stores: OwnerAnalyticsStoreOption[];
}

const OwnerReviewsPanel: React.FC<OwnerReviewsPanelProps> = ({
  businessId,
  from,
  to,
  stores,
}) => {
  const [allReviews, setAllReviews] = useState<AggregatedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetStores = useMemo(() => {
    if (businessId != null) {
      return stores.filter((s) => s.id === businessId);
    }
    return stores;
  }, [stores, businessId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (targetStores.length === 0) {
        setAllReviews([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const responses = await Promise.all(
          targetStores.map((s) =>
            reviewService.getByBusiness(s.id).then((r) => ({ store: s, response: r })),
          ),
        );
        if (cancelled) return;
        const merged: AggregatedReview[] = [];
        for (const { store, response } of responses) {
          for (const rv of response.reviews ?? []) {
            merged.push({ ...rv, businessId: store.id, businessName: store.name });
          }
        }
        setAllReviews(merged);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load reviews');
          setAllReviews([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [targetStores]);

  const filteredReviews = useMemo(() => {
    const fromTs = new Date(`${from}T00:00:00`).getTime();
    const toTs = new Date(`${to}T23:59:59`).getTime();
    return allReviews.filter((r) => {
      if (!r.createdAt) return true;
      const ts = new Date(r.createdAt).getTime();
      if (Number.isNaN(ts)) return true;
      return ts >= fromTs && ts <= toTs;
    });
  }, [allReviews, from, to]);

  const { average, distribution, recent } = useMemo(() => {
    if (filteredReviews.length === 0) {
      return { average: 0, distribution: [0, 0, 0, 0, 0], recent: [] as AggregatedReview[] };
    }
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of filteredReviews) {
      const rating = Number(r.rating) || 0;
      sum += rating;
      const bucket = Math.min(5, Math.max(1, Math.round(rating))) - 1;
      dist[bucket] += 1;
    }
    const avg = sum / filteredReviews.length;
    const recentList = [...filteredReviews]
      .sort((a, b) => {
        const at = new Date(a.createdAt || 0).getTime();
        const bt = new Date(b.createdAt || 0).getTime();
        return bt - at;
      })
      .slice(0, 4);
    return { average: avg, distribution: dist, recent: recentList };
  }, [filteredReviews]);

  const renderState = (body: React.ReactNode) => (
    <p className={panelStyles.stateMessage} role="status">
      {body}
    </p>
  );

  const maxBar = Math.max(1, ...distribution);

  const formatDate = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const reviewerLabel = (r: AggregatedReview): string => {
    const u = r.user || {};
    return u.fullName || u.username || 'Customer';
  };

  return (
    <div className={panelStyles.column}>
      <section
        className={`${panelStyles.section} ${panelStyles.performanceSection}`}
        aria-labelledby="owner-analytics-reviews-summary"
      >
        <h3 id="owner-analytics-reviews-summary" className={panelStyles.sectionTitle}>
          Reviews
        </h3>
        {loading ? (
          renderState('Loading…')
        ) : error ? (
          <p className={panelStyles.errorMessage} role="alert">
            {error}
          </p>
        ) : filteredReviews.length === 0 ? (
          renderState('No reviews in this period yet.')
        ) : (
          <div className={styles.summaryRow}>
            <div className={styles.avgBlock} aria-label={`Average rating ${average.toFixed(1)} out of 5`}>
              <span className={styles.avgNumber}>{average.toFixed(1)}</span>
              <span className={styles.avgStars} aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={i < Math.round(average) ? styles.starOn : styles.starOff}
                  >
                    ★
                  </span>
                ))}
              </span>
              <span className={styles.avgMeta}>{filteredReviews.length} reviews</span>
            </div>
            <ul className={styles.distList}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star - 1];
                const width = Math.round((count / maxBar) * 100);
                return (
                  <li key={star} className={styles.distRow}>
                    <span className={styles.distLabel}>{star}★</span>
                    <span className={styles.distBar} aria-hidden>
                      <span
                        className={styles.distBarFill}
                        style={{ width: `${Math.max(2, width)}%` }}
                      />
                    </span>
                    <span className={styles.distCount}>{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section
        className={`${panelStyles.section} ${panelStyles.peakSection}`}
        aria-labelledby="owner-analytics-reviews-recent"
      >
        <h3 id="owner-analytics-reviews-recent" className={panelStyles.sectionTitle}>
          Recent
        </h3>
        {loading ? null : recent.length === 0 ? (
          renderState('—')
        ) : (
          <ul className={styles.recentList}>
            {recent.map((r) => (
              <li key={r.id} className={styles.recentItem}>
                <div className={styles.recentHead}>
                  <span className={styles.recentName}>{reviewerLabel(r)}</span>
                  <span className={styles.recentRating} aria-label={`Rated ${r.rating} out of 5`}>
                    {'★'.repeat(Math.round(Number(r.rating) || 0))}
                    <span className={styles.recentRatingMuted}>
                      {'★'.repeat(5 - Math.round(Number(r.rating) || 0))}
                    </span>
                  </span>
                </div>
                <div className={styles.recentMeta}>
                  {r.businessName ? <span>{r.businessName}</span> : null}
                  {r.createdAt ? <span>{formatDate(r.createdAt)}</span> : null}
                </div>
                {r.comment ? <p className={styles.recentComment}>{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default OwnerReviewsPanel;

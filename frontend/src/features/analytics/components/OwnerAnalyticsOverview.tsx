import React, { useEffect, useState } from 'react';
import type { Business } from '../../business/types';
import {
  ownerAnalyticsService,
  type OverviewResult,
  type ProductSalesRow,
  type PeakTimeBucket,
} from '../services/ownerAnalyticsService';
import styles from './OwnerAnalyticsOverview.module.css';
import OwnerAnalyticsDetailModal from './OwnerAnalyticsDetailModal';

export type AnalyticsType = 'overview' | 'products' | 'peak-times';

interface OwnerAnalyticsOverviewProps {
  stores: Business[];
}

const OwnerAnalyticsOverview: React.FC<OwnerAnalyticsOverviewProps> = ({ stores }) => {
  const [activeType, setActiveType] = useState<AnalyticsType | null>(null);
  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [products, setProducts] = useState<ProductSalesRow[] | null>(null);
  const [peakTimes, setPeakTimes] = useState<PeakTimeBucket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        const [o, s, p] = await Promise.all([
          ownerAnalyticsService.getOverview(),
          ownerAnalyticsService.getProductSales(),
          ownerAnalyticsService.getPeakTimes(),
        ]);
        if (cancelled) return;
        setOverview(o);
        setProducts(s);
        setPeakTimes(p);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpen = (type: AnalyticsType) => {
    setActiveType(type);
  };

  return (
    <section className={styles.wrapper} aria-label="Store analytics">
      <h3 className={styles.title}>Analytics</h3>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.cardRow}>
        <button
          type="button"
          className={styles.card}
          onClick={() => handleOpen('overview')}
        >
          <div className={styles.miniChart}>
            <svg viewBox="0 0 100 40" className={styles.sparkline}>
              <polyline
                fill="none"
                stroke="var(--color-primary, #6366f1)"
                strokeWidth="2"
                points={buildSparklinePoints(overview)}
              />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>Bookings & revenue</span>
            <span className={styles.cardSubtitle}>Trends over time</span>
          </div>
        </button>

        <button
          type="button"
          className={styles.card}
          onClick={() => handleOpen('products')}
        >
          <div className={styles.miniChart}>
            <div className={styles.barRow}>
              {buildProductBars(products).map((h, idx) => (
                <span
                  key={idx}
                  className={styles.bar}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>Store products</span>
            <span className={styles.cardSubtitle}>Top-selling items</span>
          </div>
        </button>

        <button
          type="button"
          className={styles.card}
          onClick={() => handleOpen('peak-times')}
        >
          <div className={styles.miniChart}>
            <div className={styles.dayRow}>
              {buildPeakDayBars(peakTimes).map((h, idx) => (
                <span
                  key={idx}
                  className={styles.dayBar}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>Peak times</span>
            <span className={styles.cardSubtitle}>Busiest hours & days</span>
          </div>
        </button>
      </div>

      <OwnerAnalyticsDetailModal
        type={activeType}
        stores={stores}
        isOpen={!!activeType}
        onClose={() => setActiveType(null)}
      />
    </section>
  );
};

const buildSparklinePoints = (overview: OverviewResult | null): string => {
  if (!overview || !overview.points.length) {
    return '0,40 100,40';
  }
  const values = overview.points.map((p) => p.bookings);
  const max = Math.max(...values, 1);
  const step = 100 / Math.max(values.length - 1, 1);
  return values
    .map((v, idx) => {
      const x = idx * step;
      const y = 40 - (v / max) * 30 - 5;
      return `${x},${y}`;
    })
    .join(' ');
};

const buildProductBars = (rows: ProductSalesRow[] | null): number[] => {
  if (!rows || !rows.length) return [20, 35, 15];
  const top = rows.slice(0, 3);
  const max = Math.max(...top.map((r) => r.unitsSold), 1);
  return top.map((r) => Math.max(15, (r.unitsSold / max) * 90));
};

const buildPeakDayBars = (buckets: PeakTimeBucket[] | null): number[] => {
  // 7 days (Postgres EXTRACT DOW: 0=Sunday..6=Saturday)
  if (!buckets || !buckets.length) return Array(7).fill(25);
  const sums = new Array<number>(7).fill(0);
  buckets.forEach((b) => {
    const idx = Math.max(0, Math.min(6, b.dayOfWeek));
    sums[idx] += b.bookings;
  });
  const max = Math.max(...sums, 1);
  return sums.map((v) => (max === 0 ? 20 : Math.max(15, (v / max) * 90)));
};

export default OwnerAnalyticsOverview;


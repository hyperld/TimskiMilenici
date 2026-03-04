import React, { useEffect, useMemo, useState } from 'react';
import type { Business } from '../../business/types';
import {
  ownerAnalyticsService,
  type OverviewResult,
  type ProductSalesRow,
  type PeakTimeBucket,
} from '../services/ownerAnalyticsService';
import modalStyles from '../../business/components/StoreModals/Modal.module.css';
import styles from './OwnerAnalyticsDetailModal.module.css';
import Button from '../../../shared/components/Button/Button';
import type { AnalyticsType } from './OwnerAnalyticsOverview';

interface AnalyticsDetailModalProps {
  type: AnalyticsType | null;
  stores: Business[];
  isOpen: boolean;
  onClose: () => void;
}

type RangeKey = '7d' | '30d' | '90d';

const OwnerAnalyticsDetailModal: React.FC<AnalyticsDetailModalProps> = ({
  type,
  stores,
  isOpen,
  onClose,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<'all' | number>('all');
  const [range, setRange] = useState<RangeKey>('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [products, setProducts] = useState<ProductSalesRow[] | null>(null);
  const [peakTimes, setPeakTimes] = useState<PeakTimeBucket[] | null>(null);

  const { from, to } = useMemo(() => {
    const toDate = new Date();
    const days = range === '7d' ? 6 : range === '30d' ? 29 : 89;
    const fromDate = new Date(toDate);
    fromDate.setDate(toDate.getDate() - days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { from: fmt(fromDate), to: fmt(toDate) };
  }, [range]);

  useEffect(() => {
    if (!isOpen || !type) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const businessId =
          selectedStoreId === 'all' ? undefined : Number(selectedStoreId);
        if (type === 'overview') {
          const data = await ownerAnalyticsService.getOverview({
            businessId,
            from,
            to,
          });
          if (cancelled) return;
          setOverview(data);
        } else if (type === 'products') {
          const data = await ownerAnalyticsService.getProductSales({
            businessId,
            from,
            to,
          });
          if (cancelled) return;
          setProducts(data);
        } else if (type === 'peak-times') {
          const data = await ownerAnalyticsService.getPeakTimes({
            businessId,
            from,
            to,
          });
          if (cancelled) return;
          setPeakTimes(data);
        }
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load analytics details'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, type, selectedStoreId, from, to]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const title =
    type === 'overview'
      ? 'Bookings & revenue'
      : type === 'products'
        ? 'Store products'
        : 'Peak times';

  const handleClose = () => {
    onClose();
  };

  return (
    <div className={modalStyles.modalOverlay} onClick={handleClose}>
      <div
        className={modalStyles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={modalStyles.modalHeader}>
          <h2>{title}</h2>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.filters}>
            <label>
              <span style={{ fontSize: '0.8rem', marginRight: '0.3rem' }}>
                Store:
              </span>
              <select
                className={styles.select}
                value={selectedStoreId === 'all' ? 'all' : selectedStoreId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStoreId(val === 'all' ? 'all' : Number(val));
                }}
              >
                <option value="all">All stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.chips} aria-label="Date range">
              {(['7d', '30d', '90d'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.chip} ${
                    range === key ? styles.chipActive : ''
                  }`}
                  onClick={() => setRange(key)}
                >
                  {key === '7d' ? 'Last 7 days' : key === '30d' ? '30 days' : '90 days'}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className={styles.loading}>Loading analytics…</p>}
          {error && <p className={styles.error}>{error}</p>}

          {!loading && !error && type === 'overview' && overview && (
            <>
              <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Bookings</div>
                  <div className={styles.summaryValue}>
                    {overview.totalBookings}
                  </div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Completed</div>
                  <div className={styles.summaryValue}>
                    {overview.totalCompleted}
                  </div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Cancelled</div>
                  <div className={styles.summaryValue}>
                    {overview.totalCancelled}
                  </div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Revenue</div>
                  <div className={styles.summaryValue}>
                    €{overview.totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={styles.chart}>
                <svg viewBox="0 0 100 60" className={styles.sparkline}>
                  <polyline
                    fill="none"
                    stroke="var(--color-primary, #6366f1)"
                    strokeWidth="2"
                    points={buildOverviewSparkline(overview)}
                  />
                </svg>
                <p className={styles.chartCaption}>
                  Bookings per day from {from} to {to}.
                </p>
              </div>
            </>
          )}

          {!loading && !error && type === 'products' && (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units sold</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(products ?? []).map((row) => (
                    <tr key={row.productId}>
                      <td>{row.productName}</td>
                      <td>{row.unitsSold}</td>
                      <td>{row.ordersCount}</td>
                      <td>€{row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!products || products.length === 0) && (
                    <tr>
                      <td colSpan={4}>No product sales in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && type === 'peak-times' && (
            <div className={styles.chart}>
              <svg viewBox="0 0 100 60" className={styles.sparkline}>
                {buildPeakDayRects(peakTimes).map((rect, idx) => (
                  <rect
                    key={idx}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill="var(--color-primary, #6366f1)"
                    opacity={rect.opacity}
                    rx={2}
                  />
                ))}
              </svg>
              <p className={styles.chartCaption}>
                Relative activity per day of week (0 = Sun … 6 = Sat).
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const buildOverviewSparkline = (overview: OverviewResult | null): string => {
  if (!overview || !overview.points.length) return '0,50 100,50';
  const values = overview.points.map((p) => p.bookings);
  const max = Math.max(...values, 1);
  const step = 100 / Math.max(values.length - 1, 1);
  return values
    .map((v, idx) => {
      const x = idx * step;
      const y = 55 - (v / max) * 40;
      return `${x},${y}`;
    })
    .join(' ');
};

const buildPeakDayRects = (buckets: PeakTimeBucket[] | null) => {
  const result: { x: number; y: number; width: number; height: number; opacity: number }[] = [];
  if (!buckets || !buckets.length) {
    for (let i = 0; i < 7; i++) {
      result.push({ x: i * 13 + 4, y: 40, width: 8, height: 10, opacity: 0.3 });
    }
    return result;
  }
  const sums = new Array<number>(7).fill(0);
  buckets.forEach((b) => {
    const idx = Math.max(0, Math.min(6, b.dayOfWeek));
    sums[idx] += b.bookings;
  });
  const max = Math.max(...sums, 1);
  sums.forEach((v, idx) => {
    const height = (v / max) * 40 + 5;
    const opacity = Math.max(0.25, v / max);
    result.push({
      x: idx * 13 + 4,
      y: 55 - height,
      width: 8,
      height,
      opacity,
    });
  });
  return result;
};

export default OwnerAnalyticsDetailModal;


import React, { useEffect, useMemo, useState } from 'react';
import AnalyticsPanelFrame from '../AnalyticsPanelFrame/AnalyticsPanelFrame';
import {
  ownerAnalyticsService,
  type OverviewResult,
  type ProductSalesRow,
  type PeakTimeBucket,
} from '../../services/ownerAnalyticsService';
import {
  getDefaultAnalyticsRange,
  formatRangeLabel,
  buildOverviewSparklinePoints,
  DOW_SHORT_MON_FIRST,
  aggregateBookingsByDayOfWeek,
  reorderDowSumsMonFirst,
  peakDayBarHeights,
  topBusyHours,
} from '../../ownerAnalyticsDisplayUtils';
import styles from './OwnerAnalyticsPanels.module.css';
import frameStyles from '../AnalyticsPanelFrame/AnalyticsPanelFrame.module.css';

const TOP_ROWS = 8;

const OwnerAnalyticsPanels: React.FC = () => {
  const { from, to } = useMemo(() => getDefaultAnalyticsRange(), []);
  const rangeLabel = useMemo(() => formatRangeLabel(from, to), [from, to]);

  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [topLines, setTopLines] = useState<ProductSalesRow[] | null>(null);
  const [peakTimes, setPeakTimes] = useState<PeakTimeBucket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [o, lines, pk] = await Promise.all([
          ownerAnalyticsService.getOverview({ from, to }),
          ownerAnalyticsService.getProductSales({ from, to }),
          ownerAnalyticsService.getPeakTimes({ from, to }),
        ]);
        if (cancelled) return;
        setOverview(o);
        setTopLines(lines);
        setPeakTimes(pk);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
        setOverview(null);
        setTopLines(null);
        setPeakTimes(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const sparkPoints = useMemo(() => buildOverviewSparklinePoints(overview), [overview]);
  const daySumsSunFirst = useMemo(() => aggregateBookingsByDayOfWeek(peakTimes), [peakTimes]);
  const daySumsMonFirst = useMemo(() => reorderDowSumsMonFirst(daySumsSunFirst), [daySumsSunFirst]);
  const barHeights = useMemo(() => peakDayBarHeights(daySumsMonFirst), [daySumsMonFirst]);
  const busyHours = useMemo(() => topBusyHours(peakTimes, 3), [peakTimes]);

  const performanceBody = () => {
    if (loading) return <p className={frameStyles.stateMessage}>Loading…</p>;
    if (error) return <p className={frameStyles.errorMessage}>{error}</p>;
    if (!overview) return <p className={frameStyles.stateMessage}>No data yet.</p>;
    return (
      <>
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Revenue</div>
            <div className={`${styles.kpiValue} ${styles.kpiValueAccent}`}>
              €{overview.totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Bookings</div>
            <div className={styles.kpiValue}>{overview.totalBookings}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Completed</div>
            <div className={styles.kpiValue}>{overview.totalCompleted}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Cancelled</div>
            <div className={styles.kpiValue}>{overview.totalCancelled}</div>
          </div>
        </div>
        <div className={styles.chartWrap}>
          <svg viewBox="0 0 100 60" className={styles.sparkline} preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.75"
              vectorEffect="non-scaling-stroke"
              points={sparkPoints}
            />
          </svg>
        </div>
        <p className={styles.chartHint}>Daily bookings in this period.</p>
      </>
    );
  };

  const topLinesBody = () => {
    if (loading) return <p className={frameStyles.stateMessage}>Loading…</p>;
    if (error) return <p className={frameStyles.errorMessage}>{error}</p>;
    const rows = topLines ?? [];
    if (!rows.length) return <p className={frameStyles.stateMessage}>No service sales in this period.</p>;
    const shown = rows.slice(0, TOP_ROWS);
    return (
      <div className={styles.rowList}>
        {shown.map((row) => (
          <div key={row.productId} className={styles.rowItem}>
            <span className={styles.rowName} title={row.productName}>
              {row.productName}
            </span>
            <span className={styles.rowMeta}>
              {row.unitsSold} sold · €{row.revenue.toFixed(2)}
            </span>
          </div>
        ))}
        {rows.length > TOP_ROWS ? (
          <p className={styles.chartHint}>+{rows.length - TOP_ROWS} more in reports.</p>
        ) : null}
      </div>
    );
  };

  const peakBody = () => {
    if (loading) return <p className={frameStyles.stateMessage}>Loading…</p>;
    if (error) return <p className={frameStyles.errorMessage}>{error}</p>;
    const maxSum = Math.max(...daySumsMonFirst, 0);
    if (maxSum === 0 && !peakTimes?.length) {
      return <p className={frameStyles.stateMessage}>No booking activity in this period.</p>;
    }
    return (
      <>
        <div className={styles.peakBars}>
          {DOW_SHORT_MON_FIRST.map((label, idx) => (
            <div key={label} className={styles.peakBarWrap}>
              <div
                className={styles.peakBar}
                style={{ height: `${barHeights[idx]}%` }}
                title={`${label}: ${daySumsMonFirst[idx]} bookings`}
              />
              <span className={styles.peakLabel}>{label}</span>
            </div>
          ))}
        </div>
        {busyHours.length > 0 ? (
          <div className={styles.busyHours}>
            <p className={styles.busyHoursTitle}>Busiest hours</p>
            <ul className={styles.busyHoursList}>
              {busyHours.map(({ hour, bookings }) => (
                <li key={hour}>
                  {String(hour).padStart(2, '0')}:00 – {bookings} booking{bookings === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className={styles.stack}>
      <AnalyticsPanelFrame title="Performance" subtitle={rangeLabel}>
        {performanceBody()}
      </AnalyticsPanelFrame>
      <AnalyticsPanelFrame title="Top services" subtitle={rangeLabel}>
        {topLinesBody()}
      </AnalyticsPanelFrame>
      <AnalyticsPanelFrame title="Peak demand" subtitle={rangeLabel}>
        {peakBody()}
      </AnalyticsPanelFrame>
    </div>
  );
};

export default OwnerAnalyticsPanels;

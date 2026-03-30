import React, { useEffect, useMemo, useState } from 'react';
import type { OverviewResult, PeakTimeBucket } from '../../services/ownerAnalyticsService';
import { ownerAnalyticsService } from '../../services/ownerAnalyticsService';
import {
  getDefaultAnalyticsRange,
  buildBookingsPolyline,
  buildRevenuePolyline,
  buildStackedDailyBars,
  OVERVIEW_CHART_VIEWBOX,
  buildPeakDemandMatrix12,
} from '../../ownerAnalyticsDisplayUtils';
import styles from './OwnerAnalyticsPanels.module.css';

const HEATMAP_HOUR_LABELS = [0, 4, 8, 12, 16, 20];
const HEATMAP_DOW_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const HM = {
  vbW: 168,
  vbH: 62,
  labelX: 2,
  gridX: 20,
  cellW: 9.2,
  cellH: 5.6,
  rowPitch: 6.55,
  colPitch: 10.2,
  startY: 5,
};

type ChartMode = 'volume' | 'revenue';

export type OwnerAnalyticsStoreOption = { id: number; name: string };

function formatCompletion(rate: number | null | undefined): string {
  if (rate == null) return '—';
  return `${Math.round(rate * 100)}%`;
}

function formatAvgValue(n: number | null | undefined): string {
  if (n == null) return '—';
  return `€${n.toFixed(2)}`;
}

function formatRevenueDelta(p: number | null | undefined): string | null {
  if (p == null) return null;
  const sign = p > 0 ? '+' : '';
  return `${sign}${p.toFixed(1)}% vs prior`;
}

export interface OwnerAnalyticsPanelsProps {
  stores: OwnerAnalyticsStoreOption[];
}

const OwnerAnalyticsPanels: React.FC<OwnerAnalyticsPanelsProps> = ({ stores }) => {
  const defaultRange = useMemo(() => getDefaultAnalyticsRange(), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('volume');

  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [peakTimes, setPeakTimes] = useState<PeakTimeBucket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const p: { from: string; to: string; businessId?: number } = { from, to };
    if (businessId != null) p.businessId = businessId;
    return p;
  }, [from, to, businessId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [o, pk] = await Promise.all([
          ownerAnalyticsService.getOverview(queryParams),
          ownerAnalyticsService.getPeakTimes(queryParams),
        ]);
        if (cancelled) return;
        setOverview(o);
        setPeakTimes(pk);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load analytics');
          setOverview(null);
          setPeakTimes(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  const bookingsLine = useMemo(() => buildBookingsPolyline(overview), [overview]);
  const revenueLine = useMemo(() => buildRevenuePolyline(overview), [overview]);
  const stackedBars = useMemo(() => buildStackedDailyBars(overview), [overview]);
  const peakMatrix = useMemo(() => buildPeakDemandMatrix12(peakTimes), [peakTimes]);

  const summary = overview?.summary;
  const revenueChipLabel = summary ? formatRevenueDelta(summary.revenueChangePercent) : null;

  const peakHeatmapDescription = useMemo(() => {
    if (!peakMatrix.max) return 'No booking activity by time of week in this period.';
    return `Peak demand heatmap: ${peakMatrix.max} bookings in the busiest two-hour cell. Darker cells mean more bookings.`;
  }, [peakMatrix]);

  const volumeChartLabel =
    'Daily completed and cancelled bookings; green is completed, red is cancelled.';
  const revenueChartLabel = 'Daily revenue trend for this period.';
  const bookingsTrendLabel = 'Daily booking count trend for this period.';

  const renderState = (body: React.ReactNode) => (
    <p className={styles.stateMessage} role="status">
      {body}
    </p>
  );

  const onFromChange = (v: string) => {
    setFrom(v);
    if (v > to) setTo(v);
  };

  const onToChange = (v: string) => {
    setTo(v);
    if (v < from) setFrom(v);
  };

  return (
    <div className={styles.column}>
      <div className={styles.filterBar} role="search" aria-label="Analytics filters">
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="owner-analytics-store">
            Store
          </label>
          <select
            id="owner-analytics-store"
            className={styles.filterSelect}
            value={businessId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setBusinessId(v === '' ? null : Number(v));
            }}
          >
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="owner-analytics-from">
            From
          </label>
          <input
            id="owner-analytics-from"
            type="date"
            className={styles.filterDate}
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="owner-analytics-to">
            To
          </label>
          <input
            id="owner-analytics-to"
            type="date"
            className={styles.filterDate}
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
        </div>
      </div>

      <section
        className={`${styles.section} ${styles.performanceSection}`}
        aria-labelledby="owner-analytics-performance"
      >
        <h3 id="owner-analytics-performance" className={styles.sectionTitle}>
          Performance
        </h3>
        {loading ? (
          renderState('Loading…')
        ) : error ? (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        ) : !overview ? (
          renderState('No data yet.')
        ) : (
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
            {summary ? (
              <div className={styles.kpiChips} aria-label="Derived metrics">
                <span className={styles.chip} title="Share of bookings marked completed">
                  Completion {formatCompletion(summary.completionRate)}
                </span>
                <span className={styles.chip} title="Average revenue per booking">
                  Avg / booking {formatAvgValue(summary.averageBookingValue)}
                </span>
                {revenueChipLabel ? (
                  <span className={styles.chip} title="Versus prior period of equal length">
                    {revenueChipLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className={styles.chartToggle} role="group" aria-label="Chart metric">
              <button
                type="button"
                className={`${styles.toggleBtn} ${chartMode === 'volume' ? styles.toggleBtnActive : ''}`}
                onClick={() => setChartMode('volume')}
              >
                Volume
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${chartMode === 'revenue' ? styles.toggleBtnActive : ''}`}
                onClick={() => setChartMode('revenue')}
              >
                Revenue
              </button>
            </div>
            <div className={`${styles.chartWrap} ${styles.chartWrapCompact}`}>
              {chartMode === 'volume' ? (
                <svg
                  viewBox={OVERVIEW_CHART_VIEWBOX}
                  className={`${styles.chartSvg} ${styles.chartSvgCompact}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={volumeChartLabel}
                >
                  <title>{volumeChartLabel}</title>
                  {stackedBars.map((b, i) => (
                    <g key={i}>
                      {b.hComplete > 0.05 ? (
                        <rect
                          x={b.x}
                          y={b.yComplete}
                          width={b.w}
                          height={b.hComplete}
                          fill="var(--color-success)"
                          opacity={0.9}
                          rx={0.4}
                        />
                      ) : null}
                      {b.hCancel > 0.05 ? (
                        <rect
                          x={b.x}
                          y={b.yCancel}
                          width={b.w}
                          height={b.hCancel}
                          fill="var(--color-error)"
                          opacity={0.85}
                          rx={0.4}
                        />
                      ) : null}
                    </g>
                  ))}
                </svg>
              ) : (
                <svg
                  viewBox={OVERVIEW_CHART_VIEWBOX}
                  className={`${styles.chartSvg} ${styles.chartSvgCompact}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={revenueChartLabel}
                >
                  <title>{revenueChartLabel}</title>
                  <polyline
                    fill="none"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="1.75"
                    vectorEffect="non-scaling-stroke"
                    points={revenueLine}
                  />
                </svg>
              )}
            </div>
            <div className={`${styles.chartWrap} ${styles.chartWrapSlim}`}>
              <svg
                viewBox={OVERVIEW_CHART_VIEWBOX}
                className={styles.chartSvgSlim}
                preserveAspectRatio="none"
                role="img"
                aria-label={bookingsTrendLabel}
              >
                <title>{bookingsTrendLabel}</title>
                <polyline
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                  strokeDasharray="2 1"
                  vectorEffect="non-scaling-stroke"
                  points={bookingsLine}
                />
              </svg>
            </div>
            <p className={styles.chartHint}>
              {chartMode === 'volume'
                ? 'Bars: completed vs cancelled per day. Dashed: bookings trend.'
                : 'Solid: revenue per day. Dashed: bookings trend.'}
            </p>
          </>
        )}
      </section>

      <section
        className={`${styles.section} ${styles.peakSection}`}
        aria-labelledby="owner-analytics-peak"
      >
        <h3 id="owner-analytics-peak" className={styles.sectionTitle}>
          Peak demand
        </h3>
        {loading ? (
          renderState('Loading…')
        ) : error ? (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        ) : peakMatrix.max === 0 && !peakTimes?.length ? (
          renderState('No booking activity in this period.')
        ) : (
          <>
            <div className={styles.heatmapWrap}>
              <svg
                viewBox={`0 0 ${HM.vbW} ${HM.vbH}`}
                className={styles.heatmapSvgFit}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={peakHeatmapDescription}
              >
                <title>{peakHeatmapDescription}</title>
                {peakMatrix.rows.map((_row, ri) => (
                  <text
                    key={`l-${ri}`}
                    x={HM.labelX}
                    y={HM.startY + ri * HM.rowPitch + HM.cellH * 0.72}
                    fontSize="3.2"
                    fill="var(--color-text)"
                    fontWeight="700"
                  >
                    {HEATMAP_DOW_LABELS[ri]}
                  </text>
                ))}
                {peakMatrix.rows.map((row, ri) =>
                  row.map((v, ci) => {
                    const t = peakMatrix.max > 0 ? 0.2 + (v / peakMatrix.max) * 0.88 : 0.2;
                    return (
                      <rect
                        key={`c-${ri}-${ci}`}
                        x={HM.gridX + ci * HM.colPitch}
                        y={HM.startY + ri * HM.rowPitch}
                        width={HM.cellW}
                        height={HM.cellH}
                        rx={0.65}
                        fill="var(--color-primary)"
                        opacity={t}
                        stroke="rgba(38, 111, 156, 0.25)"
                        strokeWidth={0.22}
                      />
                    );
                  }),
                )}
                {HEATMAP_HOUR_LABELS.map((h) => {
                  const col = h / 2;
                  const cx = HM.gridX + col * HM.colPitch + HM.cellW / 2;
                  return (
                    <text
                      key={`h-${h}`}
                      x={cx}
                      y={HM.vbH - 1.5}
                      fontSize="2.75"
                      fill="var(--color-text)"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {h}h
                    </text>
                  );
                })}
              </svg>
            </div>
            <p className={styles.chartHint}>Mon–Sun rows; 2-hour columns (24h).</p>
          </>
        )}
      </section>
    </div>
  );
};

export default OwnerAnalyticsPanels;

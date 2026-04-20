import React, { useEffect, useMemo, useState } from 'react';
import { ownerAnalyticsService, SpecialOffersResult } from '../../services/ownerAnalyticsService';
import panelStyles from '../OwnerAnalyticsPanels/OwnerAnalyticsPanels.module.css';
import styles from './OwnerSpecialOffersPanel.module.css';

export interface OwnerSpecialOffersPanelProps {
  businessId: number | null;
  from: string;
  to: string;
}

const formatDiscount = (d: number | null | undefined): string => {
  if (d == null) return '—';
  return `${d.toFixed(1)}%`;
};

const formatCurrency = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '€0.00';
  return `€${Number(n).toFixed(2)}`;
};

const OwnerSpecialOffersPanel: React.FC<OwnerSpecialOffersPanelProps> = ({
  businessId,
  from,
  to,
}) => {
  const [data, setData] = useState<SpecialOffersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
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
        const res = await ownerAnalyticsService.getSpecialOffers(params);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load special offers');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const renderState = (body: React.ReactNode) => (
    <p className={panelStyles.stateMessage} role="status">
      {body}
    </p>
  );

  const topOffers = data?.topOffers ?? [];
  const maxUsage = topOffers.reduce((m, o) => Math.max(m, o.usageCount), 0);

  return (
    <div className={panelStyles.column}>
      <section
        className={`${panelStyles.section} ${panelStyles.performanceSection}`}
        aria-labelledby="owner-analytics-offers-summary"
      >
        <h3 id="owner-analytics-offers-summary" className={panelStyles.sectionTitle}>
          Special offers
        </h3>
        {loading ? (
          renderState('Loading…')
        ) : error ? (
          <p className={panelStyles.errorMessage} role="alert">
            {error}
          </p>
        ) : !data ? (
          renderState('No data yet.')
        ) : data.activeOfferCount === 0 ? (
          renderState('No active promotions on your items yet. Set a promotion price on products or services to see impact here.')
        ) : (
          <>
            <div className={panelStyles.kpiGrid}>
              <div className={panelStyles.kpi}>
                <div className={panelStyles.kpiLabel}>Active offers</div>
                <div className={panelStyles.kpiValue}>{data.activeOfferCount}</div>
              </div>
              <div className={panelStyles.kpi}>
                <div className={panelStyles.kpiLabel}>Uses in period</div>
                <div className={panelStyles.kpiValue}>{data.totalUsageCount}</div>
              </div>
              <div className={panelStyles.kpi}>
                <div className={panelStyles.kpiLabel}>Promoted revenue</div>
                <div className={`${panelStyles.kpiValue} ${panelStyles.kpiValueAccent}`}>
                  {formatCurrency(data.totalPromotedRevenue)}
                </div>
              </div>
              <div className={panelStyles.kpi}>
                <div className={panelStyles.kpiLabel}>Avg discount</div>
                <div className={panelStyles.kpiValue}>
                  {formatDiscount(data.averageDiscountPercent)}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section
        className={`${panelStyles.section} ${panelStyles.peakSection}`}
        aria-labelledby="owner-analytics-offers-top"
      >
        <h3 id="owner-analytics-offers-top" className={panelStyles.sectionTitle}>
          Top offers
        </h3>
        {loading ? (
          renderState('Loading…')
        ) : error ? null : !data || data.activeOfferCount === 0 ? (
          renderState('—')
        ) : topOffers.length === 0 ? (
          renderState('No offer usage in this period.')
        ) : (
          <ul className={styles.offerList}>
            {topOffers.map((o) => {
              const width = maxUsage > 0 ? Math.max(4, Math.round((o.usageCount / maxUsage) * 100)) : 4;
              return (
                <li key={`${o.itemType}-${o.itemId}`} className={styles.offerRow}>
                  <div className={styles.offerHead}>
                    <span className={styles.offerName} title={o.itemName}>
                      {o.itemName}
                    </span>
                    <span className={styles.offerMeta}>
                      <span className={styles.offerTag} data-type={o.itemType}>
                        {o.itemType}
                      </span>
                      <span className={styles.offerDiscount}>-{formatDiscount(o.discountPercent)}</span>
                    </span>
                  </div>
                  <div className={styles.offerBar} aria-hidden>
                    <span className={styles.offerBarFill} style={{ width: `${width}%` }} />
                  </div>
                  <div className={styles.offerFoot}>
                    <span className={styles.offerUsage}>
                      {o.usageCount} {o.itemType === 'service' ? 'bookings' : 'orders'}
                    </span>
                    <span className={styles.offerRevenue}>{formatCurrency(o.promotedRevenue)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default OwnerSpecialOffersPanel;

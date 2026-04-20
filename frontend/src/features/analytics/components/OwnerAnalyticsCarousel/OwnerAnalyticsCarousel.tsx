import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDefaultAnalyticsRange } from '../../ownerAnalyticsDisplayUtils';
import OwnerPerformancePanel from '../OwnerPerformancePanel/OwnerPerformancePanel';
import OwnerSpecialOffersPanel from '../OwnerSpecialOffersPanel/OwnerSpecialOffersPanel';
import OwnerReviewsPanel from '../OwnerReviewsPanel/OwnerReviewsPanel';
import panelStyles from '../OwnerAnalyticsPanels/OwnerAnalyticsPanels.module.css';
import type { OwnerAnalyticsStoreOption } from './ownerAnalyticsCarouselTypes';
import styles from './OwnerAnalyticsCarousel.module.css';

export type { OwnerAnalyticsStoreOption } from './ownerAnalyticsCarouselTypes';

export interface OwnerAnalyticsCarouselProps {
  stores: OwnerAnalyticsStoreOption[];
}

interface CarouselPage {
  id: string;
  title: string;
  render: (filters: { businessId: number | null; from: string; to: string }) => React.ReactNode;
}

const OwnerAnalyticsCarousel: React.FC<OwnerAnalyticsCarouselProps> = ({ stores }) => {
  const defaultRange = useMemo(() => getDefaultAnalyticsRange(), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const pages: CarouselPage[] = useMemo(
    () => [
      {
        id: 'performance',
        title: 'Performance & peak',
        render: ({ businessId: bId, from: f, to: t }) => (
          <OwnerPerformancePanel businessId={bId} from={f} to={t} />
        ),
      },
      {
        id: 'offers',
        title: 'Special offers',
        render: ({ businessId: bId, from: f, to: t }) => (
          <OwnerSpecialOffersPanel businessId={bId} from={f} to={t} />
        ),
      },
      {
        id: 'reviews',
        title: 'Reviews',
        render: ({ businessId: bId, from: f, to: t }) => (
          <OwnerReviewsPanel businessId={bId} from={f} to={t} stores={stores} />
        ),
      },
    ],
    [stores],
  );

  const onFromChange = (v: string) => {
    setFrom(v);
    if (v > to) setTo(v);
  };

  const onToChange = (v: string) => {
    setTo(v);
    if (v < from) setFrom(v);
  };

  const goPrev = useCallback(() => {
    setCurrentPage((p) => (p - 1 + pages.length) % pages.length);
  }, [pages.length]);

  const goNext = useCallback(() => {
    setCurrentPage((p) => (p + 1) % pages.length);
  }, [pages.length]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('input, select, textarea, button')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        goPrev();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        goNext();
        e.preventDefault();
      }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  const filters = { businessId, from, to };

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Analytics pages"
    >
      <div className={panelStyles.filterBar} role="search" aria-label="Analytics filters">
        <div className={panelStyles.filterGroup}>
          <label className={panelStyles.filterLabel} htmlFor="owner-analytics-store">
            Store
          </label>
          <select
            id="owner-analytics-store"
            className={panelStyles.filterSelect}
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
        <div className={panelStyles.filterGroup}>
          <label className={panelStyles.filterLabel} htmlFor="owner-analytics-from">
            From
          </label>
          <input
            id="owner-analytics-from"
            type="date"
            className={panelStyles.filterDate}
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </div>
        <div className={panelStyles.filterGroup}>
          <label className={panelStyles.filterLabel} htmlFor="owner-analytics-to">
            To
          </label>
          <input
            id="owner-analytics-to"
            type="date"
            className={panelStyles.filterDate}
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.frame}>
        <button
          type="button"
          className={`${styles.chevron} ${styles.chevronPrev}`}
          onClick={goPrev}
          aria-label={`Previous page (${pages[(currentPage - 1 + pages.length) % pages.length].title})`}
        >
          <span aria-hidden>‹</span>
        </button>

        <div
          ref={viewportRef}
          className={styles.viewport}
          tabIndex={0}
          aria-live="polite"
        >
          <div
            className={styles.track}
            style={{ transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * 0.4}rem))` }}
          >
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className={styles.slide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} of ${pages.length}: ${page.title}`}
                aria-hidden={idx !== currentPage}
              >
                {page.render(filters)}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.chevron} ${styles.chevronNext}`}
          onClick={goNext}
          aria-label={`Next page (${pages[(currentPage + 1) % pages.length].title})`}
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Analytics pages">
        {pages.map((page, idx) => (
          <button
            key={page.id}
            type="button"
            role="tab"
            aria-selected={idx === currentPage}
            aria-label={page.title}
            className={`${styles.dot} ${idx === currentPage ? styles.dotActive : ''}`}
            onClick={() => setCurrentPage(idx)}
          >
            <span className={styles.dotLabel}>{page.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OwnerAnalyticsCarousel;

import React, { useMemo } from 'react';
import styles from './PaginationBar.module.css';

type PageItem = number | 'dots';

function buildPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'dots', total];
  }
  if (current >= total - 3) {
    return [1, 'dots', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'dots', current - 1, current, current + 1, 'dots', total];
}

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** `compact` / `inline`: smaller controls; `inline` fits one row with search + filter */
  size?: 'default' | 'compact' | 'inline';
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  size = 'default',
}) => {
  const items = useMemo(
    () => buildPageItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  if (totalPages <= 1) return null;

  const barClass = [
    styles.bar,
    size === 'compact' ? styles.compact : '',
    size === 'inline' ? styles.inline : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={barClass} aria-label="Pagination">
      <button
        type="button"
        className={styles.navBtn}
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      <div className={styles.pages}>
        {items.map((item, idx) =>
          item === 'dots' ? (
            <span key={`dots-${idx}`} className={styles.ellipsis} aria-hidden>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${styles.pageBtn} ${currentPage === item ? styles.pageBtnActive : ''}`}
              disabled={disabled}
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={currentPage === item ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        className={styles.navBtn}
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

export default PaginationBar;

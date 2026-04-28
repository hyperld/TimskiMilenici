import React from 'react';
import styles from './StoreFilters.module.css';

export type FilterMode = 'stores' | 'products' | 'services' | 'offers';

interface StoreFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  mode?: FilterMode;
  /** Shown inside the filter bar (e.g. compact pagination) */
  pagination?: React.ReactNode;
  /** "Near me" toggle — rendered for the stores tab only when this prop is set. */
  nearMe?: {
    active: boolean;
    loading?: boolean;
    onToggle: () => void;
    label?: string;
  };
  /**
   * "Top" toggle — rendered for stores / products / services tabs when this
   * prop is set. When active, the listing fetches the popularity-ranked list
   * (top by rating / sales / bookings depending on the tab).
   */
  top?: {
    active: boolean;
    loading?: boolean;
    onToggle: () => void;
  };
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  mode = 'stores',
  pagination,
  nearMe,
  top,
}) => {
  const topLabels: Record<FilterMode, string> = {
    stores: 'Top rated',
    products: 'Top sellers',
    services: 'Most booked',
    offers: 'Top offers',
  };
  const searchPlaceholders: Record<FilterMode, string> = {
    stores: 'Search stores...',
    products: 'Search products...',
    services: 'Search services...',
    offers: 'Search offers...',
  };

  const renderFilterDropdown = () => {
    if (mode === 'stores') {
      return (
        <div className={styles.selectWrap}>
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Types</option>
            <option value="Supplies">Supplies</option>
            <option value="Veterinary">Veterinary</option>
            <option value="Grooming">Grooming</option>
            <option value="Daycare">Daycare</option>
          </select>
        </div>
      );
    }

    if (mode === 'offers') {
      return (
        <div className={styles.selectWrap}>
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Offers</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
          </select>
        </div>
      );
    }

    if (mode === 'products') {
      return (
        <div className={styles.selectWrap}>
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Products</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      );
    }

    return (
      <div className={styles.selectWrap}>
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="All">All Services</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    );
  };

  return (
    <div className={styles.filtersBar}>
      <div className={styles.filtersCore}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            🔍
          </span>
          <input
            type="search"
            placeholder={searchPlaceholders[mode]}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
            autoComplete="off"
          />
        </div>
        {renderFilterDropdown()}
        {top && (mode === 'stores' || mode === 'products' || mode === 'services') ? (
          <button
            type="button"
            className={`${styles.topBtn} ${top.active ? styles.topBtnActive : ''}`}
            onClick={top.onToggle}
            disabled={top.loading}
            aria-pressed={top.active}
            title={top.active ? `Showing ${topLabels[mode].toLowerCase()}` : `Show ${topLabels[mode].toLowerCase()}`}
          >
            <span aria-hidden className={styles.topStar}>★</span>
            <span>{top.loading ? 'Loading…' : topLabels[mode]}</span>
          </button>
        ) : null}
        {(mode === 'stores' || mode === 'offers') && nearMe ? (
          <button
            type="button"
            className={`${styles.nearMeBtn} ${nearMe.active ? styles.nearMeBtnActive : ''}`}
            onClick={nearMe.onToggle}
            disabled={nearMe.loading}
            aria-pressed={nearMe.active}
          >
            <span aria-hidden>📍</span>
            <span>{nearMe.loading ? 'Locating…' : nearMe.label ?? 'Near me'}</span>
          </button>
        ) : null}
      </div>
      {pagination ? <div className={styles.paginationSlot}>{pagination}</div> : null}
    </div>
  );
};

export default StoreFilters;

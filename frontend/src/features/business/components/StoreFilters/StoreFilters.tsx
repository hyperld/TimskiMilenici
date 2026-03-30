import React from 'react';
import styles from './StoreFilters.module.css';

export type FilterMode = 'stores' | 'products' | 'services';

interface StoreFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  mode?: FilterMode;
  /** Shown inside the filter bar (e.g. compact pagination) */
  pagination?: React.ReactNode;
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  mode = 'stores',
  pagination,
}) => {
  const searchPlaceholders: Record<FilterMode, string> = {
    stores: 'Search stores...',
    products: 'Search products...',
    services: 'Search services...',
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
      </div>
      {pagination ? <div className={styles.paginationSlot}>{pagination}</div> : null}
    </div>
  );
};

export default StoreFilters;

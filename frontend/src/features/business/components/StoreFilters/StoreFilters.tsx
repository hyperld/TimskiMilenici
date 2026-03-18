import React from 'react';
import styles from './StoreFilters.module.css';

export type FilterMode = 'stores' | 'products' | 'services';

interface StoreFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  mode?: FilterMode;
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  mode = 'stores',
}) => {
  const searchPlaceholders: Record<FilterMode, string> = {
    stores: 'Search stores...',
    products: 'Search products...',
    services: 'Search services...',
  };

  const renderFilterDropdown = () => {
    if (mode === 'stores') {
      return (
        <div className={styles.filterGroup}>
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
        <div className={styles.filterGroup}>
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
      <div className={styles.filterGroup}>
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
    <div className={styles.filtersCentered}>
      <div className={styles.filterGroup}>
        <input
          type="text"
          placeholder={searchPlaceholders[mode]}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      {renderFilterDropdown()}
    </div>
  );
};

export default StoreFilters;

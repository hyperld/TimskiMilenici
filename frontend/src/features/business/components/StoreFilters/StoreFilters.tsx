import React from 'react';
import styles from './StoreFilters.module.css';

interface StoreFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange
}) => {
  return (
    <div className={styles.filtersCentered}>
      <div className={styles.filterGroup}>
        <input 
          type="text" 
          placeholder="Search stores..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
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
    </div>
  );
};

export default StoreFilters;

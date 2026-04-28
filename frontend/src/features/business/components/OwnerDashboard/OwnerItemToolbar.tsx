import React from 'react';
import styles from '../OwnerStoreToolbar/OwnerStoreToolbar.module.css';
import localStyles from './OwnerItemToolbar.module.css';

interface StoreOption {
  id: number;
  name: string;
}

interface OwnerItemToolbarProps {
  stores: StoreOption[];
  selectedStoreId: number | null;
  onStoreFilterChange: (storeId: number | null) => void;
  pagination?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  dateRange?: { from: string; to: string };
  onDateRangeChange?: (from: string, to: string) => void;
}

const OwnerItemToolbar: React.FC<OwnerItemToolbarProps> = ({
  stores,
  selectedStoreId,
  onStoreFilterChange,
  pagination,
  onAdd,
  addLabel,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.addSlot}>
        <select
          className={styles.addStoreBtn}
          value={selectedStoreId ?? ''}
          onChange={(e) => onStoreFilterChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {dateRange && onDateRangeChange && (
        <div className={localStyles.dateRangeSlot}>
          <input
            type="date"
            className={localStyles.dateInput}
            value={dateRange.from}
            onChange={(e) => onDateRangeChange(e.target.value, dateRange.to)}
          />
          <span className={localStyles.dateSep}>–</span>
          <input
            type="date"
            className={localStyles.dateInput}
            value={dateRange.to}
            onChange={(e) => onDateRangeChange(dateRange.from, e.target.value)}
          />
        </div>
      )}

      {onAdd && (
        <button type="button" className={styles.addStoreBtn} onClick={onAdd}>
          {addLabel || '+ Add'}
        </button>
      )}

      {pagination ? <div className={styles.paginationSlot}>{pagination}</div> : null}
    </div>
  );
};

export default OwnerItemToolbar;

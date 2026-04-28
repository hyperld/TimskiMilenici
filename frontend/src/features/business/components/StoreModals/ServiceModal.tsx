import React from 'react';
import styles from './Modal.module.css';
import Button from '../../../../shared/components/Button/Button';

interface StoreOption {
  id: number;
  name: string;
}

interface ServiceModalProps {
  itemFormData: any;
  setItemFormData: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  stores?: StoreOption[];
}

const ServiceModal: React.FC<ServiceModalProps> = ({ itemFormData, setItemFormData, onSave, onClose, stores }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItemFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const isEdit = itemFormData?.id && itemFormData.id.toString().indexOf('temp-') === -1;
  const showStoreSelect = !isEdit && stores && stores.length > 0;

  if (!itemFormData) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>{isEdit ? 'Edit' : 'Add'} Service</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeBtn}>&times;</Button>
        </header>
        <form onSubmit={onSave} className={styles.modalForm}>
          {showStoreSelect && (
            <div className={styles.formGroup}>
              <label>Store</label>
              <select name="businessId" value={itemFormData.businessId || ''} onChange={handleChange} required>
                <option value="" disabled>Select a store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.formGroup}>
            <label>Name</label>
            <input name="name" value={itemFormData.name} onChange={handleChange} required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Original Price ($)</label>
              <input type="number" step="0.01" name="originalPrice" value={itemFormData.originalPrice} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Duration (min)</label>
              <input type="number" name="durationMinutes" value={itemFormData.durationMinutes || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Special offer price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="promotionPrice"
                value={itemFormData.promotionPrice || ''}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Promote</label>
              <label className={styles.inlineCheckbox}>
                <input
                  type="checkbox"
                  checked={!!itemFormData.promoted}
                  onChange={(e) =>
                    setItemFormData((prev: any) => ({ ...prev, promoted: e.target.checked }))
                  }
                />
                <span>Show in Special Offers</span>
              </label>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Capacity (per slot)</label>
            <input type="number" name="capacity" value={itemFormData.capacity || ''} onChange={handleChange} placeholder="e.g. 1" />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea name="description" value={itemFormData.description} onChange={handleChange} rows={3}></textarea>
          </div>
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Service</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;

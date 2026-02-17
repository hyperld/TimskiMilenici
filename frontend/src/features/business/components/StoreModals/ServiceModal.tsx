import React from 'react';
import styles from './Modal.module.css';
import Button from '../../../../shared/components/Button/Button';

interface ServiceModalProps {
  itemFormData: any;
  setItemFormData: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ itemFormData, setItemFormData, onSave, onClose }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItemFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const isEdit = itemFormData?.id && itemFormData.id.toString().indexOf('temp-') === -1;

  if (!itemFormData) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>{isEdit ? 'Edit' : 'Add'} Service</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeBtn}>&times;</Button>
        </header>
        <form onSubmit={onSave} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input name="name" value={itemFormData.name} onChange={handleChange} required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Price ($)</label>
              <input type="number" step="0.01" name="price" value={itemFormData.price} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Duration (min)</label>
              <input type="number" name="durationMinutes" value={itemFormData.durationMinutes || ''} onChange={handleChange} required />
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

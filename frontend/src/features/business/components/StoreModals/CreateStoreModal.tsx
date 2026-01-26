import React from 'react';
import styles from './Modal.module.css';
import Button from '../../../../shared/components/Button/Button';

interface CreateStoreModalProps {
  newStore: any;
  setNewStore: (store: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const CreateStoreModal: React.FC<CreateStoreModalProps> = ({ newStore, setNewStore, onSubmit, onClose }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStore((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Add New Store</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeBtn}>&times;</Button>
        </header>
        <form onSubmit={onSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Store Name</label>
            <input name="name" value={newStore.name} onChange={handleChange} required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Type</label>
              <select name="type" value={newStore.type} onChange={handleChange}>
                <option value="Supplies">Supplies</option>
                <option value="Grooming">Grooming</option>
                <option value="Vet">Vet Care</option>
                <option value="Training">Training</option>
                <option value="Cafe">Pet Cafe</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Location (City)</label>
              <input name="location" value={newStore.location} onChange={handleChange} required />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Address</label>
            <input name="address" value={newStore.address} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea name="description" value={newStore.description} onChange={handleChange} rows={3}></textarea>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Contact Email</label>
              <input type="email" name="contactEmail" value={newStore.contactEmail} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Contact Phone</label>
              <input name="contactPhone" value={newStore.contactPhone} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Main Image URL</label>
            <input name="mainImageUrl" value={newStore.mainImageUrl} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Store</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoreModal;

import React, { useState } from 'react';
import styles from './Modal.module.css';
import Button from '../../../../shared/components/Button/Button';
import { businessService } from '../../services/businessService';

interface CreateStoreModalProps {
  newStore: any;
  setNewStore: (store: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const CreateStoreModal: React.FC<CreateStoreModalProps> = ({ newStore, setNewStore, onSubmit, onClose }) => {
  const [imageUploading, setImageUploading] = useState(false);
  const imageList = newStore.imageUrls ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStore((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setImageUploading(true);
    try {
      const { url } = await businessService.uploadImage(file);
      setNewStore((prev: any) => {
        const urls = prev.imageUrls ?? [];
        const next = [...urls, url];
        const main = prev.mainImageUrl || (next.length === 1 ? url : undefined);
        return { ...prev, imageUrls: next, mainImageUrl: main ?? prev.mainImageUrl };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setNewStore((prev: any) => {
      const urls = prev.imageUrls ?? [];
      const removedUrl = urls[index];
      const next = urls.filter((_: string, i: number) => i !== index);
      const newMain = prev.mainImageUrl === removedUrl ? (next[0] ?? '') : prev.mainImageUrl;
      return { ...prev, imageUrls: next, mainImageUrl: newMain };
    });
  };

  const handleSetMainImage = (url: string) => {
    setNewStore((prev: any) => ({ ...prev, mainImageUrl: url }));
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setImageUploading(true);
    try {
      const { url } = await businessService.uploadImage(file);
      setNewStore((prev: any) => {
        const urls = prev.imageUrls ?? [];
        const next = urls.includes(url) ? urls : [...urls, url];
        return { ...prev, imageUrls: next, mainImageUrl: url };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveMainImage = () => {
    setNewStore((prev: any) => ({ ...prev, mainImageUrl: '' }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Add New Store</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeBtn}>&times;</Button>
        </header>

        {/* Main image – upload from laptop, same as Manage Store */}
        <div className={styles.mainImageWrap}>
          <div className={styles.mainImageBox}>
            {newStore.mainImageUrl ? (
              <img src={newStore.mainImageUrl} alt="Main store" className={styles.mainImageImg} />
            ) : (
              <div className={styles.mainImagePlaceholder}>No main image</div>
            )}
            <div className={styles.mainImageOverlay}>
              <label className={styles.mainImageLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  disabled={imageUploading}
                  className={styles.addImageInput}
                />
                <span className={styles.mainImageBtn}>
                  {imageUploading ? 'Uploading…' : newStore.mainImageUrl ? 'Change' : 'Add main image'}
                </span>
              </label>
              {newStore.mainImageUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveMainImage} className={styles.mainImageRemoveBtn}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Store Name</label>
            <input name="name" value={newStore.name} onChange={handleChange} required />
          </div>
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
            <label>Street address</label>
            <input name="street" value={newStore.street} onChange={handleChange} placeholder="e.g. 123 Main St" required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>City</label>
              <input name="city" value={newStore.city} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Postal code</label>
              <input name="postalCode" value={newStore.postalCode} onChange={handleChange} placeholder="e.g. 11000" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Country</label>
            <input name="country" value={newStore.country} onChange={handleChange} placeholder="e.g. Serbia" required />
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

          <div className={styles.manageSection} style={{ marginTop: '1.5rem' }}>
            <div className={styles.sectionHeader}>
              <h3>Store images</h3>
              <label className={styles.addImageLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  disabled={imageUploading}
                  className={styles.addImageInput}
                />
                <span className={styles.addImageBtn}>{imageUploading ? 'Uploading…' : '+ Add image'}</span>
              </label>
            </div>
            {imageList.length === 0 ? (
              <p className={styles.noImages}>No images yet. Add one above or use the main image box.</p>
            ) : (
              <div className={styles.imagesGrid}>
                {imageList.map((url: string, index: number) => (
                  <div key={`${url}-${index}`} className={styles.imageCard}>
                    <img src={url} alt="" className={styles.imageThumb} />
                    <div className={styles.imageActions}>
                      {newStore.mainImageUrl === url ? (
                        <span className={styles.mainBadge}>Main</span>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleSetMainImage(url)}>
                          Set as main
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveImage(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

import React, { useState } from 'react';
import styles from './Modal.module.css';
import Button from '../../../../shared/components/Button/Button';
import ItemModal from "./ItemModal";

interface ManageStoreModalProps {
  editingStore: any;
  onUpdate: (updatedStore: any, itemsToSave: any[], itemsToDelete: {id: number, type: string}[]) => Promise<void>;
  onClose: () => void;
}

const ManageStoreModal: React.FC<ManageStoreModalProps> = ({ 
  editingStore, 
  onUpdate, 
  onClose
}) => {
  const [localStore, setLocalStore] = useState({...editingStore});
  const [loading, setLoading] = useState(false);
  
  // Local track of items to save/delete
  const [itemsToSave, setItemsToSave] = useState<any[]>([]);
  const [itemsToDelete, setItemsToDelete] = useState<{id: number, type: string}[]>([]);

  // Item form state (moved from parent to here for better isolation if needed, 
  // but let's see if we can just manage the localStore's products/services arrays)
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    price: '',
    description: '',
    type: 'product',
    stockQuantity: '',
    capacity: '',
    durationMinutes: '',
    id: null as any
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalStore((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleOpenItem = (type: string, item?: any) => {
    if (item) {
      setItemFormData({
        name: item.name,
        price: item.price.toString(),
        description: item.description || '',
        type: type,
        stockQuantity: item.stockQuantity?.toString() || '',
        capacity: item.capacity?.toString() || '',
        durationMinutes: item.durationMinutes?.toString() || '',
        id: item.id
      });
    } else {
      setItemFormData({
        name: '',
        price: '',
        description: '',
        type: type,
        stockQuantity: '',
        capacity: '',
        durationMinutes: '',
        id: `temp-${Date.now()}` // Temporary ID for local tracking
      });
    }
    setShowItemModal(true);
  };

  const handleLocalSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const typeKey = itemFormData.type === 'product' ? 'products' : 'services';
    
    // Update localStore
    setLocalStore((prev: any) => {
      const items = [...(prev[typeKey] || [])];
      const index = items.findIndex(i => i.id === itemFormData.id);
      
      const newItem = {
        ...itemFormData,
        price: parseFloat(itemFormData.price),
        stockQuantity: itemFormData.stockQuantity ? parseInt(itemFormData.stockQuantity) : undefined,
        durationMinutes: itemFormData.durationMinutes ? parseInt(itemFormData.durationMinutes) : undefined,
        capacity: itemFormData.capacity ? parseInt(itemFormData.capacity) : undefined,
      };

      if (index > -1) {
        items[index] = newItem;
      } else {
        items.push(newItem);
      }
      return { ...prev, [typeKey]: items };
    });

    // Add to itemsToSave (tracking for backend)
    setItemsToSave(prev => {
      const existing = prev.filter(i => !(i.id === itemFormData.id && i.type === itemFormData.type));
      return [...existing, itemFormData];
    });

    setShowItemModal(false);
  };

  const handleLocalDeleteItem = (type: string, itemId: any) => {
    const typeKey = type === 'product' ? 'products' : 'services';
    
    setLocalStore((prev: any) => ({
      ...prev,
      [typeKey]: (prev[typeKey] || []).filter((i: any) => i.id !== itemId)
    }));

    // If it's a real item (not temp), track it for deletion
    if (itemId && (typeof itemId === 'number' || itemId.toString().startsWith('temp-') === false)) {
      setItemsToDelete(prev => [...prev, { id: itemId, type }]);
    }
    
    // Also remove from itemsToSave if it was there
    setItemsToSave(prev => prev.filter(i => !(i.id === itemId && i.type === type)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(localStore, itemsToSave, itemsToDelete);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Manage Store: {localStore.name}</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeBtn}>&times;</Button>
        </header>
        
        <div className={styles.modalForm}>
          <h3>Basic Information</h3>
          <div className={styles.formGroup}>
            <label>Store Name</label>
            <input name="name" value={localStore.name} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Address</label>
            <input name="address" value={localStore.address} onChange={handleChange} required />
          </div>
        </div>

        <div className={styles.modalForm} style={{ paddingTop: 0 }}>
          <div className={styles.manageSection}>
            <div className={styles.sectionHeader}>
              <h3>Products</h3>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleOpenItem('product')}
              >
                + Add Product
              </Button>
            </div>
            <div className={styles.itemsList}>
              {(localStore.products || []).map((product: any) => (
                <div key={product.id} className={styles.itemEntry}>
                  <div className={styles.itemInfo}>
                    <h4>{product.name}</h4>
                    <p>${product.price} | Stock: {product.stockQuantity}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenItem('product', product)}>✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleLocalDeleteItem('product', product.id)}>🗑️</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.manageSection}>
            <div className={styles.sectionHeader}>
              <h3>Services</h3>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleOpenItem('service')}
              >
                + Add Service
              </Button>
            </div>
            <div className={styles.itemsList}>
              {(localStore.services || []).map((service: any) => (
                <div key={service.id} className={styles.itemEntry}>
                  <div className={styles.itemInfo}>
                    <h4>{service.name}</h4>
                    <p>${service.price} | {service.durationMinutes} min</p>
                  </div>
                  <div className={styles.itemActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenItem('service', service)}>✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleLocalDeleteItem('service', service.id)}>🗑️</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formActions} style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update Store Info'}
          </Button>
        </div>

        {showItemModal && (
          <ItemModal 
            itemFormData={itemFormData}
            setItemFormData={setItemFormData}
            onSave={handleLocalSaveItem}
            onClose={() => setShowItemModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ManageStoreModal;

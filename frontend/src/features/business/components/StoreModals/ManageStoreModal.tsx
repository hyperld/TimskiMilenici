import React, { useState, useMemo, useEffect } from 'react';
import styles from './Modal.module.css';
import Button from '../../../../shared/components/Button/Button';
import ItemModal from "./ItemModal";
import Calendar from '../../../booking/components/Calendar/Calendar';
import BookingInfo from '../../../booking/components/BookingInfo/BookingInfo';
import {
  bookingService,
  buildBookedTimesByDate,
  buildFullDates,
  buildBookedSlotUserByDate,
  parseBookingDateTime
} from '../../../booking/services/bookingService';
import { businessService } from '../../services/businessService';

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
  const [localStore, setLocalStore] = useState(() => ({
    ...editingStore,
    imageUrls: editingStore.imageUrls ?? editingStore.images ?? [],
    images: editingStore.images ?? editingStore.imageUrls ?? []
  }));
  const [imageUploading, setImageUploading] = useState(false);
  const imageList = localStore.imageUrls ?? localStore.images ?? [];
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

  // Booking & availability state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const today = useMemo(() => new Date(), []);
  const [visibleYear, setVisibleYear] = useState<number>(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState<number>(today.getMonth()); // 0-11
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedSlotBookings, setSelectedSlotBookings] = useState<any[]>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [filterByDate, setFilterByDate] = useState<string | null>(null);

  const serviceIds = useMemo(() => (localStore?.services || [])
    .map((s: any) => s?.id)
    .filter((id: any) => typeof id === 'number'), [localStore?.services]);

  const generateTimeSlots = useMemo(() => {
    const slots: string[] = [];
    const start = 9; // 09:00
    const end = 20; // until 19:30 inclusive
    for (let hour = start; hour < end; hour++) {
      for (const min of ['00', '30']) {
        slots.push(`${hour.toString().padStart(2, '0')}:${min}`);
      }
    }
    return slots;
  }, []);

  const monthStartEnd = (year: number, month: number) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { start: fmt(start), end: fmt(end) };
  };

  // Fetch store bookings when modal opens (by store id = editingStore.id)
  useEffect(() => {
    const storeId = editingStore?.id ?? localStore?.id;
    if (storeId == null || (typeof storeId !== 'number' && typeof storeId !== 'string')) return;
    const sid = typeof storeId === 'string' ? parseInt(storeId, 10) : storeId;
    if (isNaN(sid)) return;
    const startDate = new Date(visibleYear, visibleMonth - 1, 1);
    const endDate = new Date(visibleYear, visibleMonth + 2, 0);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setBookingsLoading(true);
    bookingService
      .getBookingsByStoreInRange(sid, fmt(startDate), fmt(endDate))
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [editingStore?.id, localStore?.id, visibleYear, visibleMonth]);

  const bookedTimesByDate = useMemo(() => buildBookedTimesByDate(bookings), [bookings]);
  const storeFullDates = useMemo(
    () => buildFullDates(bookedTimesByDate, generateTimeSlots.length),
    [bookedTimesByDate, generateTimeSlots.length]
  );
  const bookedSlotUserByDate = useMemo(() => buildBookedSlotUserByDate(bookings), [bookings]);
  const datesWithBookings = useMemo(() => Object.keys(bookedTimesByDate).sort(), [bookedTimesByDate]);
  const reservedSlotsForSelected = selectedDate ? (bookedTimesByDate[selectedDate] || []) : [];
  const slotUserForSelected = selectedDate ? (bookedSlotUserByDate[selectedDate] || {}) : {};

  const totalBookingsCount = useMemo(
    () => (bookings || []).filter((b: any) => b.status !== 'CANCELLED').length,
    [bookings]
  );

  const bookingsFiltered = useMemo(() => {
    const list = (bookings || []).filter((b: any) => b.status !== 'CANCELLED');
    if (!filterByDate) return list;
    return list.filter((b: any) => {
      const p = parseBookingDateTime(b.bookingTime);
      return p && p.dateStr === filterByDate;
    });
  }, [bookings, filterByDate]);

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  /** Get all bookings for a given date and time slot. */
  const getBookingsForSlot = (dateStr: string, timeStr: string) =>
    (bookings || []).filter((b: any) => {
      if (b.status === 'CANCELLED') return false;
      const p = parseBookingDateTime(b.bookingTime);
      return p && p.dateStr === dateStr && p.timeStr === timeStr;
    });

  const handleSlotClick = (slot: string) => {
    if (!selectedDate) return;
    const slotBookings = getBookingsForSlot(selectedDate, slot);
    if (slotBookings.length > 0) {
      setSelectedSlotBookings(slotBookings);
      setSelectedSlotTime(slot);
    }
  };

  const handleBookingItemClick = (booking: any) => {
    setSelectedSlotBookings([booking]);
    setSelectedSlotTime(null);
  };

  const handleCloseBookingInfo = () => {
    setSelectedSlotBookings([]);
    setSelectedSlotTime(null);
  };

  const handleDismissBooking = async (bookingId: number) => {
    await bookingService.deleteBooking(bookingId);
    setBookings((prev) => prev.filter((b: any) => b.id !== bookingId));
    handleCloseBookingInfo();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalStore((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setImageUploading(true);
    try {
      const { url } = await businessService.uploadImage(file);
      setLocalStore((prev: any) => {
        const urls = prev.imageUrls ?? prev.images ?? [];
        const next = [...urls, url];
        const main = prev.mainImageUrl || (next.length === 1 ? url : undefined);
        return { ...prev, imageUrls: next, images: next, mainImageUrl: main };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setLocalStore((prev: any) => {
      const urls = prev.imageUrls ?? prev.images ?? [];
      const removedUrl = urls[index];
      const next = urls.filter((_: string, i: number) => i !== index);
      const newMain = prev.mainImageUrl === removedUrl ? (next[0] ?? null) : prev.mainImageUrl;
      return { ...prev, imageUrls: next, images: next, mainImageUrl: newMain };
    });
  };

  const handleSetMainImage = (url: string) => {
    setLocalStore((prev: any) => ({ ...prev, mainImageUrl: url }));
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setImageUploading(true);
    try {
      const { url } = await businessService.uploadImage(file);
      setLocalStore((prev: any) => {
        const urls = prev.imageUrls ?? prev.images ?? [];
        const next = urls.includes(url) ? urls : [...urls, url];
        return { ...prev, imageUrls: next, images: next, mainImageUrl: url };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveMainImage = () => {
    setLocalStore((prev: any) => ({ ...prev, mainImageUrl: null }));
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

        {/* Main image – centered, hover to add/update/remove */}
        <div className={styles.mainImageWrap}>
          <div className={styles.mainImageBox}>
            {localStore.mainImageUrl ? (
              <img src={localStore.mainImageUrl} alt="Main store" className={styles.mainImageImg} />
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
                  {imageUploading ? 'Uploading…' : localStore.mainImageUrl ? 'Change' : 'Add main image'}
                </span>
              </label>
              {localStore.mainImageUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveMainImage} className={styles.mainImageRemoveBtn}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
        
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
              <p className={styles.noImages}>No images yet. Add one above.</p>
            ) : (
              <div className={styles.imagesGrid}>
                {imageList.map((url: string, index: number) => (
                  <div key={`${url}-${index}`} className={styles.imageCard}>
                    <img src={url} alt="" className={styles.imageThumb} />
                    <div className={styles.imageActions}>
                      {localStore.mainImageUrl === url ? (
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

          {/* Bookings & availability - fetched by store id */}
          <div className={styles.manageSection}>
            <div className={styles.sectionHeader}>
              <h3>Bookings & availability</h3>
            </div>
            {bookingsLoading ? (
              <p className={styles.bookingsLoading}>Loading bookings…</p>
            ) : (
              <>
                <div className={styles.bookingsListWrap}>
                  <div className={styles.bookingsListHeader}>
                    <h4 className={styles.bookingsSubtitle}>Reserved bookings</h4>
                    <div className={styles.bookingsListHeaderRight}>
                      <span className={styles.bookingsCounter}>
                        {totalBookingsCount} booking{totalBookingsCount !== 1 ? 's' : ''}
                        {filterByDate && (
                          <span className={styles.bookingsCounterFiltered}>
                            {' '}({bookingsFiltered.length} on {formatDayLabel(filterByDate)})
                          </span>
                        )}
                      </span>
                      {datesWithBookings.length > 0 && (
                        <div className={styles.dayNav}>
                          <button
                            type="button"
                            className={`${styles.dayNavBtn} ${!filterByDate ? styles.dayNavBtnActive : ''}`}
                            onClick={() => setFilterByDate(null)}
                          >
                            All
                          </button>
                          {datesWithBookings.map((d) => (
                            <button
                              key={d}
                              type="button"
                              className={`${styles.dayNavBtn} ${filterByDate === d ? styles.dayNavBtnActive : ''}`}
                              onClick={() => setFilterByDate(d)}
                              title={d}
                            >
                              {formatDayLabel(d)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {totalBookingsCount === 0 ? (
                    <p className={styles.noBookings}>No bookings in this period.</p>
                  ) : bookingsFiltered.length === 0 ? (
                    <p className={styles.noBookings}>No bookings on {filterByDate ? formatDayLabel(filterByDate) : 'this day'}.</p>
                  ) : (
                    <ul className={styles.bookingsList}>
                      {[...bookingsFiltered]
                        .sort((a: any, b: any) => (a.bookingTime || '').localeCompare(b.bookingTime || ''))
                        .map((b: any) => {
                          const parsed = parseBookingDateTime(b.bookingTime);
                          const dateStr = parsed?.dateStr ?? '';
                          const timeStr = parsed?.timeStr ?? '--:--';
                          const userName = b.user?.fullName || b.user?.username || 'Guest';
                          const serviceName = b.service?.name || 'Service';
                          return (
                            <li
                              key={b.id}
                              className={`${styles.bookingItem} ${styles.bookingItemClickable}`}
                              onClick={() => handleBookingItemClick(b)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && handleBookingItemClick(b)}
                            >
                              <span className={styles.bookingDate}>{dateStr}</span>
                              <span className={styles.bookingTime}>{timeStr}</span>
                              <span className={styles.bookingUser}>{userName}</span>
                              <span className={styles.bookingService}>{serviceName}</span>
                              <span className={styles.bookingItemHint}>Click for details</span>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>

                <div className={styles.calendarSection}>
                  <h4 className={styles.bookingsSubtitle}>Calendar (red = day fully reserved, dot = has bookings)</h4>
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={(dateStr) => setSelectedDate(dateStr)}
                    unavailableDates={storeFullDates}
                    datesWithBookings={datesWithBookings}
                  />
                </div>

                {selectedDate && (
                  <div className={styles.timeSlotsSection}>
                    <h4 className={styles.bookingsSubtitle}>Time slots for {selectedDate} (yellow = reserved — click for details)</h4>
                    <div className={styles.timeSlotsGrid}>
                      {generateTimeSlots.map((slot) => {
                        const isReserved = reservedSlotsForSelected.includes(slot);
                        const userNames = slotUserForSelected[slot];
                        const tooltip = isReserved && userNames?.length
                          ? `Booked by: ${userNames.join(', ')} — click for details`
                          : isReserved
                            ? 'Reserved — click for details'
                            : 'Available';
                        return isReserved ? (
                          <button
                            key={slot}
                            type="button"
                            className={`${styles.timeSlotChip} ${styles.timeSlotInformative}`}
                            title={tooltip}
                            onClick={() => handleSlotClick(slot)}
                          >
                            {slot}
                          </button>
                        ) : (
                          <span key={slot} className={styles.timeSlotChip}>
                            {slot}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
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

      {/* BookingInfo overlay: sibling of modalContent so it's not clipped by scroll; fixed to viewport */}
      {selectedSlotBookings.length > 0 && (
        <div className={styles.bookingInfoOverlay} onClick={handleCloseBookingInfo} role="dialog" aria-modal="true" aria-label="Booking details">
          <div className={styles.bookingInfoPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bookingInfoHeader}>
              <h4>
                {selectedSlotBookings.length === 1 ? 'Booking details' : `${selectedSlotBookings.length} bookings at this slot`}
                {selectedSlotTime && selectedDate && ` — ${selectedDate} ${selectedSlotTime}`}
              </h4>
              <Button variant="ghost" size="sm" onClick={handleCloseBookingInfo} className={styles.closeBtn}>
                ×
              </Button>
            </div>
            <div className={styles.bookingInfoList}>
              {selectedSlotBookings.map((b: any) => (
                <BookingInfo
                  key={b.id}
                  booking={b}
                  onClose={handleCloseBookingInfo}
                  showCancelAction={true}
                  onCancelBooking={handleDismissBooking}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStoreModal;

import React from 'react';
import styles from './StoreDetails.module.css';
import Button from '../../../../shared/components/Button/Button';

interface StoreDetailsProps {
  store: any;
  currentImageIndex: number;
  onNextImage: () => void;
  onPrevImage: () => void;
  onDotClick: (index: number) => void;
  onBookService: (id: string) => void;
  onBack: () => void;
}

const StoreDetails: React.FC<StoreDetailsProps> = ({
  store,
  currentImageIndex,
  onNextImage,
  onPrevImage,
  onDotClick,
  onBookService,
  onBack
}) => {
  const services = store.services || [];
  const products = store.products || [];

  return (
    <div className={styles.storeDetailsContent}>
      <div className={styles.backNavigation}>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Return
        </Button>
      </div>
      
      <header className={styles.storeHeader}>
        <div className={styles.storeMainInfo}>
          <h1>{store.name}</h1>
          <span className={styles.storeBadge}>{store.type || store.category}</span>
        </div>
      </header>

      <section className={styles.topSection}>
        <div className={styles.storeImageGallery}>
          {store.images && store.images.length > 0 ? (
            <div className={styles.sliderContainer}>
              <div className={styles.sliderImageWrapper}>
                {store.images[currentImageIndex] && (
                  <img src={store.images[currentImageIndex]} alt={`${store.name} ${currentImageIndex + 1}`} />
                )}
              </div>
              {store.images.length > 1 && (
                <>
                  <Button variant="ghost" className={`${styles.sliderBtn} ${styles.prev}`} onClick={onPrevImage}>❮</Button>
                  <Button variant="ghost" className={`${styles.sliderBtn} ${styles.next}`} onClick={onNextImage}>❯</Button>
                  <div className={styles.sliderDots}>
                    {store.images.map((_: any, idx: number) => (
                      <span 
                        key={idx} 
                        className={`${styles.dot} ${idx === currentImageIndex ? styles.active : ''}`}
                        onClick={() => onDotClick(idx)}
                      ></span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.imagePlaceholderLarge}>🏬</div>
          )}
        </div>
        
        <div className={styles.aboutUsSection}>
          <h3>About Us</h3>
          <p>{store.description}</p>
        </div>
      </section>

      <div className={styles.middleSection}>
        {services.length > 0 && (
          <section className={styles.servicesSection}>
            <h3>Services</h3>
            <div className={styles.itemsGrid}>
              {services.map((service: any) => (
                <div key={service.id} className={styles.itemCard}>
                  <div className={styles.itemImage}>
                    <span className={styles.itemPlaceholder}>✂️</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <h4>{service.name}</h4>
                    <p className={styles.itemDuration}>{service.durationMinutes} min</p>
                    <p className={styles.itemPrice}>${service.price}</p>
                    <Button 
                      fullWidth
                      onClick={() => onBookService(service.id)}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className={styles.productsSection}>
            <h3>Products</h3>
            <div className={styles.itemsGrid}>
              {products.map((product: any) => (
                <div key={product.id} className={styles.itemCard}>
                  <div className={styles.itemImage}>
                    <span className={styles.itemPlaceholder}>📦</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <h4>{product.name}</h4>
                    <p className={styles.itemStock}>Stock: {product.stockQuantity}</p>
                    <p className={styles.itemPrice}>${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className={styles.bottomSection}>
        <div className={styles.contactInfo}>
          <h3>Contact & Location</h3>
          <p className={styles.storeAddress}>📍 {store.address}</p>
          <div className={styles.contactDetails}>
            <p>📞 {store.contactPhone || 'N/A'}</p>
            <p>✉️ {store.contactEmail || 'N/A'}</p>
          </div>
        </div>
        
        <div className={styles.storeMapSection}>
          <div className={styles.mapPlaceholder}>
            <span className={styles.mapPin}>📍</span>
            <p>Map View of {store.address}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StoreDetails;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PetServiceWithStore } from '../../types';
import Button from '../../../../shared/components/Button/Button';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  service: PetServiceWithStore;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const navigate = useNavigate();

  const duration = service.durationMinutes ?? service.duration;

  const maxDescriptionLength = 80;
  const description =
    service.description && service.description.length > maxDescriptionLength
      ? `${service.description.slice(0, maxDescriptionLength)}...`
      : service.description;

  return (
    <div className={styles.card}>
      <div className={styles.imageArea}>
        <div className={styles.imagePlaceholder}>✂️</div>
      </div>
      <div className={styles.info}>
        <span
          className={styles.storeName}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/store/${service.businessId}`);
          }}
        >
          {service.businessName}
        </span>
        <h3 className={styles.serviceName}>{service.name}</h3>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.meta}>
          <span className={styles.price}>${Number(service.price).toFixed(2)}</span>
          {duration != null && (
            <span className={styles.duration}>{duration} min</span>
          )}
        </div>
        <Button
          size="sm"
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/booking/${service.id}`, {
              state: { service, storeId: service.businessId },
            });
          }}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;

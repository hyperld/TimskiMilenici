import React, { useEffect, useState } from 'react';
import { reviewService, type ReviewItem, type ReviewsResponse } from '../../services/reviewService';
import { isUserStored } from '../../../auth/utils/tokenStorage';
import styles from './StoreReviews.module.css';

interface StoreReviewsProps {
  storeId: number;
}

const StoreReviews: React.FC<StoreReviewsProps> = ({ storeId }) => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canWriteReview = isUserStored();

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await reviewService.getByBusiness(storeId);
      setData(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteReview) return;
    try {
      setSubmitting(true);
      const created = await reviewService.addReview(storeId, rating, comment.trim());
      setComment('');
      // Optimistically update local state so the new review appears immediately
      setData((prev) => {
        const prevReviews = prev?.reviews ?? [];
        const newReviews = [created, ...prevReviews];
        const newCount = (prev?.count ?? 0) + 1;
        const totalBefore = (prev?.averageRating ?? 0) * (prev?.count ?? 0);
        const totalAfter = totalBefore + created.rating;
        const averageRating = newCount > 0 ? totalAfter / newCount : 0;
        return {
          reviews: newReviews,
          count: newCount,
          averageRating,
        };
      });
      // Optionally refresh from backend to pick up any server-side changes
      // but we don't rely on it for immediate UI feedback.
      // void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (value >= i) {
        stars.push(<span key={i} className={styles.starFull}>★</span>);
      } else if (value >= i - 0.5) {
        stars.push(<span key={i} className={styles.starHalf}>★</span>);
      } else {
        stars.push(<span key={i} className={styles.starEmpty}>☆</span>);
      }
    }
    return stars;
  };

  return (
    <section className={styles.reviewsSection}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>Store reviews</h3>
          {data && (
            <p className={styles.subtitle}>
              {data.count} review{data.count !== 1 ? 's' : ''} •{' '}
              {data.count > 0 ? `${data.averageRating.toFixed(1)} / 5` : 'No rating yet'}
            </p>
          )}
        </div>
        {data && data.count > 0 && (
          <div className={styles.starSummary}>
            {renderStars(data.averageRating)}
          </div>
        )}
      </header>

      {loading && <p className={styles.info}>Loading reviews…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {data && data.reviews.length > 0 && (
        <ul className={styles.list}>
          {data.reviews.map((r: ReviewItem) => (
            <li key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <span className={styles.reviewer}>
                  {r.user.fullName || r.user.username || 'User'}
                </span>
                <span className={styles.reviewStars}>
                  {renderStars(r.rating)}
                </span>
              </div>
              <p className={styles.reviewMeta}>
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
              {r.comment && <p className={styles.reviewText}>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.formWrap}>
        {canWriteReview ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                Your rating
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.5}
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                />
              </label>
              <div className={styles.liveRating}>
                <span className={styles.liveStars}>{renderStars(rating)}</span>
                <span className={styles.liveValue}>{rating.toFixed(1)}</span>
              </div>
            </div>
            <label className={styles.label}>
              Your review (optional)
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Share your experience with this store…"
              />
            </label>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        ) : (
          <p className={styles.info}>
            Sign in to leave a review for this store.
          </p>
        )}
      </div>
    </section>
  );
};

export default StoreReviews;


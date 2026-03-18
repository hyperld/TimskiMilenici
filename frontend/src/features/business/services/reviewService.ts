import { getStoredToken } from '../../auth/utils/tokenStorage';

const API_URL = 'http://localhost:8080/api/reviews';

const getAuthToken = () => getStoredToken();

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ReviewUser {
  fullName?: string;
  username?: string;
}

export interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: ReviewUser;
}

export interface ReviewsResponse {
  reviews: ReviewItem[];
  averageRating: number;
  count: number;
}

export const reviewService = {
  getByBusiness: async (businessId: number): Promise<ReviewsResponse> => {
    try {
      const res = await fetch(`${API_URL}/business/${businessId}`);
      if (!res.ok) {
        // Treat 404 or empty as "no reviews yet" instead of hard error
        if (res.status === 404) {
          return { reviews: [], averageRating: 0, count: 0 };
        }
        throw new Error('Failed to load reviews');
      }
      const json = await res.json().catch(() => null);
      if (!json) {
        return { reviews: [], averageRating: 0, count: 0 };
      }

      // Backend may return either { reviews, averageRating, count } or a raw array of reviews.
      if (Array.isArray(json)) {
        const reviews = json as any[];
        const count = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        const averageRating = count > 0 ? sum / count : 0;
        return { reviews, averageRating, count };
      }

      const { reviews, averageRating, count } = json as any;
      const safeReviews = Array.isArray(reviews) ? reviews : [];
      const safeCount =
        typeof count === 'number' ? count : safeReviews.length;
      const safeAvg =
        typeof averageRating === 'number' && !Number.isNaN(averageRating)
          ? averageRating
          : safeCount > 0
            ? safeReviews.reduce(
                (acc: number, r: any) => acc + (Number(r.rating) || 0),
                0
              ) / safeCount
            : 0;

      return {
        reviews: safeReviews,
        averageRating: safeAvg,
        count: safeCount,
      };
    } catch {
      // Fallback to empty data if anything unexpected happens
      return { reviews: [], averageRating: 0, count: 0 };
    }
  },

  addReview: async (
    businessId: number,
    rating: number,
    comment: string
  ): Promise<ReviewItem> => {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const tokenHeaders = authHeaders();
    const headers: Record<string, string> = {
      ...baseHeaders,
      ...(tokenHeaders as Record<string, string>),
    };
    const res = await fetch(`${API_URL}/business/${businessId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rating, comment }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit review');
    }
    return await res.json();
  },
};


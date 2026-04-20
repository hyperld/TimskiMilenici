import { useCallback, useEffect, useRef, useState } from 'react';
import { useGeolocated } from 'react-geolocated';

export type UserLocationStatus =
  | 'idle'
  | 'prompting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export interface UserCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps' | 'ip';
}

interface UseUserLocationResult {
  coords: UserCoords | null;
  status: UserLocationStatus;
  error: string | null;
  requestLocation: () => void;
  clearLocation: () => void;
}

const IP_FALLBACK_URL = 'https://ipapi.co/json/';

/**
 * Hook that wraps react-geolocated to surface a simple consent-driven API.
 * Callers first invoke {@link requestLocation} (typically from a consent
 * modal) to trigger the browser permission prompt. On denial/unavailability
 * it falls back to a best-effort IP-based lookup when {@code ipFallback} is
 * true.
 */
export function useUserLocation(ipFallback: boolean = true): UseUserLocationResult {
  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const ipFallbackAttempted = useRef(false);

  const {
    coords: geoCoords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
    getPosition,
  } = useGeolocated({
    positionOptions: { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    userDecisionTimeout: 15_000,
    suppressLocationOnMount: true,
    watchPosition: false,
  });

  const attemptIpFallback = useCallback(async () => {
    if (!ipFallback || ipFallbackAttempted.current) return;
    ipFallbackAttempted.current = true;
    try {
      const res = await fetch(IP_FALLBACK_URL);
      if (!res.ok) throw new Error('ip lookup failed');
      const data = await res.json();
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setCoords({
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
        });
        setStatus('granted');
        setError(null);
      }
    } catch {
      // Silent; status already reflects the denial.
    }
  }, [ipFallback]);

  useEffect(() => {
    if (!active) return;

    if (!isGeolocationAvailable) {
      setStatus('unavailable');
      setError('Geolocation is not supported by this browser.');
      void attemptIpFallback();
      return;
    }

    if (isGeolocationEnabled === false) {
      setStatus('denied');
      setError('Location permission denied.');
      void attemptIpFallback();
      return;
    }

    if (positionError) {
      setStatus('denied');
      setError(positionError.message || 'Could not read location.');
      void attemptIpFallback();
      return;
    }

    if (geoCoords) {
      setCoords({
        latitude: geoCoords.latitude,
        longitude: geoCoords.longitude,
        accuracy: geoCoords.accuracy,
        source: 'gps',
      });
      setStatus('granted');
      setError(null);
    }
  }, [
    active,
    geoCoords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
    attemptIpFallback,
  ]);

  const requestLocation = useCallback(() => {
    setError(null);
    setActive(true);
    setStatus('prompting');
    ipFallbackAttempted.current = false;
    try {
      getPosition();
    } catch {
      // getPosition throws if geolocation is not available; handled by effect.
    }
  }, [getPosition]);

  const clearLocation = useCallback(() => {
    setActive(false);
    setCoords(null);
    setStatus('idle');
    setError(null);
    ipFallbackAttempted.current = false;
  }, []);

  return { coords, status, error, requestLocation, clearLocation };
}

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './StoreMap.module.css';

const DEFAULT_CENTER: [number, number] = [-74.5, 40];
const DEFAULT_ZOOM = 12;

interface StoreMapProps {
  address: string;
  storeName?: string;
}

async function geocodeAddress(
  address: string,
  token: string
): Promise<[number, number] | null> {
  if (!address?.trim()) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data.features?.[0];
  const center = feature?.center;
  if (Array.isArray(center) && center.length >= 2) return [center[0], center[1]];
  return null;
}

const StoreMap: React.FC<StoreMapProps> = ({ address, storeName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setError('Mapbox token not configured');
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;
    mapboxgl.accessToken = token;

    const initMap = (center: [number, number]) => {
      if (cancelled || !containerRef.current) return;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: DEFAULT_ZOOM,
      });
      mapRef.current = map;
      const marker = new mapboxgl.Marker()
        .setLngLat(center)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            storeName ? `<strong>${escapeHtml(storeName)}</strong><br/>${escapeHtml(address)}` : escapeHtml(address)
          )
        )
        .addTo(map);
      markerRef.current = marker;
    };

    (async () => {
      try {
        const coords = await geocodeAddress(address, token);
        if (cancelled) return;
        initMap(coords ?? DEFAULT_CENTER);
      } catch (e) {
        if (!cancelled) {
          setError('Could not load map');
          initMap(DEFAULT_CENTER);
        }
      }
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [address, storeName]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <span className={styles.mapPin}>📍</span>
          <p>{error}</p>
          <p className={styles.address}>{address}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.mapContainer} aria-label="Store location map" />;
};

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default StoreMap;

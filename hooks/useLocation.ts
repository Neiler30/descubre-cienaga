import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { TOURIST_PLACES, TouristPlace } from '@/constants/places';
import { APP_CONFIG } from '@/constants/config';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function useLocation() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<(TouristPlace & { distance: number })[]>([]);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (e) {
      setError('Error requesting location permission');
      return false;
    }
  }, []);

  const updateNearby = useCallback((loc: LocationState) => {
    const nearby = TOURIST_PLACES.map((place) => ({
      ...place,
      distance: getDistance(loc.latitude, loc.longitude, place.latitude, place.longitude),
    }))
      .filter((place) => place.distance <= APP_CONFIG.proximityRadius * 3)
      .sort((a, b) => a.distance - b.distance);
    setNearbyPlaces(nearby);
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      setIsLoading(true);
      const granted = await requestPermission();
      if (!granted) {
        setIsLoading(false);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const loc = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          accuracy: current.coords.accuracy,
        };
        setLocation(loc);
        updateNearby(loc);

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
          (pos) => {
            const updated = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            setLocation(updated);
            updateNearby(updated);
          }
        );
      } catch (e) {
        setError('Error getting location');
      } finally {
        setIsLoading(false);
      }
    };

    startTracking();
    return () => {
      subscription?.remove();
    };
  }, [requestPermission, updateNearby]);

  const getDistanceTo = useCallback(
    (latitude: number, longitude: number): number | null => {
      if (!location) return null;
      return getDistance(location.latitude, location.longitude, latitude, longitude);
    },
    [location]
  );

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  return {
    location,
    hasPermission,
    isLoading,
    error,
    nearbyPlaces,
    getDistanceTo,
    formatDistance,
    requestPermission,
  };
}

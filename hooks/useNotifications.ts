import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TouristPlace } from '@/constants/places';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false);
  const notifiedPlaces = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    requestPermission();

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('proximity', {
        name: 'Lugares Cercanos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }
  }, [requestPermission]);

  const sendProximityNotification = useCallback(
    async (place: TouristPlace, distance: number) => {
      if (!hasPermission) return;
      if (notifiedPlaces.current.has(place.id)) return;

      notifiedPlaces.current.add(place.id);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📍 Estás cerca de ${place.name}`,
          body: `A ${Math.round(distance)}m · Escanea el QR para descubrir su historia`,
          data: { placeId: place.id },
          sound: true,
        },
        trigger: null,
      });

      setTimeout(() => {
        notifiedPlaces.current.delete(place.id);
      }, 5 * 60 * 1000);
    },
    [hasPermission]
  );

  const sendQRNotification = useCallback(
    async (placeName: string) => {
      if (!hasPermission) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ QR Escaneado exitosamente',
          body: `Has desbloqueado la experiencia de ${placeName}`,
          sound: true,
        },
        trigger: null,
      });
    },
    [hasPermission]
  );

  const sendAchievementNotification = useCallback(
    async (badge: string, points: number) => {
      if (!hasPermission) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Nuevo logro desbloqueado!',
          body: `${badge} · +${points} puntos`,
          sound: true,
        },
        trigger: null,
      });
    },
    [hasPermission]
  );

  return {
    hasPermission,
    requestPermission,
    sendProximityNotification,
    sendQRNotification,
    sendAchievementNotification,
  };
}

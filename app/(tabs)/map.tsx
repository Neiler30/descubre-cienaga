import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { TOURIST_PLACES, TouristPlace, getCategoryColor, CATEGORIES, PlaceCategory } from '@/constants/places';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { StarRating } from '@/components/ui/StarRating';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApp } from '@/hooks/useApp';
import { useLocation } from '@/hooks/useLocation';
import { APP_CONFIG } from '@/constants/config';

const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 90;

// Lazy-load MapView only on native platforms to avoid web bundling issues
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  Circle = RNMaps.Circle;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
}

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9CA3AF' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B7280' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0d1a2e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1F2937' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#111827' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1D4ED8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0D1A3A' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3B82F6' }],
  },
];

// Web fallback: list view of places
function WebMapFallback({
  filteredPlaces,
  selectedCategory,
  setSelectedCategory,
  onSelectPlace,
}: {
  filteredPlaces: TouristPlace[];
  selectedCategory: PlaceCategory | 'all';
  setSelectedCategory: (c: PlaceCategory | 'all') => void;
  onSelectPlace: (place: TouristPlace) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.webHeader, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.topBarInner}>
          <MaterialIcons name="location-on" size={20} color={Colors.primary} />
          <Text style={styles.topBarText}>Ciénaga, Magdalena</Text>
          <Text style={styles.topBarCount}>{filteredPlaces.length} lugares</Text>
        </View>
      </View>

      {/* Map unavailable banner */}
      <View style={styles.webBanner}>
        <MaterialIcons name="map" size={18} color={Colors.gold} />
        <Text style={styles.webBannerText}>Mapa disponible solo en la app móvil</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.filterText, selectedCategory === 'all' && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              selectedCategory === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color },
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === cat.id && { color: cat.color, fontWeight: FontWeight.bold },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Places list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + Spacing.lg, gap: Spacing.sm }}>
        {filteredPlaces.map((place) => (
          <TouchableOpacity key={place.id} style={styles.webPlaceRow} onPress={() => onSelectPlace(place)} activeOpacity={0.85}>
            <Image source={{ uri: place.imageUrl }} style={styles.webPlaceImg} contentFit="cover" transition={200} />
            <View style={styles.webPlaceInfo}>
              <CategoryBadge category={place.category} />
              <Text style={styles.webPlaceName}>{place.name}</Text>
              <Text style={styles.webPlaceDesc} numberOfLines={2}>{place.shortDescription}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <StarRating rating={place.rating} size={14} />
                <View style={styles.webPointsBadge}>
                  <MaterialIcons name="stars" size={12} color={Colors.gold} />
                  <Text style={styles.webPointsText}>{place.points} pts</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isVisited } = useApp();
  const { location, getDistanceTo, formatDistance } = useLocation();
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');
  const mapRef = useRef<any>(null);

  const filteredPlaces =
    selectedCategory === 'all'
      ? TOURIST_PLACES
      : TOURIST_PLACES.filter((p) => p.category === selectedCategory);

  const handleMarkerPress = (place: TouristPlace) => {
    setSelectedPlace(place);
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude - 0.004,
        longitude: place.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      400
    );
  };

  const handleCenterUser = () => {
    if (location) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    }
  };

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <>
        <WebMapFallback
          filteredPlaces={filteredPlaces}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onSelectPlace={setSelectedPlace}
        />
        {/* Place Modal */}
        <Modal
          visible={selectedPlace !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedPlace(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedPlace(null)} />
            {selectedPlace && (
              <View style={[styles.modalCard, { paddingBottom: insets.bottom + Spacing.md }]}>
                <Image
                  source={{ uri: selectedPlace.imageUrl }}
                  style={styles.modalImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['transparent', Colors.bgCard]}
                  style={styles.modalImageGradient}
                />
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPlace(null)}>
                  <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <CategoryBadge category={selectedPlace.category} size="md" />
                      <Text style={styles.modalName}>{selectedPlace.name}</Text>
                    </View>
                    <View style={styles.modalPoints}>
                      <MaterialIcons name="stars" size={18} color={Colors.gold} />
                      <Text style={styles.modalPointsText}>{selectedPlace.points} pts</Text>
                    </View>
                  </View>

                  <View style={styles.modalMeta}>
                    <StarRating rating={selectedPlace.rating} size={16} />
                    <View style={styles.distRow}>
                      <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
                      <Text style={styles.distText}>{selectedPlace.visitDuration}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalDescription} numberOfLines={3}>
                    {selectedPlace.shortDescription}
                  </Text>

                  <View style={styles.modalActions}>
                    <GradientButton
                      title="Explorar"
                      gradient={Colors.gradientBlue}
                      onPress={() => {
                        setSelectedPlace(null);
                        router.push(`/place/${selectedPlace.id}` as any);
                      }}
                      style={{ flex: 1 }}
                    />
                    <TouchableOpacity
                      style={styles.arBtn}
                      onPress={() => {
                        setSelectedPlace(null);
                        router.push(`/ar/${selectedPlace.id}` as any);
                      }}
                    >
                      <LinearGradient colors={Colors.gradientPurple as [string, string]} style={styles.arBtnGradient}>
                        <MaterialIcons name="view-in-ar" size={22} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </>
    );
  }

  // Native map view
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={MAP_STYLE}
        initialRegion={APP_CONFIG.mapInitialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {filteredPlaces.map((place) => {
          const color = getCategoryColor(place.category);
          const visited = isVisited(place.id);
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              onPress={() => handleMarkerPress(place)}
            >
              <View style={[styles.marker, { borderColor: color + '88', backgroundColor: visited ? color + '33' : Colors.bgCard }]}>
                <View style={[styles.markerDot, { backgroundColor: color }]} />
              </View>
            </Marker>
          );
        })}

        {location && (
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={APP_CONFIG.proximityRadius}
            fillColor="rgba(59,130,246,0.08)"
            strokeColor="rgba(59,130,246,0.3)"
            strokeWidth={1}
          />
        )}
      </MapView>

      {/* Top Overlay */}
      <View style={[styles.topBar, { top: insets.top + Spacing.sm }]}>
        <View style={styles.topBarInner}>
          <MaterialIcons name="location-on" size={20} color={Colors.primary} />
          <Text style={styles.topBarText}>Ciénaga, Magdalena</Text>
          <Text style={styles.topBarCount}>{filteredPlaces.length} lugares</Text>
        </View>
      </View>

      {/* Category Filter */}
      <View style={[styles.filterBar, { top: insets.top + 70 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterText, selectedCategory === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                selectedCategory === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat.id && { color: cat.color, fontWeight: FontWeight.bold },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Center Button */}
      <TouchableOpacity
        style={[styles.centerBtn, { bottom: TAB_BAR_HEIGHT + Spacing.md }]}
        onPress={handleCenterUser}
        activeOpacity={0.85}
      >
        <MaterialIcons name="my-location" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Place Modal */}
      <Modal
        visible={selectedPlace !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedPlace(null)} />
          {selectedPlace && (
            <View style={[styles.modalCard, { paddingBottom: insets.bottom + Spacing.md }]}>
              <Image
                source={{ uri: selectedPlace.imageUrl }}
                style={styles.modalImage}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={['transparent', Colors.bgCard]}
                style={styles.modalImageGradient}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPlace(null)}>
                <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <CategoryBadge category={selectedPlace.category} size="md" />
                    <Text style={styles.modalName}>{selectedPlace.name}</Text>
                  </View>
                  <View style={styles.modalPoints}>
                    <MaterialIcons name="stars" size={18} color={Colors.gold} />
                    <Text style={styles.modalPointsText}>{selectedPlace.points} pts</Text>
                  </View>
                </View>

                <View style={styles.modalMeta}>
                  <StarRating rating={selectedPlace.rating} size={16} />
                  {location && (
                    <View style={styles.distRow}>
                      <MaterialIcons name="near-me" size={14} color={Colors.primary} />
                      <Text style={styles.distText}>
                        {formatDistance(getDistanceTo(selectedPlace.latitude, selectedPlace.longitude) || 0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.distRow}>
                    <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
                    <Text style={styles.distText}>{selectedPlace.visitDuration}</Text>
                  </View>
                </View>

                <Text style={styles.modalDescription} numberOfLines={3}>
                  {selectedPlace.shortDescription}
                </Text>

                <View style={styles.modalActions}>
                  <GradientButton
                    title="Explorar"
                    gradient={Colors.gradientBlue}
                    onPress={() => {
                      setSelectedPlace(null);
                      router.push(`/place/${selectedPlace.id}` as any);
                    }}
                    style={{ flex: 1 }}
                  />
                  <TouchableOpacity
                    style={styles.arBtn}
                    onPress={() => {
                      setSelectedPlace(null);
                      router.push(`/ar/${selectedPlace.id}` as any);
                    }}
                  >
                    <LinearGradient colors={Colors.gradientPurple as [string, string]} style={styles.arBtnGradient}>
                      <MaterialIcons name="view-in-ar" size={22} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  // Web header
  webHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgPrimary,
  },
  webBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.gold + '11',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.gold + '33',
  },
  webBannerText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  webPlaceRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  webPlaceImg: {
    width: 80,
    height: 80,
  },
  webPlaceInfo: {
    flex: 1,
    padding: Spacing.sm,
    gap: 4,
  },
  webPlaceName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  webPlaceDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  webPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  webPointsText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  // Native
  topBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(7,11,20,0.85)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  topBarText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  topBarCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  filterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(7,11,20,0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '33',
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  centerBtn: {
    position: 'absolute',
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: height * 0.65,
  },
  modalImage: {
    width: '100%',
    height: 180,
  },
  modalImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  modalName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    marginTop: Spacing.xs,
  },
  modalPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  modalPointsText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  modalMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  modalDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  arBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  arBtnGradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
});

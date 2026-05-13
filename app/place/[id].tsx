import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { TOURIST_PLACES } from '@/constants/places';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { StarRating } from '@/components/ui/StarRating';
import { GradientButton } from '@/components/ui/GradientButton';
import { AudioGuide } from '@/components/feature/AudioGuide';
import { useApp } from '@/hooks/useApp';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.42;

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isVisited, markPlaceVisited } = useApp();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const place = TOURIST_PLACES.find((p) => p.id === id);

  useEffect(() => {
    if (place && !isVisited(place.id)) {
      markPlaceVisited(place.id, place.points);
    }
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  if (!place) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Lugar no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [IMAGE_HEIGHT - 100, IMAGE_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Descubrí ${place.name} en Ciénaga, Magdalena con la app Descubre Ciénaga! ${place.shortDescription}`,
      });
    } catch (e) {}
  };

  const handleAR = () => {
    router.push(`/ar/${place.id}` as any);
  };

  const infoItems = [
    { icon: 'schedule', label: 'Duración', value: place.visitDuration },
    { icon: 'trending-up', label: 'Dificultad', value: place.difficulty.charAt(0).toUpperCase() + place.difficulty.slice(1) },
    { icon: 'stars', label: 'Puntos', value: `${place.points} pts`, color: Colors.gold },
    { icon: 'star', label: 'Calificación', value: `${place.rating}/5`, color: Colors.gold },
  ];

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity, paddingTop: insets.top }]}>
        <Text style={styles.stickyTitle} numberOfLines={1}>{place.name}</Text>
      </Animated.View>

      {/* Back & Share Buttons */}
      <View style={[styles.topButtons, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBtn} onPress={handleShare}>
          <MaterialIcons name="share" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        {/* Hero Image */}
        <Animated.View style={[styles.heroContainer, { transform: [{ scale: imageScale }] }]}>
          <Image
            source={{ uri: place.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', Colors.bgPrimary]}
            style={styles.heroGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <CategoryBadge category={place.category} size="md" />
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.placeAddress}>{place.address}</Text>

            <View style={styles.titleMeta}>
              <StarRating rating={place.rating} size={18} />
              {isVisited(place.id) && (
                <View style={styles.visitedBadge}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.visitedText}>Visitado</Text>
                </View>
              )}
              <View style={styles.pointsBadge}>
                <MaterialIcons name="stars" size={16} color={Colors.gold} />
                <Text style={styles.pointsBadgeText}>{place.points} pts</Text>
              </View>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            {infoItems.map((item) => (
              <View key={item.label} style={styles.infoCard}>
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={item.color || Colors.primary}
                />
                <Text style={[styles.infoValue, item.color ? { color: item.color } : {}]}>
                  {item.value}
                </Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acerca de este lugar</Text>
            <Text style={styles.description}>{place.description}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {place.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Audio Guide - requires auth */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audioguía</Text>
            {isAuthenticated ? (
              <AudioGuide text={place.audioText} placeName={place.name} />
            ) : (
              <TouchableOpacity
                style={styles.audioLockCard}
                onPress={() => router.push('/login')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['rgba(59,130,246,0.15)', 'rgba(139,92,246,0.1)']}
                  style={styles.audioLockGrad}
                >
                  <MaterialIcons name="lock" size={32} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audioLockTitle}>Audioguía bloqueada</Text>
                    <Text style={styles.audioLockSub}>Inicia sesión para escuchar la narración completa de {place.name}</Text>
                  </View>
                  <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.primary} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Badge */}
          <View style={styles.badgeSection}>
            <LinearGradient
              colors={['rgba(139,92,246,0.2)', 'rgba(59,130,246,0.1)']}
              style={styles.badgeCard}
            >
              <Text style={styles.badgeIcon}>{place.badge.split(' ')[0]}</Text>
              <View>
                <Text style={styles.badgeTitle}>{place.badge}</Text>
                <Text style={styles.badgeSubtitle}>Insignia especial de este lugar</Text>
              </View>
            </LinearGradient>
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaSection}>
            <GradientButton
              title="Experiencia AR"
              gradient={Colors.gradientPurple}
              onPress={handleAR}
              size="lg"
            />
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/(tabs)/map')}>
                <MaterialIcons name="near-me" size={18} color={Colors.primary} />
                <Text style={styles.outlineBtnText}>Navegar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/scanner')}>
                <MaterialIcons name="qr-code-scanner" size={18} color={Colors.success} />
                <Text style={[styles.outlineBtnText, { color: Colors.success }]}>Escanear QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: Spacing.xl + 44,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  stickyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    paddingBottom: Spacing.sm,
  },
  topButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 101,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT * 0.5,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  titleSection: {
    gap: Spacing.sm,
  },
  placeName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 36,
  },
  placeAddress: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  titleMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.success + '44',
  },
  visitedText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  pointsBadgeText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 26,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  badgeSection: {},
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.purple + '44',
  },
  badgeIcon: {
    fontSize: 36,
  },
  badgeTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  badgeSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  ctaSection: {
    gap: Spacing.sm,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineBtnText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  audioLockCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  audioLockGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  audioLockTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  audioLockSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 3,
    lineHeight: 18,
  },
  notFound: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },
  backLink: {
    color: Colors.primary,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
});

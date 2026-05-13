import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { CATEGORIES, PlaceCategory } from '@/constants/places';
import { PlaceCard } from '@/components/feature/PlaceCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useApp } from '@/hooks/useApp';
import { useLocation } from '@/hooks/useLocation';
import { useNotifications } from '@/hooks/useNotifications';
import { APP_CONFIG } from '@/constants/config';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 90;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, currentLevel, nextLevel, progressToNextLevel, places } = useApp();
  const { nearbyPlaces, getDistanceTo } = useLocation();
  const { sendProximityNotification } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    nearbyPlaces.forEach((place) => {
      if (place.distance <= APP_CONFIG.proximityRadius) {
        sendProximityNotification(place, place.distance);
      }
    });
  }, [nearbyPlaces]);

  const filteredPlaces =
    selectedCategory === 'all'
      ? places
      : places.filter((p) => p.category === selectedCategory);

  const heroPlace = places[0];
  const featuredPlaces = places.slice(0, 5);

  const quickActions = [
    {
      icon: 'qr-code-scanner',
      label: 'Escanear QR',
      color: Colors.primary,
      gradient: Colors.gradientBlue,
      onPress: () => router.push('/scanner'),
    },
    {
      icon: 'map',
      label: 'Ver Mapa',
      color: Colors.success,
      gradient: Colors.gradientGreen,
      onPress: () => router.push('/(tabs)/map'),
    },
    {
      icon: 'emoji-events',
      label: 'Logros',
      color: Colors.gold,
      gradient: Colors.gradientGold,
      onPress: () => router.push('/(tabs)/achievements'),
    },
    {
      icon: 'person',
      label: 'Perfil',
      color: Colors.purple,
      gradient: Colors.gradientPurple,
      onPress: () => router.push('/(tabs)/profile'),
    },
  ];

  const firstName = user ? user.name.split(' ')[0] : 'Explorador';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md, paddingBottom: TAB_BAR_HEIGHT + Spacing.lg },
        ]}
      >
        {/* Header */}
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
              <Text style={styles.subGreeting}>Explora Ciénaga, Magdalena</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <Image
                source={{ uri: user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest' }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          </View>

          {/* Level & Progress */}
          <View style={styles.levelCard}>
            <LinearGradient
              colors={['rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)']}
              style={styles.levelGradient}
            >
              <View style={styles.levelHeader}>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelIcon}>{currentLevel.icon}</Text>
                  <View>
                    <Text style={styles.levelName}>{currentLevel.name}</Text>
                    <Text style={styles.levelPoints}>{user?.points ?? 0} puntos</Text>
                  </View>
                </View>
                <View style={styles.levelBadge}>
                  <MaterialIcons name="stars" size={18} color={Colors.gold} />
                  <Text style={styles.levelBadgeText}>{user?.points ?? 0}</Text>
                </View>
              </View>
              <View style={styles.progressRow}>
                <ProgressBar progress={progressToNextLevel} height={6} />
                {nextLevel && (
                  <Text style={styles.nextLevelText}>
                    {nextLevel.minPoints - (user?.points ?? 0)} pts para {nextLevel.name}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionBtn}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient as [string, string]}
                  style={styles.actionGradient}
                >
                  <MaterialIcons name={action.icon as any} size={26} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Places */}
        {nearbyPlaces.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.nearbyDot} />
              <Text style={styles.sectionTitle}>Cerca de Ti</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {nearbyPlaces.slice(0, 5).map((place) => {
                const dist = getDistanceTo(place.latitude, place.longitude);
                return (
                  <PlaceCard key={place.id} place={place} distance={dist || undefined} compact />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Featured Places */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destacados</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {featuredPlaces.map((place) => {
              const dist = getDistanceTo(place.latitude, place.longitude);
              return (
                <PlaceCard key={place.id} place={place} distance={dist || undefined} compact />
              );
            })}
          </ScrollView>
        </View>

        {/* Category Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorar por Categoría</Text>
          <View style={styles.categoryOuter}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === 'all' && styles.categoryChipTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && {
                      backgroundColor: cat.color + '33',
                      borderColor: cat.color + '88',
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat.id && { color: cat.color, fontWeight: FontWeight.bold },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Places List */}
        <View style={[styles.section, styles.listSection]}>
          {filteredPlaces.map((place) => {
            const dist = getDistanceTo(place.latitude, place.longitude);
            return (
              <PlaceCard key={place.id} place={place} distance={dist || undefined} />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  subGreeting: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  levelCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  levelGradient: {
    padding: Spacing.md,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelIcon: {
    fontSize: 28,
  },
  levelName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  levelPoints: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  levelBadgeText: {
    color: Colors.gold,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  progressRow: {
    gap: Spacing.xs,
  },
  nextLevelText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nearbyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  actionGradient: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  horizontalScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  categoryOuter: {
    marginHorizontal: -Spacing.md,
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    height: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary + '33',
    borderColor: Colors.primary + '88',
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  listSection: {
    gap: 0,
  },
});

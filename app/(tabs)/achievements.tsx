import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { TOURIST_PLACES, LEVELS } from '@/constants/places';
import { AchievementCard } from '@/components/feature/AchievementCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useApp } from '@/hooks/useApp';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 90;

const ACHIEVEMENTS = [
  {
    id: 'first-visit',
    title: 'Primera Visita',
    description: 'Visita tu primer lugar turístico en Ciénaga',
    icon: '🗺️',
    points: 50,
    gradient: ['#3B82F6', '#1D4ED8'],
    requiredVisits: 1,
  },
  {
    id: 'first-qr',
    title: 'Escáner Novato',
    description: 'Escanea tu primer código QR',
    icon: '📷',
    points: 75,
    gradient: ['#10B981', '#059669'],
    requiredQRs: 1,
  },
  {
    id: 'history-lover',
    title: 'Amante de la Historia',
    description: 'Visita 3 lugares históricos de Ciénaga',
    icon: '🏛️',
    points: 150,
    gradient: ['#F59E0B', '#D97706'],
    requiredVisits: 3,
  },
  {
    id: 'legend-hunter',
    title: 'Cazador de Leyendas',
    description: 'Descubre la Casa del Diablo',
    icon: '👹',
    points: 200,
    gradient: ['#EC4899', '#BE185D'],
    requiredPlace: 'casa-del-diablo',
  },
  {
    id: 'nature-explorer',
    title: 'Explorador Natural',
    description: 'Visita Costa Verde y Laguna Grande',
    icon: '🌿',
    points: 180,
    gradient: ['#10B981', '#8B5CF6'],
    requiredVisits: 2,
  },
  {
    id: 'qr-master',
    title: 'Maestro del QR',
    description: 'Escanea 5 códigos QR diferentes',
    icon: '🔍',
    points: 300,
    gradient: ['#8B5CF6', '#6D28D9'],
    requiredQRs: 5,
  },
  {
    id: 'half-explorer',
    title: 'Medio Explorador',
    description: 'Visita la mitad de los lugares turísticos',
    icon: '⚡',
    points: 400,
    gradient: ['#F59E0B', '#EF4444'],
    requiredVisits: Math.ceil(TOURIST_PLACES.length / 2),
  },
  {
    id: 'full-explorer',
    title: 'Explorador Completo',
    description: 'Visita todos los lugares turísticos de Ciénaga',
    icon: '🏆',
    points: 1000,
    gradient: ['#F59E0B', '#8B5CF6'],
    requiredVisits: TOURIST_PLACES.length,
  },
];

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentLevel, nextLevel, progressToNextLevel } = useApp();

  // Safe defaults for unauthenticated users
  const visitedPlaces = user?.visitedPlaces ?? [];
  const scannedQRs = user?.scannedQRs ?? [];
  const userPoints = user?.points ?? 0;

  const resolvedAchievements = ACHIEVEMENTS.map((a) => {
    let unlocked = false;
    if (a.requiredVisits) {
      unlocked = visitedPlaces.length >= a.requiredVisits;
    } else if (a.requiredQRs) {
      unlocked = scannedQRs.length >= a.requiredQRs;
    } else if (a.requiredPlace) {
      unlocked = visitedPlaces.includes(a.requiredPlace);
    }
    return { ...a, unlocked };
  });

  const unlockedCount = resolvedAchievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: TAB_BAR_HEIGHT + Spacing.lg },
        ]}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Logros y Niveles</Text>

        {/* Level Progress */}
        <LinearGradient
          colors={['rgba(139,92,246,0.2)', 'rgba(59,130,246,0.1)']}
          style={styles.levelCard}
        >
          <View style={styles.levelRow}>
            <Text style={styles.levelIcon}>{currentLevel.icon}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>{currentLevel.name}</Text>
              <Text style={styles.levelPoints}>{userPoints} puntos totales</Text>
            </View>
            {nextLevel && (
              <View style={styles.nextLevelChip}>
                <Text style={styles.nextLevelText}>{nextLevel.icon} {nextLevel.name}</Text>
              </View>
            )}
          </View>
          <ProgressBar progress={progressToNextLevel} gradient={Colors.gradientPurple} height={8} />
          {nextLevel && (
            <Text style={styles.progressLabel}>
              {nextLevel.minPoints - userPoints} pts para el siguiente nivel
            </Text>
          )}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.statIcon}>
              <MaterialIcons name="location-on" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{visitedPlaces.length}</Text>
            <Text style={styles.statLabel}>Visitados</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={Colors.gradientGreen as [string, string]} style={styles.statIcon}>
              <MaterialIcons name="qr-code-scanner" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{scannedQRs.length}</Text>
            <Text style={styles.statLabel}>QRs escaneados</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={Colors.gradientGold as [string, string]} style={styles.statIcon}>
              <MaterialIcons name="emoji-events" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Logros</Text>
          </View>
        </View>

        {/* Levels Roadmap */}
        <Text style={styles.sectionTitle}>Niveles de Explorador</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelsScroll}>
          <View style={styles.levelsRow}>
            {LEVELS.map((level, index) => {
              const isActive = level.name === currentLevel.name;
              const isPast = userPoints >= level.minPoints;
              return (
                <View key={level.name} style={styles.levelStep}>
                  <View
                    style={[
                      styles.levelCircle,
                      isActive && { borderColor: level.color, borderWidth: 2 },
                      isPast && !isActive && { backgroundColor: level.color + '22' },
                    ]}
                  >
                    <Text style={styles.levelStepIcon}>{level.icon}</Text>
                  </View>
                  <Text style={[styles.levelStepName, isActive && { color: level.color }]}>
                    {level.name}
                  </Text>
                  <Text style={styles.levelStepPoints}>{level.minPoints}pts</Text>
                  {index < LEVELS.length - 1 && (
                    <View style={[styles.levelConnector, isPast && { backgroundColor: level.color }]} />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Achievements List */}
        <View style={styles.achievementsHeader}>
          <Text style={styles.sectionTitle}>Logros</Text>
          <Text style={styles.achievementsCount}>
            {unlockedCount}/{resolvedAchievements.length}
          </Text>
        </View>
        {resolvedAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.xs,
  },
  levelCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.purple + '33',
    gap: Spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelIcon: {
    fontSize: 36,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  levelPoints: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  nextLevelChip: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextLevelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  levelsScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  levelsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 0,
  },
  levelStep: {
    alignItems: 'center',
    width: 90,
    position: 'relative',
  },
  levelCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelStepIcon: {
    fontSize: 26,
  },
  levelStepName: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginTop: Spacing.xs,
    width: 80,
  },
  levelStepPoints: {
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  levelConnector: {
    position: 'absolute',
    top: 27,
    left: '60%',
    width: '80%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementsCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  gradient: string[];
}

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <View style={[styles.card, !achievement.unlocked && styles.locked]}>
      <LinearGradient
        colors={achievement.unlocked ? (achievement.gradient as [string, string]) : ['#1F2937', '#374151']}
        style={styles.iconBg}
      >
        <Text style={styles.icon}>{achievement.icon}</Text>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={[styles.title, !achievement.unlocked && styles.lockedText]}>
          {achievement.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {achievement.description}
        </Text>
        <View style={styles.pointsRow}>
          <Text style={styles.points}>+{achievement.points} pts</Text>
          {!achievement.unlocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  locked: {
    opacity: 0.55,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  lockIcon: {
    fontSize: FontSize.sm,
  },
});

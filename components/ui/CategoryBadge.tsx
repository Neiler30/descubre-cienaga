import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlaceCategory, getCategoryColor, getCategoryLabel } from '@/constants/places';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface CategoryBadgeProps {
  category: PlaceCategory;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const color = getCategoryColor(category);
  const label = getCategoryLabel(category);

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: color + '22', borderColor: color + '66' },
      ]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  textMd: {
    fontSize: FontSize.sm,
  },
});

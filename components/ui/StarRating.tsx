import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface StarRatingProps {
  rating: number;
  showNumber?: boolean;
  size?: number;
}

export function StarRating({ rating, showNumber = true, size = 14 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      <MaterialIcons name="star" size={size} color={Colors.gold} />
      {showNumber && (
        <Text style={[styles.text, { fontSize: size - 2 }]}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  text: {
    color: Colors.gold,
    fontWeight: FontWeight.semibold,
  },
});

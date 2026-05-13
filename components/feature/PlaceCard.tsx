import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouristPlace, getCategoryColor } from '@/constants/places';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { StarRating } from '@/components/ui/StarRating';
import { useApp } from '@/hooks/useApp';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.md * 2;

interface PlaceCardProps {
  place: TouristPlace;
  distance?: number;
  onPress?: () => void;
  compact?: boolean;
}

export function PlaceCard({ place, distance, onPress, compact = false }: PlaceCardProps) {
  const router = useRouter();
  const { isVisited } = useApp();
  const visited = isVisited(place.id);
  const categoryColor = getCategoryColor(place.category);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/place/${place.id}` as any);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={handlePress} activeOpacity={0.85}>
        <Image
          source={{ uri: place.imageUrl }}
          style={styles.compactImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.compactGradient}
        />
        <View style={styles.compactContent}>
          <CategoryBadge category={place.category} />
          <Text style={styles.compactName} numberOfLines={2}>{place.name}</Text>
          <View style={styles.compactMeta}>
            <StarRating rating={place.rating} size={12} />
            <View style={styles.pointsBadge}>
              <MaterialIcons name="stars" size={12} color={Colors.gold} />
              <Text style={styles.pointsText}>{place.points}pts</Text>
            </View>
          </View>
        </View>
        {visited && (
          <View style={styles.visitedBadge}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: categoryColor + '33' }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: place.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(7,11,20,0.95)']}
        style={styles.imageGradient}
      />
      <View style={styles.imageContent}>
        <CategoryBadge category={place.category} />
        {visited && (
          <View style={styles.visitedTag}>
            <MaterialIcons name="check-circle" size={14} color={Colors.success} />
            <Text style={styles.visitedText}>Visitado</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
          <View style={styles.pointsChip}>
            <MaterialIcons name="stars" size={14} color={Colors.gold} />
            <Text style={styles.pointsChipText}>{place.points}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {place.shortDescription}
        </Text>

        <View style={styles.footer}>
          <StarRating rating={place.rating} />
          <View style={styles.meta}>
            {distance !== undefined && (
              <View style={styles.metaItem}>
                <MaterialIcons name="near-me" size={12} color={Colors.primary} />
                <Text style={styles.metaText}>
                  {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{place.visitDuration}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  imageContent: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '22',
    borderColor: Colors.success + '66',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  visitedText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.gold + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  pointsChipText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  // Compact styles
  compactCard: {
    width: 180,
    height: 240,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginRight: Spacing.md,
    ...Shadow.md,
  },
  compactImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  compactGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  compactContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  compactName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pointsText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  visitedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
});

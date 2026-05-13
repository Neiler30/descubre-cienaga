import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  gradient?: string[];
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function GradientButton({
  onPress,
  title,
  gradient = Colors.gradientBlue,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}: GradientButtonProps) {
  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.lg };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.wrapper, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { height: heights[size] }]}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={[styles.text, { fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  text: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});

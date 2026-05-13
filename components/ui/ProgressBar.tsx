import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  gradient?: string[];
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  gradient = Colors.gradientBlue,
  style,
  animated = true,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: Math.min(100, Math.max(0, progress)),
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.min(100, Math.max(0, progress)));
    }
  }, [progress, animated, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View style={[styles.fill, { width: widthInterpolated }]}>
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});

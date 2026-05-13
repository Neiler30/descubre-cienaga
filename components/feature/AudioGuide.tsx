import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudio } from '@/hooks/useAudio';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface AudioGuideProps {
  text: string;
  autoPlay?: boolean;
  placeName: string;
}

export function AudioGuide({ text, autoPlay = false, placeName }: AudioGuideProps) {
  const { isSpeaking, isPaused, speak, pause, resume, stop, repeat } = useAudio();

  useEffect(() => {
    if (autoPlay) {
      speak(text);
    }
    return () => {
      stop();
    };
  }, []);

  return (
    <LinearGradient
      colors={[Colors.bgCard, Colors.bgCardAlt]}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name="record-voice-over" size={22} color={Colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Audioguía</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{placeName}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isSpeaking && !isPaused ? Colors.success : Colors.textMuted }]} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={repeat}>
          <MaterialIcons name="replay" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {isSpeaking && !isPaused ? (
          <TouchableOpacity style={styles.playBtn} onPress={pause}>
            <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.playGradient}>
              <MaterialIcons name="pause" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : isPaused ? (
          <TouchableOpacity style={styles.playBtn} onPress={resume}>
            <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.playGradient}>
              <MaterialIcons name="play-arrow" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.playBtn} onPress={() => speak(text)}>
            <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.playGradient}>
              <MaterialIcons name="play-arrow" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.controlBtn} onPress={stop}>
          <MaterialIcons name="stop" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isSpeaking && !isPaused && (
        <View style={styles.waveContainer}>
          {[...Array(7)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveLine,
                { height: 8 + (i % 3) * 8, backgroundColor: Colors.primary + (80 + i * 20).toString(16) },
              ]}
            />
          ))}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  playGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.md,
    height: 32,
  },
  waveLine: {
    width: 4,
    borderRadius: 2,
  },
});

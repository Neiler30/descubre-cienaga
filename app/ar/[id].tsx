import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { TOURIST_PLACES } from '@/constants/places';
import { AudioGuide } from '@/components/feature/AudioGuide';
import { useApp } from '@/hooks/useApp';

const { width, height } = Dimensions.get('window');

const AR_EFFECTS: Record<string, {
  emoji: string[];
  particles: string;
  glow: string;
  label: string;
  bgTint: string;
}> = {
  legend: {
    emoji: ['👹', '💀', '🔮', '🕯️', '👻', '🌑'],
    particles: 'rgba(139,92,246,0.25)',
    glow: Colors.purple,
    label: 'Aura Paranormal',
    bgTint: 'rgba(80,0,120,0.18)',
  },
  history: {
    emoji: ['🏛️', '📜', '⚔️', '🗿', '🏺', '📯'],
    particles: 'rgba(245,158,11,0.2)',
    glow: Colors.gold,
    label: 'Aura Histórica',
    bgTint: 'rgba(120,80,0,0.15)',
  },
  nature: {
    emoji: ['🌿', '🦜', '🐠', '🌊', '🦋', '🌺'],
    particles: 'rgba(16,185,129,0.2)',
    glow: Colors.success,
    label: 'Aura Natural',
    bgTint: 'rgba(0,100,60,0.15)',
  },
  culture: {
    emoji: ['🎭', '🎨', '🎵', '🏮', '🎺', '🪘'],
    particles: 'rgba(236,72,153,0.2)',
    glow: Colors.pink,
    label: 'Aura Cultural',
    bgTint: 'rgba(150,0,80,0.15)',
  },
};

const PARTICLE_COUNT = 12;

export default function ARScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [activeEmojiIndex, setActiveEmojiIndex] = useState(0);
  const { isAuthenticated } = useApp();

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // Particles with independent animations
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
      angle: (i / PARTICLE_COUNT) * 2 * Math.PI,
      radius: 100 + Math.random() * 60,
      speed: 2000 + Math.random() * 3000,
    }))
  ).current;

  const place = TOURIST_PLACES.find((p) => p.id === id);
  const arEffect = place ? AR_EFFECTS[place.arType] : AR_EFFECTS.history;

  useEffect(() => {
    if (!isActive) return;

    Animated.timing(fadeInAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -18, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true, easing: Easing.linear })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
      ])
    );

    float.start();
    rotate.start();
    pulse.start();
    glow.start();

    // Animate particles
    const particleAnims = particles.map((p) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 1, duration: p.speed * 0.3, useNativeDriver: true }),
            Animated.timing(p.scale, { toValue: 1, duration: p.speed * 0.3, useNativeDriver: true }),
          ]),
          Animated.timing(p.opacity, { toValue: 0.3, duration: p.speed * 0.7, useNativeDriver: true }),
        ])
      );
      anim.start();
      return anim;
    });

    const interval = setInterval(() => {
      setActiveEmojiIndex((prev) => (prev + 1) % arEffect.emoji.length);
    }, 2200);

    return () => {
      float.stop();
      rotate.stop();
      pulse.stop();
      glow.stop();
      particleAnims.forEach((a) => a.stop());
      clearInterval(interval);
      fadeInAnim.setValue(0);
    };
  }, [isActive]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateReverse = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.85] });

  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <MaterialIcons name="view-in-ar" size={90} color={Colors.purple} />
        </Animated.View>
        <Text style={styles.permTitle}>Realidad Aumentada</Text>
        <Text style={styles.permText}>
          Necesitamos acceso a tu cámara para la experiencia AR
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <LinearGradient colors={Colors.gradientPurple as [string, string]} style={styles.permBtnGrad}>
            <MaterialIcons name="camera-alt" size={20} color="#FFF" />
            <Text style={styles.permBtnText}>Activar Cámara</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: Colors.textPrimary }}>Lugar no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Color tint overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: arEffect.bgTint }]} pointerEvents="none" />

      {/* Scan lines effect */}
      {isActive && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.scanlines]} pointerEvents="none" />
      )}

      {/* ── ACTIVE AR OVERLAY ── */}
      {isActive && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeInAnim }]} pointerEvents="none">
          {/* Outer glow rings */}
          <View style={styles.ringContainer}>
            <Animated.View
              style={[
                styles.ring,
                styles.ring1,
                { borderColor: arEffect.glow, opacity: glowOpacity, transform: [{ rotate }] },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ring2,
                { borderColor: arEffect.glow + '88', opacity: glowOpacity, transform: [{ rotate: rotateReverse }] },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ring3,
                { borderColor: arEffect.glow + '44', opacity: glowOpacity },
              ]}
            />

            {/* Main emoji orb */}
            <Animated.View
              style={[
                styles.mainOrb,
                { borderColor: arEffect.glow + '88', transform: [{ translateY: floatAnim }, { scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={[arEffect.glow + '44', 'transparent']}
                style={styles.orbGradient}
              />
              <Text style={styles.mainEmoji}>{arEffect.emoji[activeEmojiIndex]}</Text>
            </Animated.View>

            {/* Orbiting particles */}
            {particles.map((p, i) => {
              const x = Math.cos(p.angle) * p.radius;
              const y = Math.sin(p.angle) * p.radius;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.particle,
                    {
                      opacity: p.opacity,
                      transform: [{ translateX: x }, { translateY: y }, { scale: p.scale }],
                    },
                  ]}
                >
                  <Text style={styles.particleEmoji}>
                    {arEffect.emoji[i % arEffect.emoji.length]}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          {/* Corner AR markers */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
            <View
              key={i}
              style={[
                styles.cornerMarker,
                {
                  top: height / 2 + sy * 130,
                  left: width / 2 + sx * 130,
                  borderTopWidth: sy < 0 ? 2 : 0,
                  borderBottomWidth: sy > 0 ? 2 : 0,
                  borderLeftWidth: sx < 0 ? 2 : 0,
                  borderRightWidth: sx > 0 ? 2 : 0,
                  borderColor: arEffect.glow,
                },
              ]}
            />
          ))}

          {/* HUD data overlay */}
          <View style={[styles.hudLeft, { top: height / 2 - 60 }]}>
            <Text style={[styles.hudText, { color: arEffect.glow }]}>LAT 11.00°N</Text>
            <Text style={[styles.hudText, { color: arEffect.glow }]}>LON 74.25°W</Text>
            <Text style={[styles.hudText, { color: arEffect.glow }]}>ALT 5m</Text>
            <Text style={[styles.hudText, { color: arEffect.glow }]}>AR v2.0</Text>
          </View>
          <View style={[styles.hudRight, { top: height / 2 - 60 }]}>
            <Text style={[styles.hudText, { color: arEffect.glow, textAlign: 'right' }]}>●REC</Text>
            <Text style={[styles.hudText, { color: arEffect.glow, textAlign: 'right' }]}>SIG 5G</Text>
            <Text style={[styles.hudText, { color: arEffect.glow, textAlign: 'right' }]}>98%</Text>
          </View>
        </Animated.View>
      )}

      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.textMuted }]} />
          <Text style={styles.statusText}>
            {isActive ? `AR · ${arEffect.label}` : 'Listo para AR'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAudio(!showAudio)}>
          <MaterialIcons name={showAudio ? 'headset-off' : 'headset'} size={22} color={isActive ? arEffect.glow : Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.placeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={[styles.placeType, { color: arEffect.glow }]}>{arEffect.label}</Text>
          </View>
          <View style={[styles.arTypeBadge, { backgroundColor: arEffect.glow + '22', borderColor: arEffect.glow + '55' }]}>
            <Text style={[styles.arTypeBadgeText, { color: arEffect.glow }]}>
              {place.arType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Audio */}
        {showAudio && (
          <View style={styles.audioWrapper}>
            {isAuthenticated ? (
              <AudioGuide text={place.audioText} placeName={place.name} autoPlay={isActive} />
            ) : (
              <View style={styles.authGate}>
                <MaterialIcons name="lock" size={20} color={Colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.authGateTitle}>Audioguía exclusiva</Text>
                  <Text style={styles.authGateText}>Inicia sesión para escuchar la narración completa</Text>
                </View>
                <TouchableOpacity
                  style={styles.authGateBtn}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.authGateBtnText}>Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Controls */}
        {!isActive ? (
          <TouchableOpacity style={styles.activateBtn} onPress={() => setIsActive(true)} activeOpacity={0.85}>
            <LinearGradient colors={[arEffect.glow, arEffect.glow + 'AA']} style={styles.activateGrad}>
              <MaterialIcons name="view-in-ar" size={28} color="#FFF" />
              <Text style={styles.activateText}>Activar Experiencia AR</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity style={[styles.controlBtn, { borderColor: Colors.danger + '44' }]} onPress={() => setIsActive(false)}>
              <MaterialIcons name="stop" size={22} color={Colors.danger} />
              <Text style={[styles.controlBtnText, { color: Colors.danger }]}>Detener</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlBtn, { borderColor: arEffect.glow + '44' }]}
              onPress={() => setShowAudio(!showAudio)}
            >
              <MaterialIcons name="record-voice-over" size={22} color={arEffect.glow} />
              <Text style={[styles.controlBtnText, { color: arEffect.glow }]}>
                {showAudio ? 'Ocultar audio' : 'Audioguía'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  permTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, textAlign: 'center' },
  permText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  permBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  permBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  permBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md },
  scanlines: {
    opacity: 0.05,
  },
  ringContainer: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1.5 },
  ring1: { width: 220, height: 220 },
  ring2: { width: 290, height: 290, borderStyle: 'dashed' },
  ring3: { width: 360, height: 360 },
  mainOrb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 2,
    overflow: 'hidden',
  },
  orbGradient: { ...StyleSheet.absoluteFillObject },
  mainEmoji: { fontSize: 68, textShadowColor: 'rgba(255,255,255,0.3)', textShadowRadius: 10 },
  particle: {
    position: 'absolute',
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  particleEmoji: { fontSize: 20 },
  cornerMarker: { position: 'absolute', width: 20, height: 20 },
  hudLeft: { position: 'absolute', left: Spacing.md, gap: 3 },
  hudRight: { position: 'absolute', right: Spacing.md, gap: 3 },
  hudText: { fontSize: 10, fontWeight: FontWeight.semibold, opacity: 0.8, fontVariant: ['tabular-nums'] },
  topBar: {
    position: 'absolute', left: Spacing.md, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(7,11,20,0.92)',
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
  },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  placeName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  placeType: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },
  arTypeBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.md, borderWidth: 1,
  },
  arTypeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  audioWrapper: {},
  authGate: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.gold + '11', borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.gold + '33',
  },
  authGateTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  authGateText: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  authGateBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  authGateBtnText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  activateBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  activateGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.xl,
  },
  activateText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  activeControls: { flexDirection: 'row', gap: Spacing.sm },
  controlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 52, borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard, borderWidth: 1,
  },
  controlBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});

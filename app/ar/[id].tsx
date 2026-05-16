import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { AudioGuide } from '@/components/feature/AudioGuide';
import { useApp } from '@/hooks/useApp';


const CAYO_EMOJIS: Record<string, { welcome: string; pointing: string }> = {
  history: { welcome: '🏛️', pointing: '👆' },
  nature:  { welcome: '🌿', pointing: '☝️' },
  culture: { welcome: '🎭', pointing: '👉' },
  legend:  { welcome: '👹', pointing: '🫵' },
};

function CayoMascot({ arType, pose, glowColor }: { arType: string; pose: MascotPose; glowColor: string }) {
  const emojis = CAYO_EMOJIS[arType] ?? CAYO_EMOJIS.history;
  return (
    <View style={[mascotStyles.body, { borderColor: glowColor + '88', shadowColor: glowColor }]}>
      <LinearGradient
        colors={[glowColor + '44', glowColor + '11']}
        style={mascotStyles.bodyGrad}
      >
        <Text style={mascotStyles.face}>🧑</Text>
        <Text style={mascotStyles.badge}>{pose === 'pointing' ? emojis.pointing : emojis.welcome}</Text>
        <Text style={mascotStyles.name}>Cayo</Text>
      </LinearGradient>
    </View>
  );
}

const mascotStyles = StyleSheet.create({
  body: {
    width: 110,
    height: 130,
    borderRadius: Radius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 10,
  },
  bodyGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  face: { fontSize: 52 },
  badge: { fontSize: 26 },
  name: { color: '#FFF', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});

const AR_EFFECTS: Record<
  string,
  {
    glow: string;
    label: string;
    bgTint: string;
  }
> = {
  legend: {
    glow: Colors.purple,
    label: 'Ruta de leyendas',
    bgTint: 'rgba(80,0,120,0.16)',
  },
  history: {
    glow: Colors.gold,
    label: 'Ruta historica',
    bgTint: 'rgba(120,80,0,0.14)',
  },
  nature: {
    glow: Colors.success,
    label: 'Ruta natural',
    bgTint: 'rgba(0,100,60,0.14)',
  },
  culture: {
    glow: Colors.pink,
    label: 'Ruta cultural',
    bgTint: 'rgba(150,0,80,0.14)',
  },
};

type MascotPose = 'welcome' | 'pointing';

export default function ARScreen() {
  const { id, autoStart, fromScan, points, already } = useLocalSearchParams<{
    id: string;
    autoStart?: string;
    fromScan?: string;
    points?: string;
    already?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showScanIntro, setShowScanIntro] = useState(fromScan === '1');
  const [pose, setPose] = useState<MascotPose>('welcome');
  const [speechIndex, setSpeechIndex] = useState(0);
  const { isAuthenticated, places } = useApp();

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  const place = places.find((item) => item.id === id);
  const arEffect = place ? AR_EFFECTS[place.arType] : AR_EFFECTS.history;
  const placeArType = place?.arType || 'history';
  const earnedPoints = Number(points || 0);
  const cameFromScan = fromScan === '1';
  const wasAlreadyScanned = already === '1';

  const scriptLines = useMemo(
    () => buildCayoScript(place?.name || 'este lugar', place?.arType || 'history'),
    [place?.name, place?.arType]
  );
  const currentSpeech = scriptLines[speechIndex] || scriptLines[0];
  const subtitleText = useMemo(() => getAudioExcerpt(place?.audioText || ''), [place?.audioText]);

  useEffect(() => {
    if (autoStart === '1') {
      setIsActive(true);
    }
  }, [autoStart]);

  useEffect(() => {
    if (!isActive) {
      fadeInAnim.setValue(0);
      return;
    }

    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.025,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [fadeInAnim, floatAnim, isActive, pulseAnim]);

  useEffect(() => {
    if (!isActive || !cameFromScan) return;
    const timer = setTimeout(() => setShowAudio(true), 900);
    return () => clearTimeout(timer);
  }, [cameFromScan, isActive]);

  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <MaterialIcons name="view-in-ar" size={90} color={Colors.purple} />
        <Text style={styles.permTitle}>Realidad Aumentada</Text>
        <Text style={styles.permText}>Necesitamos acceso a tu camara para que Cayo aparezca en la experiencia AR.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <LinearGradient colors={Colors.gradientPurple as [string, string]} style={styles.permBtnGrad}>
            <MaterialIcons name="camera-alt" size={20} color="#FFF" />
            <Text style={styles.permBtnText}>Activar camara</Text>
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
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: arEffect.bgTint }]} pointerEvents="none" />

      <View style={[styles.topBar, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.textMuted }]} />
          <Text style={styles.statusText}>{isActive ? `AR · ${arEffect.label}` : 'Listo para AR'}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAudio((prev) => !prev)}>
          <MaterialIcons name={showAudio ? 'headset-off' : 'headset'} size={22} color={isActive ? arEffect.glow : Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {cameFromScan && showScanIntro && (
        <View style={[styles.scanIntroCard, { top: insets.top + 72, borderColor: arEffect.glow + '44' }]}>
          <View style={styles.scanIntroHeader}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.scanIntroTitle}>QR validado</Text>
          </View>
          <Text style={styles.scanIntroText}>
            {wasAlreadyScanned
              ? `Ya habias escaneado ${place.name}. Cayo reactivo tu experiencia AR.`
              : `Escaneo correcto. Cayo ya esta listo para guiarte en ${place.name}.`}
          </Text>
          <View style={styles.scanIntroActions}>
            <View style={styles.scanIntroPoints}>
              <MaterialIcons name="stars" size={16} color={Colors.gold} />
              <Text style={styles.scanIntroPointsText}>+{earnedPoints} pts</Text>
            </View>
            <TouchableOpacity style={styles.scanIntroClose} onPress={() => setShowScanIntro(false)}>
              <Text style={styles.scanIntroCloseText}>Ocultar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isActive && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeInAnim }]} pointerEvents="box-none">
          <View style={[styles.arLabelPill, { top: insets.top + 122 }]}>
            <Text style={styles.arLabelText}>APARICION EN REALIDAD AUMENTADA</Text>
          </View>

          <View style={styles.rightActionRail}>
            <TouchableOpacity style={styles.railBtn} onPress={() => setShowAudio((prev) => !prev)} activeOpacity={0.85}>
              <MaterialIcons name="volume-up" size={20} color={Colors.textPrimary} />
              <Text style={styles.railBtnText}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.railBtn} onPress={() => handleRepeatGuide(setSpeechIndex, setPose)} activeOpacity={0.85}>
              <MaterialIcons name="replay" size={20} color={Colors.textPrimary} />
              <Text style={styles.railBtnText}>Repetir</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mascotZone} pointerEvents="box-none">
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>{currentSpeech}</Text>
            </View>

            <Animated.View style={[styles.mascotStage, { transform: [{ translateY: floatAnim }, { scale: pulseAnim }] }]}>
              <LinearGradient colors={[arEffect.glow + '55', 'transparent']} style={styles.mascotGlow} />
              <View style={styles.mascotGround} />
              <TouchableOpacity
                style={styles.mascotTapArea}
                onPress={() => advanceGuide(scriptLines.length, speechIndex, setSpeechIndex, setPose, setShowAudio)}
                activeOpacity={0.92}
              >
                <CayoMascot arType={placeArType} pose={pose} glowColor={arEffect.glow} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mascotPrompt}
                onPress={() => advanceGuide(scriptLines.length, speechIndex, setSpeechIndex, setPose, setShowAudio)}
                activeOpacity={0.85}
              >
                <MaterialIcons name="touch-app" size={18} color="#FFF" />
                <Text style={styles.mascotPromptText}>Tocame para saber mas</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + Spacing.sm }]}>
{showInfo && (
          <View style={styles.placeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={[styles.placeType, { color: arEffect.glow }]}>{arEffect.label}</Text>
            </View>
            <View style={[styles.arTypeBadge, { backgroundColor: arEffect.glow + '22', borderColor: arEffect.glow + '55' }]}> 
              <Text style={[styles.arTypeBadgeText, { color: arEffect.glow }]}>{place.arType.toUpperCase()}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.primaryGhostBtn} onPress={() => { setPose('welcome'); setSpeechIndex(1); }} activeOpacity={0.85}>
            <MaterialIcons name="arrow-right-alt" size={20} color="#FFF" />
            <Text style={styles.primaryGhostBtnText}>Sigueme</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryGhostBtn} onPress={() => { setPose('pointing'); setSpeechIndex(2); }} activeOpacity={0.85}>
            <MaterialIcons name="visibility" size={20} color="#FFF" />
            <Text style={styles.primaryGhostBtnText}>Mira alli</Text>
          </TouchableOpacity>
        </View>

        {showInfo && (
          <View style={styles.subtitlePanel}>
            <View style={styles.subtitleAvatarBox}>
              <Text style={styles.subtitleAvatarEmoji}>
                {CAYO_EMOJIS[placeArType]?.welcome ?? '🧑'}
              </Text>
            </View>
            <View style={styles.subtitleContent}>
              <Text style={styles.subtitleTitle}>Acerca de este lugar</Text>
              <Text style={styles.subtitleText}>{subtitleText}</Text>
              <View style={styles.subtitleBarTrack}>
                <View style={[styles.subtitleBarFill, { backgroundColor: arEffect.glow }]} />
              </View>
            </View>
            <TouchableOpacity style={styles.subtitleAction} onPress={() => setShowAudio((prev) => !prev)} activeOpacity={0.85}>
              <MaterialIcons name="replay" size={22} color={Colors.textPrimary} />
              <Text style={styles.subtitleActionText}>{'Repetir\naudio'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showInfo && showAudio && (
          <View style={styles.audioWrapper}>
            {isAuthenticated ? (
              <AudioGuide text={place.audioText} placeName={place.name} autoPlay={isActive} />
            ) : (
              <View style={styles.authGate}>
                <MaterialIcons name="lock" size={20} color={Colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.authGateTitle}>Audioguia exclusiva</Text>
                  <Text style={styles.authGateText}>Inicia sesion para escuchar la narracion completa.</Text>
                </View>
                <TouchableOpacity style={styles.authGateBtn} onPress={() => router.push('/login')}>
                  <Text style={styles.authGateBtnText}>Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {!isActive ? (
          <TouchableOpacity style={styles.activateBtn} onPress={() => setIsActive(true)} activeOpacity={0.85}>
            <LinearGradient colors={[arEffect.glow, arEffect.glow + 'AA']} style={styles.activateGrad}>
              <MaterialIcons name="view-in-ar" size={28} color="#FFF" />
              <Text style={styles.activateText}>Activar experiencia AR</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity style={[styles.controlBtn, { borderColor: arEffect.glow + '44' }]} onPress={() => setShowInfo((prev) => !prev)}>
              <MaterialIcons name="menu-book" size={22} color={arEffect.glow} />
              <Text style={[styles.controlBtnText, { color: arEffect.glow }]}>{showInfo ? 'Ocultar info' : 'Mostrar info'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, { borderColor: Colors.danger + '44' }]} onPress={() => setIsActive(false)}>
              <MaterialIcons name="stop" size={22} color={Colors.danger} />
              <Text style={[styles.controlBtnText, { color: Colors.danger }]}>Salir de AR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function buildCayoScript(placeName: string, arType: string) {
  const base = [
    `Hola, soy Cayo, tu guia de Cienaga. Bienvenido a ${placeName}.`,
    `Ven conmigo. Voy a ayudarte a descubrir este lugar desde la experiencia AR.`,
  ];

  switch (arType) {
    case 'nature':
      return [...base, `Mira a tu alrededor. Aqui la naturaleza es parte esencial de la historia de ${placeName}.`];
    case 'legend':
      return [...base, `Pon atencion. En ${placeName} se esconden mitos y relatos que hacen unico este sitio.`];
    case 'culture':
      return [...base, `Mira bien. En ${placeName} se siente la cultura, la musica y la identidad de nuestra region.`];
    default:
      return [...base, `Mira ese entorno. En ${placeName} hay hechos y personajes que marcaron la historia de la ciudad.`];
  }
}

function getAudioExcerpt(text: string) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return 'Activa el audio para escuchar a Cayo contarte la historia de este lugar.';
  if (cleanText.length <= 120) return cleanText;
  return `${cleanText.slice(0, 120).trim()}...`;
}

function handleRepeatGuide(
  setSpeechIndex: React.Dispatch<React.SetStateAction<number>>,
  setPose: React.Dispatch<React.SetStateAction<MascotPose>>
) {
  setSpeechIndex(0);
  setPose('welcome');
}

function advanceGuide(
  totalLines: number,
  currentIndex: number,
  setSpeechIndex: React.Dispatch<React.SetStateAction<number>>,
  setPose: React.Dispatch<React.SetStateAction<MascotPose>>,
  setShowAudio: React.Dispatch<React.SetStateAction<boolean>>
) {
  const nextIndex = (currentIndex + 1) % totalLines;
  setSpeechIndex(nextIndex);
  setPose(nextIndex >= 2 ? 'pointing' : 'welcome');
  if (nextIndex >= 1) {
    setShowAudio(true);
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  permTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, textAlign: 'center' },
  permText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  permBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  permBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  permBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md },
  topBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  scanIntroCard: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(7,11,20,0.9)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  scanIntroHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  scanIntroTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  scanIntroText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  scanIntroActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  scanIntroPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gold + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  scanIntroPointsText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  scanIntroClose: { paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  scanIntroCloseText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  arLabelPill: {
    position: 'absolute',
    left: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  arLabelText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  rightActionRail: {
    position: 'absolute',
    right: Spacing.md,
    top: 190,
    gap: Spacing.sm,
  },
  railBtn: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(7,11,20,0.82)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  railBtnText: { color: Colors.textPrimary, fontSize: 10, fontWeight: FontWeight.semibold },
  mascotZone: {
    position: 'absolute',
    left: Spacing.md,
    right: 96,
    bottom: 255,
    minHeight: 280,
    justifyContent: 'flex-end',
  },
  speechBubble: {
    alignSelf: 'flex-end',
    maxWidth: '72%',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  speechText: { color: Colors.textInverse, fontSize: FontSize.md, lineHeight: 24, fontWeight: FontWeight.medium },
  mascotStage: { width: 250, alignItems: 'center', alignSelf: 'flex-start' },
  mascotGlow: {
    position: 'absolute',
    bottom: 44,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.45,
  },
  mascotGround: {
    position: 'absolute',
    bottom: 50,
    width: 192,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.6)',
  },
  mascotTapArea: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center' },

  mascotPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: -8,
  },
  mascotPromptText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7,11,20,0.94)',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  placeName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  placeType: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },
  arTypeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.md, borderWidth: 1 },
  arTypeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  actionButtonsRow: { flexDirection: 'row', gap: Spacing.sm },
  primaryGhostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  primaryGhostBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  subtitlePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  subtitleAvatarBox: {
    width: 76, height: 76, borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  subtitleAvatarEmoji: { fontSize: 38 },
  subtitleContent: { flex: 1, gap: Spacing.xs },
  subtitleTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  subtitleText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  subtitleBarTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginTop: 2,
  },
  subtitleBarFill: { width: '58%', height: '100%', borderRadius: 999 },
  subtitleAction: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  subtitleActionText: { color: Colors.textPrimary, fontSize: 10, fontWeight: FontWeight.bold, textAlign: 'center' },
  audioWrapper: {},
  authGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gold + '11',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + '33',
  },
  authGateTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  authGateText: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  authGateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  authGateBtnText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  activateBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  activateGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  activateText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  activeControls: { flexDirection: 'row', gap: Spacing.sm },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
  },
  controlBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});

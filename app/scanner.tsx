import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { TouristPlace } from '@/constants/places';
import { useApp } from '@/hooks/useApp';
import { useNotifications } from '@/hooks/useNotifications';
import { GradientButton } from '@/components/ui/GradientButton';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedPlace, setScannedPlace] = useState<TouristPlace | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [wasAlreadyScanned, setWasAlreadyScanned] = useState(false);
  const [isLaunchingAR, setIsLaunchingAR] = useState(false);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const scanLockRef = useRef(false);
  const { isAuthenticated, markQRScanned, isQRScanned, places } = useApp();
  const { sendQRNotification } = useNotifications();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 4],
  });

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanLockRef.current) return;
    scanLockRef.current = true;
    setScanned(true);
    setPointsEarned(0);
    setWasAlreadyScanned(false);
    setIsLaunchingAR(false);

    const normalizedData = normalizeQRValue(data);
    const place = places.find((p) => {
      const placeQR = normalizeQRValue(p.qrCode);
      return normalizedData === placeQR || normalizedData.includes(placeQR) || placeQR.includes(normalizedData);
    });
    if (place) {
      setScannedPlace(place);
      setIsLaunchingAR(true);

      let earned = 0;
      let already = false;

      if (isAuthenticated) {
        const result = await markQRScanned(place.qrCode, place.id, place.points);
        already = result.alreadyScanned;
        earned = already ? 10 : place.points;
      } else {
        already = isQRScanned(place.qrCode);
        earned = already ? 10 : place.points;
      }

      setPointsEarned(earned);
      setWasAlreadyScanned(already);
      sendQRNotification(place.name);

      setTimeout(() => {
        router.replace({
          pathname: '/ar/[id]',
          params: {
            id: place.id,
            autoStart: '1',
            fromScan: '1',
            points: String(earned),
            already: already ? '1' : '0',
          },
        } as any);
      }, 850);
    } else {
      setScannedPlace(null);
      scanLockRef.current = false;
    }
  };

  const handleSimulateScan = () => {
    const randomPlace = places[Math.floor(Math.random() * places.length)];
    if (!randomPlace) return;
    handleBarCodeScanned({ data: randomPlace.qrCode });
  };

  const handleExplore = () => {
    if (scannedPlace) router.replace(`/place/${scannedPlace.id}` as any);
  };

  const handleAR = () => {
    if (scannedPlace) router.replace(`/ar/${scannedPlace.id}` as any);
  };

  const handleClose = () => router.back();
  const handleRescan = () => {
    scanLockRef.current = false;
    setScanned(false);
    setScannedPlace(null);
    setIsLaunchingAR(false);
    setPointsEarned(0);
    setWasAlreadyScanned(false);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <MaterialIcons name="qr-code-scanner" size={80} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
        <Text style={styles.permissionText}>
          Necesitamos acceso a tu cámara para escanear los códigos QR de los lugares turísticos.
        </Text>
        <GradientButton title="Permitir Cámara" onPress={requestPermission} gradient={Colors.gradientBlue} style={{ width: 220 }} />
        <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      )}

      {/* Overlay with scan window */}
      {!scanned && (
        <>
          <View style={[styles.overlay, { top: 0, height: (height - SCAN_SIZE) / 2 }]} />
          <View style={{ top: (height - SCAN_SIZE) / 2, flexDirection: 'row', position: 'absolute', height: SCAN_SIZE }}>
            <View style={[styles.overlay, { width: (width - SCAN_SIZE) / 2 }]} />
            <View style={styles.scanWindow}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]} />
            </View>
            <View style={[styles.overlay, { width: (width - SCAN_SIZE) / 2 }]} />
          </View>
          <View style={[styles.overlay, { bottom: 0, height: (height - SCAN_SIZE) / 2, top: undefined }]} />
        </>
      )}

      {/* Close */}
      <TouchableOpacity style={[styles.closeBtn, { top: insets.top + Spacing.md }]} onPress={handleClose}>
        <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Top Label */}
      {!scanned && (
        <View style={[styles.topLabel, { top: insets.top + Spacing.md }]}>
          <Text style={styles.topLabelText}>Escanear QR Turístico</Text>
          <Text style={styles.topLabelSub}>Apunta la cámara hacia el código QR</Text>
        </View>
      )}

      {/* Auth notice */}
      {!scanned && !isAuthenticated && (
        <View style={[styles.authNotice, { top: insets.top + 80 }]}>
          <MaterialIcons name="info-outline" size={14} color={Colors.gold} />
          <Text style={styles.authNoticeText}>Inicia sesión para guardar tus puntos en la nube</Text>
        </View>
      )}

      {/* Bottom Panel */}
      {!scanned && (
        <View style={[styles.bottomPanel, { bottom: insets.bottom + Spacing.md }]}>
          <Text style={styles.bottomHint}>
            Busca los códigos QR en los letreros turísticos de Ciénaga
          </Text>
          <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateScan}>
            <MaterialIcons name="auto-fix-high" size={18} color={Colors.gold} />
            <Text style={styles.simulateText}>Simular escaneo (Demo)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      {scanned && (
        <View style={styles.resultOverlay}>
          <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />

          {scannedPlace && isLaunchingAR ? (
            <View style={[styles.resultCard, { paddingBottom: insets.bottom + Spacing.md }]}>
              <LinearGradient
                colors={['rgba(59,130,246,0.22)', 'rgba(139,92,246,0.16)']}
                style={styles.launchBanner}
              >
                <View style={styles.launchIcon}>
                  <MaterialIcons name="view-in-ar" size={46} color="#C4B5FD" />
                </View>
                <Text style={styles.launchTitle}>QR valido</Text>
                <Text style={styles.launchPlace}>{scannedPlace.name}</Text>
                <Text style={styles.launchText}>
                  {wasAlreadyScanned
                    ? 'Ya conoces este lugar. Abriendo de nuevo la experiencia AR.'
                    : 'Te llevaremos enseguida a la experiencia AR de este lugar.'}
                </Text>
                <View style={styles.launchPointsChip}>
                  <MaterialIcons name="stars" size={18} color={Colors.gold} />
                  <Text style={styles.launchPointsText}>+{pointsEarned} puntos</Text>
                </View>
                <View style={styles.launchLoaderRow}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.launchLoaderText}>Iniciando experiencia...</Text>
                </View>
              </LinearGradient>
            </View>
          ) : scannedPlace ? (
            <View style={[styles.resultCard, { paddingBottom: insets.bottom + Spacing.md }]}>
              <LinearGradient
                colors={['rgba(16,185,129,0.2)', 'rgba(59,130,246,0.1)']}
                style={styles.successBanner}
              >
                <View style={styles.successIcon}>
                  <MaterialIcons name="check-circle" size={48} color={Colors.success} />
                </View>
                <Text style={styles.successTitle}>QR Escaneado!</Text>
                <Text style={styles.successPlace}>{scannedPlace.name}</Text>
                {wasAlreadyScanned && (
                  <Text style={styles.alreadyText}>Ya lo habías escaneado antes</Text>
                )}
                <View style={styles.pointsEarned}>
                  <MaterialIcons name="stars" size={20} color={Colors.gold} />
                  <Text style={styles.pointsEarnedText}>+{pointsEarned} puntos ganados</Text>
                </View>
                {!isAuthenticated && (
                  <TouchableOpacity
                    style={styles.loginHint}
                    onPress={() => router.push('/login')}
                  >
                    <MaterialIcons name="login" size={14} color={Colors.primary} />
                    <Text style={styles.loginHintText}>Inicia sesión para guardar tus puntos</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>

              <Text style={styles.resultDescription} numberOfLines={3}>
                {scannedPlace.shortDescription}
              </Text>

              <View style={styles.resultActions}>
                <GradientButton title="Explorar Lugar" gradient={Colors.gradientBlue} onPress={handleExplore} style={{ flex: 1 }} />
                <TouchableOpacity style={styles.arActionBtn} onPress={handleAR}>
                  <LinearGradient colors={Colors.gradientPurple as [string, string]} style={styles.arActionGradient}>
                    <MaterialIcons name="view-in-ar" size={22} color="#FFF" />
                    <Text style={styles.arActionText}>AR</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
                <Text style={styles.rescanText}>Escanear otro QR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultCard}>
              <View style={styles.errorIcon}>
                <MaterialIcons name="error-outline" size={64} color={Colors.danger} />
              </View>
              <Text style={styles.errorTitle}>QR no reconocido</Text>
              <Text style={styles.errorText}>
                Este código QR no corresponde a ningún lugar turístico registrado en Descubre Ciénaga.
              </Text>
              <GradientButton title="Intentar de nuevo" gradient={Colors.gradientBlue} onPress={handleRescan} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  permissionTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, textAlign: 'center' },
  permissionText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  cancelBtn: { padding: Spacing.md },
  cancelText: { color: Colors.textSecondary, fontSize: FontSize.md },
  overlay: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  scanWindow: { width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },
  closeBtn: { position: 'absolute', right: Spacing.md, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  topLabel: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: Spacing.xs },
  topLabelText: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  topLabelSub: { color: Colors.textSecondary, fontSize: FontSize.sm },
  authNotice: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.gold + '22', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.gold + '44', justifyContent: 'center',
  },
  authNoticeText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  bottomPanel: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, alignItems: 'center', gap: Spacing.md },
  bottomHint: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },
  simulateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  simulateText: { color: Colors.gold, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  resultOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md },
  resultCard: { width: '100%', gap: Spacing.md, alignItems: 'center' },
  successBanner: {
    width: '100%', borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.success + '44',
  },
  successIcon: {},
  successTitle: { color: Colors.success, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  successPlace: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  alreadyText: { color: Colors.textMuted, fontSize: FontSize.xs },
  pointsEarned: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.gold + '22', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold + '44',
  },
  pointsEarnedText: { color: Colors.gold, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  loginHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '22', paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary + '44',
  },
  loginHintText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  resultDescription: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
  resultActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  arActionBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  arActionGradient: { width: 60, height: 52, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: Radius.lg },
  arActionText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  rescanBtn: { padding: Spacing.sm },
  rescanText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  errorIcon: { marginBottom: Spacing.sm },
  errorTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
  launchBanner: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  launchIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  launchTitle: { color: '#C4B5FD', fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  launchPlace: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  launchText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
  launchPointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gold + '22',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  launchPointsText: { color: Colors.gold, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  launchLoaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  launchLoaderText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});

function normalizeQRValue(value: string) {
  let normalized = value.trim();

  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
    } catch {
      break;
    }
  }

  try {
    if (/^https?:\/\//i.test(normalized)) {
      const url = new URL(normalized);
      const dataParam = url.searchParams.get('data');
      if (dataParam) normalized = dataParam;
    }
  } catch {}

  return normalized.trim().replace(/\s+/g, '').toUpperCase();
}

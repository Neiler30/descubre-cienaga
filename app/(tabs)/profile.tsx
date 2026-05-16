import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSupabaseClient, useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useApp } from '@/hooks/useApp';

const supabase = getSupabaseClient();
const TAB_BAR_HEIGHT = 90;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, updateUser, currentLevel, nextLevel, progressToNextLevel, places } = useApp();
  const { showAlert } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    showAlert('Cerrar sesion', 'Deseas cerrar tu sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          setLoggingOut(false);
          router.replace('/login' as any);
        },
      },
    ]);
  };

  // Not logged in state
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container]}>
        <View style={[styles.guestScreen, { paddingTop: insets.top + Spacing.xl }]}>
          <MaterialIcons name="account-circle" size={90} color={Colors.primary} />
          <Text style={styles.guestTitle}>Explora sin cuenta</Text>
          <Text style={styles.guestSub}>
            Inicia sesion para guardar tu progreso en la nube, desbloquear la audioguia y acceder a todas las funciones.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login' as any)} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.loginBtnGrad}>
              <MaterialIcons name="login" size={20} color="#FFF" />
              <Text style={styles.loginBtnText}>Iniciar sesion</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Benefits */}
          <View style={styles.benefits}>
            {[
              { icon: 'cloud-done', label: 'Progreso sincronizado en la nube', color: Colors.primary },
              { icon: 'headset', label: 'Audioguias de cada lugar', color: Colors.success },
              { icon: 'view-in-ar', label: 'Experiencia AR completa', color: Colors.purple },
              { icon: 'emoji-events', label: 'Logros y puntos persistentes', color: Colors.gold },
            ].map((b) => (
              <View key={b.label} style={styles.benefitRow}>
                <MaterialIcons name={b.icon as any} size={20} color={b.color} />
                <Text style={styles.benefitText}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const visitedPlaces = places.filter((p) => user.visitedPlaces.includes(p.id));
  const exploredPercent = places.length > 0 ? Math.round((user.visitedPlaces.length / places.length) * 100) : 0;

  const handleSaveName = () => {
    if (nameInput.trim().length < 2) {
      showAlert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }
    updateUser({ name: nameInput.trim() });
    setIsEditing(false);
  };

  const handleResetProgress = () => {
    showAlert('Reiniciar progreso', 'Esta accion borrara todos tus puntos y visitas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          updateUser({ points: 0, visitedPlaces: [], scannedQRs: [], unlockedBadges: [] });
          showAlert('Listo', 'Tu progreso ha sido reiniciado');
        },
      },
    ]);
  };

  const joinDate = new Date(user.joinDate).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const avatarOptions = buildAvatarOptions(user.id);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing.md, paddingBottom: TAB_BAR_HEIGHT + Spacing.lg },
          ]}
        >
          {/* Header */}
          <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>Mi Perfil</Text>
            <View style={styles.headerActions}>
              {isAdmin && (
                <TouchableOpacity style={styles.adminBadge} onPress={() => router.push('/admin' as any)}>
                  <MaterialIcons name="admin-panel-settings" size={15} color={Colors.gold} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
                {loggingOut ? (
                  <ActivityIndicator size="small" color={Colors.danger} />
                ) : (
                  <MaterialIcons name="logout" size={20} color={Colors.danger} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Card */}
          <LinearGradient
            colors={['rgba(59,130,246,0.2)', 'rgba(139,92,246,0.1)']}
            style={styles.profileCard}
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" transition={200} />
                <View style={[styles.levelBadge, { backgroundColor: currentLevel.color }]}>
                  <Text style={styles.levelBadgeIcon}>{currentLevel.icon}</Text>
                </View>
              </View>

              <View style={styles.nameSection}>
                {isEditing ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={styles.nameInput}
                      value={nameInput}
                      onChangeText={setNameInput}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                    />
                    <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
                      <MaterialIcons name="check" size={20} color={Colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.saveBtn}>
                      <MaterialIcons name="close" size={20} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{user.name}</Text>
                    <TouchableOpacity onPress={() => { setNameInput(user.name); setIsEditing(true); }}>
                      <MaterialIcons name="edit" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[styles.levelNameText, { color: currentLevel.color }]}>
                  {currentLevel.icon} {currentLevel.name}
                </Text>
                <Text style={styles.joinDate}>Explorador desde {joinDate}</Text>
              </View>
            </View>

            <View style={styles.pointsRow}>
              <MaterialIcons name="stars" size={22} color={Colors.gold} />
              <Text style={styles.totalPoints}>{user.points} puntos totales</Text>
            </View>

            <ProgressBar progress={progressToNextLevel} gradient={Colors.gradientBlue} height={8} />
            {nextLevel && (
              <Text style={styles.nextLevelLabel}>
                Faltan {nextLevel.minPoints - user.points} pts para {nextLevel.icon} {nextLevel.name}
              </Text>
            )}
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elige tu avatar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarPickerRow}>
              {avatarOptions.map((avatarUrl, index) => {
                const selected = user.avatar === avatarUrl;
                return (
                  <TouchableOpacity
                    key={`${avatarUrl}-${index}`}
                    style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
                    onPress={() => updateUser({ avatar: avatarUrl })}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: avatarUrl }} style={styles.avatarOptionImage} contentFit="cover" transition={120} />
                    {selected ? (
                      <View style={styles.avatarOptionBadge}>
                        <MaterialIcons name="check" size={14} color="#FFF" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.avatarPickerHint}>Toca un avatar para cambiar tu apariencia en la app.</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Lugares visitados', value: user.visitedPlaces.length, icon: 'location-on', color: Colors.primary, gradient: Colors.gradientBlue },
              { label: 'QRs escaneados', value: user.scannedQRs.length, icon: 'qr-code-scanner', color: Colors.success, gradient: Colors.gradientGreen },
              { label: 'Logros', value: user.unlockedBadges.length, icon: 'emoji-events', color: Colors.gold, gradient: Colors.gradientGold },
              { label: 'Explorado', value: `${exploredPercent}%`, icon: 'explore', color: Colors.purple, gradient: Colors.gradientPurple },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <LinearGradient colors={stat.gradient as [string, string]} style={styles.statIcon}>
                  <MaterialIcons name={stat.icon as any} size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Explored Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progreso de Exploracion</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Cienaga, Magdalena</Text>
                <Text style={styles.progressPct}>{exploredPercent}%</Text>
              </View>
              <ProgressBar progress={exploredPercent} gradient={Colors.gradientBlue} height={10} />
              <Text style={styles.progressSubtext}>
                {user.visitedPlaces.length} de {places.length} lugares visitados
              </Text>
            </View>
          </View>

          {/* Visited Places */}
          {visitedPlaces.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lugares Visitados</Text>
              {visitedPlaces.map((place) => (
                <View key={place.id} style={styles.visitedItem}>
                  <Image source={{ uri: place.imageUrl }} style={styles.visitedImage} contentFit="cover" transition={200} />
                  <View style={styles.visitedInfo}>
                    <Text style={styles.visitedName}>{place.name}</Text>
                    <Text style={styles.visitedCategory}>{place.shortDescription}</Text>
                    <View style={styles.visitedPoints}>
                      <MaterialIcons name="stars" size={14} color={Colors.gold} />
                      <Text style={styles.visitedPointsText}>+{place.points} pts</Text>
                    </View>
                  </View>
                  <MaterialIcons name="check-circle" size={24} color={Colors.success} />
                </View>
              ))}
            </View>
          )}

          {/* Admin Panel Access */}
          {isAdmin && (
            <TouchableOpacity style={styles.adminPanelBtn} onPress={() => router.push('/admin' as any)} activeOpacity={0.85}>
              <LinearGradient colors={Colors.gradientGold as [string, string]} style={styles.adminPanelGrad}>
                <MaterialIcons name="admin-panel-settings" size={22} color="#FFF" />
                <Text style={styles.adminPanelText}>Abrir Panel Administrador</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Reset & Logout */}
          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetProgress}>
              <MaterialIcons name="refresh" size={18} color={Colors.danger} />
              <Text style={styles.resetText}>Reiniciar progreso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleLogout}>
              <MaterialIcons name="logout" size={18} color={Colors.danger} />
              <Text style={styles.resetText}>Cerrar sesion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  // Guest
  guestScreen: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  guestTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, textAlign: 'center' },
  guestSub: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  loginBtn: { borderRadius: Radius.lg, overflow: 'hidden', width: '100%' },
  loginBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54 },
  loginBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  benefits: { width: '100%', gap: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  // Logged in
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold + '22', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold + '44',
  },
  adminBadgeText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.danger + '11', borderWidth: 1, borderColor: Colors.danger + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  profileCard: { borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '33', gap: Spacing.sm },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.primary },
  avatarPickerRow: { gap: Spacing.sm, paddingRight: Spacing.md },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '16',
  },
  avatarOptionImage: { width: '100%', height: '100%', borderRadius: 32 },
  avatarOptionBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgPrimary,
  },
  avatarPickerHint: { color: Colors.textMuted, fontSize: FontSize.xs },
  levelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bgPrimary,
  },
  levelBadgeIcon: { fontSize: 14 },
  nameSection: { flex: 1, gap: Spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  nameInput: {
    flex: 1, color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    backgroundColor: Colors.bgSurface, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary,
  },
  saveBtn: { padding: Spacing.xs },
  levelNameText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  joinDate: { color: Colors.textMuted, fontSize: FontSize.xs },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  totalPoints: { color: Colors.gold, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  nextLevelLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  statIcon: { width: 44, height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  statLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, textAlign: 'center' },
  section: { gap: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  progressCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  progressPct: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  progressSubtext: { color: Colors.textMuted, fontSize: FontSize.xs },
  visitedItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  visitedImage: { width: 56, height: 56, borderRadius: Radius.md },
  visitedInfo: { flex: 1, gap: 3 },
  visitedName: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  visitedCategory: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 16 },
  visitedPoints: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  visitedPointsText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  adminPanelBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  adminPanelGrad: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  adminPanelText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1 },
  dangerZone: { gap: Spacing.sm },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.xl,
    backgroundColor: Colors.danger + '11', borderWidth: 1, borderColor: Colors.danger + '33',
  },
  resetText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});

function buildAvatarOptions(userId: string) {
  const variants = [
    { seed: `${userId}-rio`, background: '1A2035' },
    { seed: `${userId}-manglar`, background: '0F766E' },
    { seed: `${userId}-sol`, background: 'B45309' },
    { seed: `${userId}-costa`, background: '1D4ED8' },
    { seed: `${userId}-selva`, background: '166534' },
    { seed: `${userId}-historia`, background: '7C2D12' },
    { seed: `${userId}-noche`, background: '312E81' },
    { seed: `${userId}-brisa`, background: '0F172A' },
  ];

  return variants.map(
    ({ seed, background }) =>
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${background}`
  );
}

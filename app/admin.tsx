import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { TouristPlace, CATEGORIES } from '@/constants/places';
import {
  DBUserProfile,
  createPlace,
  deletePlace,
  fetchAdminUsers,
  fetchPlaces,
  sendUserPasswordReset,
  updateAdminUserProfile,
  updatePlace,
} from '@/services/supabaseService';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

type AdminTab = 'places' | 'users' | 'stats';

type QRPreviewState = {
  qrCode: string;
  name: string;
} | null;

type EditableUserForm = {
  username: string;
  email: string;
  points: string;
  avatarUrl: string;
  isAdmin: boolean;
  visitedPlaces: string;
  scannedQrs: string;
  unlockedBadges: string;
};

const DEFAULT_FORM: Omit<TouristPlace, 'id'> = {
  name: '',
  shortDescription: '',
  description: '',
  category: 'historia',
  latitude: 11.007,
  longitude: -74.2555,
  address: '',
  rating: 4.5,
  points: 100,
  qrCode: '',
  imageUrl: '',
  audioText: '',
  arType: 'history',
  badge: '',
  difficulty: 'facil',
  visitDuration: '45 min',
  tags: [],
};

const DEFAULT_USER_FORM: EditableUserForm = {
  username: '',
  email: '',
  points: '0',
  avatarUrl: '',
  isAdmin: false,
  visitedPlaces: '',
  scannedQrs: '',
  unlockedBadges: '',
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAdmin, isAuthenticated, authUser, refreshProfile, refreshPlaces } = useApp();
  const { showAlert } = useAlert();
  const qrCaptureRef = useRef<View>(null);

  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [users, setUsers] = useState<DBUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingQr, setSavingQr] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<TouristPlace | null>(null);
  const [editingUser, setEditingUser] = useState<DBUserProfile | null>(null);
  const [selectedQR, setSelectedQR] = useState<QRPreviewState>(null);
  const [form, setForm] = useState<Omit<TouristPlace, 'id'>>(DEFAULT_FORM);
  const [userForm, setUserForm] = useState<EditableUserForm>(DEFAULT_USER_FORM);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('places');

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const adminCount = users.filter((user) => user.is_admin).length;
    const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0);

    return {
      placesCount: places.length,
      usersCount: users.length,
      adminCount,
      totalPoints,
    };
  }, [places, users]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [placesData, usersData] = await Promise.all([fetchPlaces(), fetchAdminUsers()]);
      setPlaces(placesData);
      setUsers(usersData);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlace(null);
    setForm({ ...DEFAULT_FORM, qrCode: normalizeQRValue(`QR_${Date.now()}`) });
    setTagInput('');
    setShowPlaceModal(true);
  };

  const handleOpenEdit = (place: TouristPlace) => {
    setEditingPlace(place);
    setForm({
      name: place.name,
      shortDescription: place.shortDescription,
      description: place.description,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      rating: place.rating,
      points: place.points,
      qrCode: place.qrCode,
      imageUrl: place.imageUrl,
      audioText: place.audioText,
      arType: place.arType,
      badge: place.badge,
      difficulty: place.difficulty,
      visitDuration: place.visitDuration,
      tags: place.tags,
    });
    setTagInput('');
    setShowPlaceModal(true);
  };

  const handleOpenUserEdit = (user: DBUserProfile) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      points: String(user.points || 0),
      avatarUrl: user.avatar_url || '',
      isAdmin: !!user.is_admin,
      visitedPlaces: joinCsv(user.visited_places),
      scannedQrs: joinCsv(user.scanned_qrs),
      unlockedBadges: joinCsv(user.unlocked_badges),
    });
    setShowUserModal(true);
  };

  const openQRPreview = (qrCode: string, name: string) => {
    const normalizedQR = normalizeQRValue(qrCode);

    if (!normalizedQR) {
      showAlert('QR vacio', 'Este lugar no tiene un codigo QR configurado.');
      return;
    }

    setSelectedQR({ qrCode: normalizedQR, name });
    setShowQRModal(true);
  };

  const handleSavePlace = async () => {
    if (!form.name.trim()) {
      showAlert('Error', 'El nombre es requerido.');
      return;
    }

    if (!form.imageUrl.trim()) {
      showAlert('Error', 'La URL de imagen es requerida.');
      return;
    }

    const normalizedForm = {
      ...form,
      qrCode: normalizeQRValue(form.qrCode || `QR_${Date.now()}`),
    };

    setForm(normalizedForm);
    setSaving(true);
    let error: string | null = null;

    if (editingPlace) {
      const result = await updatePlace(editingPlace.id, normalizedForm);
      error = result.error;
    } else {
      const result = await createPlace(normalizedForm);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      showAlert('Error al guardar', error);
      return;
    }

    showAlert('Guardado', editingPlace ? 'Lugar actualizado correctamente.' : 'Nuevo lugar creado correctamente.');
    setShowPlaceModal(false);
    await refreshPlaces();
    await loadDashboard();
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    if (!userForm.username.trim()) {
      showAlert('Error', 'El nombre del usuario es requerido.');
      return;
    }

    if (!userForm.email.trim()) {
      showAlert('Error', 'El correo del perfil es requerido.');
      return;
    }

    setSaving(true);
    const result = await updateAdminUserProfile(editingUser.id, {
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      points: Number(userForm.points) || 0,
      avatar_url: userForm.avatarUrl.trim() || null,
      is_admin: userForm.isAdmin,
      visited_places: splitCsv(userForm.visitedPlaces),
      scanned_qrs: splitCsv(userForm.scannedQrs),
      unlocked_badges: splitCsv(userForm.unlockedBadges),
    });
    setSaving(false);

    if (result.error) {
      showAlert('No se pudo guardar', result.error);
      return;
    }

    showAlert('Usuario actualizado', 'Los cambios del perfil se guardaron correctamente.');
    setShowUserModal(false);
    await loadDashboard();

    if (editingUser.id === authUser?.id) {
      await refreshProfile();
    }
  };

  const handleDelete = (place: TouristPlace) => {
    showAlert(
      'Eliminar lugar',
      `Esta accion desactivara "${place.name}". Puedes reactivarlo desde la base de datos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deletePlace(place.id);
            if (error) {
              showAlert('Error', error);
            } else {
              showAlert('Eliminado', 'Lugar desactivado correctamente.');
              await refreshPlaces();
              await loadDashboard();
            }
          },
        },
      ]
    );
  };

  const handleSendPasswordReset = (user: DBUserProfile) => {
    if (!user.email?.trim()) {
      showAlert('Sin correo', 'Este usuario no tiene un correo disponible para restablecer la contrasena.');
      return;
    }

    showAlert(
      'Restablecer contrasena',
      `Se enviara un correo de restablecimiento a ${user.email}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setResettingUserId(user.id);
            const result = await sendUserPasswordReset(user.email);
            setResettingUserId(null);

            if (result.error) {
              showAlert('No se pudo enviar', result.error);
              return;
            }

            showAlert('Correo enviado', 'El usuario recibira instrucciones para cambiar su contrasena.');
          },
        },
      ]
    );
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
  };

  const handleSaveQRToGallery = async () => {
    if (!selectedQR) return;

    const safeName = sanitizeFileName(selectedQR.name || 'qr');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(selectedQR.qrCode)}&size=1000x1000`;

    try {
      setSavingQr(true);

      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = qrUrl;
          link.download = `${safeName}_qr.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        showAlert('Descarga iniciada', 'El QR se descargo en tu navegador.');
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permiso requerido', 'Debes permitir acceso a fotos para guardar el QR en la galeria.');
        return;
      }

      if (!qrCaptureRef.current) {
        showAlert('QR no disponible', 'Abre nuevamente la vista previa e intenta otra vez.');
        return;
      }

      const capturedUri = await captureRef(qrCaptureRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const asset = await MediaLibrary.createAssetAsync(capturedUri);
      const albumName = 'Descubre Cienaga QR';
      const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);

      if (existingAlbum) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], existingAlbum, false);
      } else {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      }

      await FileSystem.deleteAsync(capturedUri, { idempotent: true }).catch(() => null);
      showAlert('QR guardado', 'El codigo QR fue guardado en la galeria del telefono.');
    } catch (error: any) {
      console.error('Save QR Error:', error);
      showAlert('Error', 'No se pudo guardar el QR en la galeria.');
    } finally {
      setSavingQr(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
        <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <MaterialIcons name="admin-panel-settings" size={70} color={Colors.primary} />
        <Text style={styles.gateTitle}>Area Administrativa</Text>
        <Text style={styles.gateText}>Debes iniciar sesion para acceder al panel de administrador.</Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => router.push('/login')}>
          <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.gateBtnGrad}>
            <Text style={styles.gateBtnText}>Iniciar sesion</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={16} color={Colors.textSecondary} />
          <Text style={styles.backLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
        <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <MaterialIcons name="block" size={70} color={Colors.danger} />
        <Text style={styles.gateTitle}>Acceso denegado</Text>
        <Text style={styles.gateText}>No tienes permisos de administrador. Contacta al equipo de Descubre Cienaga.</Text>
        <Text style={styles.gateEmail}>{authUser?.email}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={16} color={Colors.textSecondary} />
          <Text style={styles.backLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.bgDeep, Colors.bgPrimary]}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <MaterialIcons name="admin-panel-settings" size={22} color={Colors.primary} />
          <Text style={styles.headerText}>Panel Admin</Text>
        </View>
        {activeTab === 'places' ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
            <MaterialIcons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </LinearGradient>

      <View style={styles.tabBar}>
        {([
          { id: 'places' as const, label: 'Lugares', icon: 'place' },
          { id: 'users' as const, label: 'Usuarios', icon: 'groups' },
          { id: 'stats' as const, label: 'Estadisticas', icon: 'bar-chart' },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : activeTab === 'places' ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
        >
          {places.map((place) => (
            <View key={place.id} style={styles.placeRow}>
              <Image source={{ uri: place.imageUrl }} style={styles.placeRowImg} contentFit="cover" transition={200} />
              <View style={styles.placeRowInfo}>
                <Text style={styles.placeRowName} numberOfLines={1}>{place.name}</Text>
                <CategoryBadge category={place.category} />
                <View style={styles.placeRowMeta}>
                  <MaterialIcons name="stars" size={12} color={Colors.gold} />
                  <Text style={styles.placeRowPts}>{place.points} pts</Text>
                  <Text style={styles.placeRowQR} numberOfLines={1}>{place.qrCode}</Text>
                  <TouchableOpacity
                    style={styles.inlineIconBtn}
                    onPress={() => openQRPreview(place.qrCode, place.name)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="qr-code" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.placeRowActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(place)}>
                  <MaterialIcons name="edit" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(place)}>
                  <MaterialIcons name="delete" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {places.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="place" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No hay lugares. Crea el primero.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenCreate}>
                <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.emptyBtnGrad}>
                  <Text style={styles.emptyBtnText}>+ Agregar lugar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : activeTab === 'users' ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <MaterialIcons name="lock-reset" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Desde aqui puedes editar el perfil del usuario y enviar el correo de restablecimiento de contrasena.
              Cambiar la contrasena directamente de otra cuenta requiere un backend seguro de Supabase Admin.
            </Text>
          </View>

          {users.map((user) => {
            const isResetting = resettingUserId === user.id;

            return (
              <View key={user.id} style={styles.userRow}>
                <Image
                  source={{ uri: user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}` }}
                  style={styles.userAvatar}
                  contentFit="cover"
                  transition={150}
                />

                <View style={styles.userInfo}>
                  <View style={styles.userHeadline}>
                    <Text style={styles.userName} numberOfLines={1}>{user.username || 'Sin nombre'}</Text>
                    {user.is_admin ? (
                      <View style={styles.adminPill}>
                        <MaterialIcons name="verified-user" size={12} color={Colors.gold} />
                        <Text style={styles.adminPillText}>Admin</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.userEmail} numberOfLines={1}>{user.email || 'Sin correo'}</Text>
                  <View style={styles.userStatsRow}>
                    <Text style={styles.userStat}>{user.points || 0} pts</Text>
                    <Text style={styles.userStat}>{(user.visited_places || []).length} lugares</Text>
                    <Text style={styles.userStat}>{(user.scanned_qrs || []).length} QR</Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenUserEdit(user)}>
                    <MaterialIcons name="edit" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => handleSendPasswordReset(user)}
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <ActivityIndicator color={Colors.gold} size="small" />
                    ) : (
                      <MaterialIcons name="lock-reset" size={18} color={Colors.gold} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {users.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="groups" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron perfiles de usuarios.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statGrid}>
            <StatCard icon="place" value={String(stats.placesCount)} label="Lugares activos" colors={Colors.gradientBlue as [string, string]} />
            <StatCard icon="groups" value={String(stats.usersCount)} label="Usuarios" colors={Colors.gradientGreen as [string, string]} />
            <StatCard icon="verified-user" value={String(stats.adminCount)} label="Admins" colors={Colors.gradientGold as [string, string]} />
            <StatCard icon="stars" value={String(stats.totalPoints)} label="Puntos acumulados" colors={Colors.gradientPurple as [string, string]} />
          </View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const count = places.filter((place) => place.category === cat.id).length;
              return (
                <View key={cat.id} style={[styles.catCard, { borderColor: cat.color + '44' }]}>
                  <MaterialIcons name={cat.icon as any} size={22} color={cat.color} />
                  <Text style={[styles.catCount, { color: cat.color }]}>{count}</Text>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="info" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Admin activo: {authUser?.email}{'\n'}
              Ahora puedes abrir el QR en vista previa, descargarlo y administrar los perfiles desde este panel.
            </Text>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showPlaceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlaceModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPlaceModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingPlace ? 'Editar lugar' : 'Nuevo lugar turistico'}</Text>
              <TouchableOpacity onPress={handleSavePlace} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.saveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>Informacion basica</Text>

              <AdminInput label="Nombre del lugar *" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} placeholder="Plaza del Centenario" />
              <AdminInput label="Descripcion corta *" value={form.shortDescription} onChangeText={(value) => setForm((prev) => ({ ...prev, shortDescription: value }))} placeholder="El corazon historico..." multiline />
              <AdminInput label="Descripcion completa" value={form.description} onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))} placeholder="Descripcion detallada..." multiline />
              <AdminInput label="Direccion" value={form.address} onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))} placeholder="Cra. 17 #12-00, Cienaga" />
              <AdminInput label="URL de imagen *" value={form.imageUrl} onChangeText={(value) => setForm((prev) => ({ ...prev, imageUrl: value }))} placeholder="https://images.unsplash.com/..." />
              <AdminInput label="Texto de audioguia" value={form.audioText} onChangeText={(value) => setForm((prev) => ({ ...prev, audioText: value }))} placeholder="Narracion del lugar..." multiline />
              <AdminInput label="Insignia" value={form.badge} onChangeText={(value) => setForm((prev) => ({ ...prev, badge: value }))} placeholder="Guardian de la Historia" />
              <AdminInput label="Codigo QR" value={form.qrCode} onChangeText={(value) => setForm((prev) => ({ ...prev, qrCode: value }))} placeholder="QR_PLAZA_CENTENARIO_2024" />

              <Text style={styles.fieldLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xs }}>
                <View style={styles.catChipRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, form.category === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color }]}
                      onPress={() => setForm((prev) => ({ ...prev, category: cat.id }))}
                    >
                      <Text style={[styles.catChipText, form.category === cat.id && { color: cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Tipo AR</Text>
              <View style={styles.chipRow}>
                {(['history', 'legend', 'nature', 'culture'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, form.arType === type && styles.chipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, arType: type }))}
                  >
                    <Text style={[styles.chipText, form.arType === type && styles.chipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Dificultad</Text>
              <View style={styles.chipRow}>
                {(['facil', 'medio', 'dificil'] as const).map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[styles.chip, form.difficulty === difficulty && styles.chipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, difficulty }))}
                  >
                    <Text style={[styles.chipText, form.difficulty === difficulty && styles.chipTextActive]}>{difficulty}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Puntos" value={String(form.points)} onChangeText={(value) => setForm((prev) => ({ ...prev, points: Number(value) || 100 }))} keyboardType="number-pad" placeholder="100" />
                </View>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Duracion visita" value={form.visitDuration} onChangeText={(value) => setForm((prev) => ({ ...prev, visitDuration: value }))} placeholder="45 min" />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Latitud" value={String(form.latitude)} onChangeText={(value) => setForm((prev) => ({ ...prev, latitude: Number(value) || 11.007 }))} keyboardType="decimal-pad" placeholder="11.007" />
                </View>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Longitud" value={String(form.longitude)} onChangeText={(value) => setForm((prev) => ({ ...prev, longitude: Number(value) || -74.2555 }))} keyboardType="decimal-pad" placeholder="-74.2555" />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Etiquetas</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Agrega una etiqueta..."
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.tagAddBtn} onPress={addTag}>
                  <MaterialIcons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.tagsRow}>
                {form.tags.map((tag) => (
                  <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                    <MaterialIcons name="close" size={12} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              {form.imageUrl ? (
                <View style={styles.previewSection}>
                  <Text style={styles.fieldLabel}>Vista previa</Text>
                  <Image source={{ uri: form.imageUrl }} style={styles.previewImg} contentFit="cover" transition={300} />
                </View>
              ) : null}

              <View style={styles.qrDisplay}>
                <MaterialIcons name="qr-code" size={32} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.qrDisplayLabel}>Codigo QR generado</Text>
                  <Text style={styles.qrDisplayCode}>{form.qrCode}</Text>
                </View>
                <TouchableOpacity style={styles.qrPreviewBtn} onPress={() => openQRPreview(form.qrCode, form.name || 'Lugar')}>
                  <MaterialIcons name="visibility" size={18} color={Colors.primary} />
                  <Text style={styles.qrPreviewBtnText}>Ver QR</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Editar usuario</Text>
              <TouchableOpacity onPress={handleSaveUser} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.saveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>Perfil del usuario</Text>

              <AdminInput label="Nombre *" value={userForm.username} onChangeText={(value) => setUserForm((prev) => ({ ...prev, username: value }))} placeholder="Nombre visible" />
              <AdminInput label="Correo del perfil *" value={userForm.email} onChangeText={(value) => setUserForm((prev) => ({ ...prev, email: value }))} placeholder="correo@ejemplo.com" keyboardType="email-address" />
              <AdminInput label="Puntos" value={userForm.points} onChangeText={(value) => setUserForm((prev) => ({ ...prev, points: value }))} placeholder="0" keyboardType="number-pad" />
              <AdminInput label="Avatar URL" value={userForm.avatarUrl} onChangeText={(value) => setUserForm((prev) => ({ ...prev, avatarUrl: value }))} placeholder="https://..." />

              <Text style={styles.fieldLabel}>Permisos</Text>
              <TouchableOpacity
                style={[styles.toggleCard, userForm.isAdmin && styles.toggleCardActive]}
                onPress={() => setUserForm((prev) => ({ ...prev, isAdmin: !prev.isAdmin }))}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Acceso administrativo</Text>
                  <Text style={styles.toggleText}>
                    {userForm.isAdmin ? 'Este usuario puede entrar al panel admin.' : 'Este usuario no tiene acceso admin.'}
                  </Text>
                </View>
                <MaterialIcons
                  name={userForm.isAdmin ? 'toggle-on' : 'toggle-off'}
                  size={34}
                  color={userForm.isAdmin ? Colors.success : Colors.textMuted}
                />
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>Colecciones editables</Text>
              <AdminInput label="Lugares visitados" value={userForm.visitedPlaces} onChangeText={(value) => setUserForm((prev) => ({ ...prev, visitedPlaces: value }))} placeholder="plaza-del-centenario, malecon" multiline />
              <AdminInput label="QR escaneados" value={userForm.scannedQrs} onChangeText={(value) => setUserForm((prev) => ({ ...prev, scannedQrs: value }))} placeholder="QR_PLAZA_2024, QR_MALECON_2024" multiline />
              <AdminInput label="Insignias desbloqueadas" value={userForm.unlockedBadges} onChangeText={(value) => setUserForm((prev) => ({ ...prev, unlockedBadges: value }))} placeholder="primer-qr, explorador-total" multiline />

              <View style={styles.infoCard}>
                <MaterialIcons name="info" size={18} color={Colors.primary} />
                <Text style={styles.infoText}>
                  El correo y los datos editados aqui pertenecen al perfil en `user_profiles`.
                  Para cambiar la contrasena del usuario, usa el boton de restablecimiento por correo.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.qrModalTitle}>Vista previa del QR</Text>
                <Text style={styles.qrModalSubtitle}>{selectedQR?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View ref={qrCaptureRef} collapsable={false} style={styles.qrCanvas}>
              <Text style={styles.qrCanvasTitle}>{selectedQR?.name || 'Lugar turistico'}</Text>
              <View style={styles.qrCanvasCode}>
                <QRCode value={selectedQR?.qrCode || 'QR'} size={220} backgroundColor="#FFFFFF" color="#0A0E1A" />
              </View>
              <Text style={styles.qrCanvasText}>{selectedQR?.qrCode}</Text>
            </View>

            <TouchableOpacity style={styles.saveQrBtn} onPress={handleSaveQRToGallery} disabled={savingQr}>
              <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.saveQrBtnGrad}>
                {savingQr ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name={Platform.OS === 'web' ? 'download' : 'photo-library'} size={20} color="#FFF" />
                    <Text style={styles.saveQrBtnText}>{Platform.OS === 'web' ? 'Descargar QR' : 'Guardar en galeria'}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AdminInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'decimal-pad';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={aiStyles.label}>{label}</Text>
      <TextInput
        style={[aiStyles.input, multiline && aiStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
  colors,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  colors: [string, string];
}) {
  return (
    <View style={styles.statCard}>
      <LinearGradient colors={colors} style={styles.statCardGrad}>
        <MaterialIcons name={icon} size={26} color="#FFF" />
        <Text style={styles.statNum}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

function joinCsv(items?: string[]) {
  return (items || []).join(', ');
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFileName(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase() || 'codigo'
  );
}

function normalizeQRValue(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toUpperCase();
}

const aiStyles = StyleSheet.create({
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    height: 48,
  },
  multiline: {
    height: 88,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.blue,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  list: {
    flex: 1,
  },
  screenContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  placeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  placeRowImg: {
    width: 70,
    height: 70,
  },
  placeRowInfo: {
    flex: 1,
    padding: Spacing.sm,
    gap: 4,
  },
  placeRowName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  placeRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  placeRowPts: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  placeRowQR: {
    color: Colors.textMuted,
    fontSize: 9,
    flex: 1,
  },
  inlineIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '16',
  },
  placeRowActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  userActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  emptyBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  emptyBtnGrad: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bgSurface,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userHeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  userStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  userStat: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold + '18',
    borderWidth: 1,
    borderColor: Colors.gold + '33',
  },
  adminPillText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  statGrid: {
    gap: Spacing.sm,
  },
  statCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  statCardGrad: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.xl,
  },
  statNum: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  catCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
  },
  catCount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  catLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 20,
    flex: 1,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  gateTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  gateText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  gateEmail: {
    color: Colors.primary,
    fontSize: FontSize.sm,
  },
  gateBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  gateBtnGrad: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  gateBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  backLinkText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  saveText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  catChipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  tagAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  previewSection: {
    gap: Spacing.xs,
  },
  previewImg: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
  },
  qrDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  qrDisplayLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  qrDisplayCode: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  qrPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '16',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  qrPreviewBtnText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  toggleCardActive: {
    borderColor: Colors.success + '66',
    backgroundColor: Colors.success + '10',
  },
  toggleTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  qrModalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.lg,
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  qrModalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  qrModalSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  qrCanvas: {
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  qrCanvasTitle: {
    color: '#0A0E1A',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  qrCanvasCode: {
    padding: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  qrCanvasText: {
    color: '#334155',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  saveQrBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  saveQrBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  saveQrBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

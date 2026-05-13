import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { TouristPlace, PlaceCategory, CATEGORIES } from '@/constants/places';
import { fetchPlaces, createPlace, updatePlace, deletePlace } from '@/services/supabaseService';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

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

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAdmin, isAuthenticated, authUser } = useApp();
  const { showAlert } = useAlert();

  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<TouristPlace | null>(null);
  const [form, setForm] = useState<Omit<TouristPlace, 'id'>>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'places' | 'stats'>('places');

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    setLoading(true);
    const data = await fetchPlaces();
    setPlaces(data);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingPlace(null);
    setForm({ ...DEFAULT_FORM, qrCode: `QR_${Date.now()}` });
    setTagInput('');
    setShowModal(true);
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
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showAlert('Error', 'El nombre es requerido');
      return;
    }
    if (!form.imageUrl.trim()) {
      showAlert('Error', 'La URL de imagen es requerida');
      return;
    }

    setSaving(true);
    let error: string | null = null;

    if (editingPlace) {
      const result = await updatePlace(editingPlace.id, form);
      error = result.error;
    } else {
      const result = await createPlace(form);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      showAlert('Error al guardar', error);
      return;
    }

    showAlert('Guardado', editingPlace ? 'Lugar actualizado correctamente' : 'Nuevo lugar creado correctamente');
    setShowModal(false);
    loadPlaces();
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
              showAlert('Eliminado', 'Lugar desactivado correctamente');
              loadPlaces();
            }
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
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleDownloadQR = async (qrCode: string, name: string) => {
    if (!qrCode) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=500x500`;

    try {
      // Si es Web, cacheDirectory es null. Abrimos en pestaña nueva para descargar.
      if (Platform.OS === 'web') {
        window.open(qrUrl, '_blank');
        return;
      }

      const cacheDir = FileSystem.cacheDirectory;

      if (!cacheDir) {
        showAlert('Error', 'El almacenamiento temporal no está disponible');
        return;
      }

      // Primero creas el nombre limpio
      const safeName = (name || 'qr')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase() || 'codigo';

      // Luego creas el fileUri
      const fileUri = `${cacheDir}${safeName}_qr.png`;

      // Descargar archivo
      const result = await FileSystem.downloadAsync(qrUrl, fileUri);

      if (result.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri, { mimeType: 'image/png', dialogTitle: `QR ${name}` });
        } else {
          showAlert('Error', 'La función de compartir no está disponible en este dispositivo');
        }
      } else {
        showAlert('Error', 'El servidor de códigos QR no respondió correctamente (Error ' + result.status + ')');
      }
    } catch (error) {
      console.error('QR Download Error:', error);
      showAlert('Error', 'No se pudo descargar el QR.');
    }
  };

  // Gate: must be authenticated and admin
  if (!isAuthenticated) {
    return (
      <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
        <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary]} style={StyleSheet.absoluteFill} />
        <MaterialIcons name="admin-panel-settings" size={70} color={Colors.primary} />
        <Text style={styles.gateTitle}>Área Administrativa</Text>
        <Text style={styles.gateText}>Debes iniciar sesión para acceder al panel de administrador.</Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => router.push('/login')}>
          <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.gateBtnGrad}>
            <Text style={styles.gateBtnText}>Iniciar sesión</Text>
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
        <Text style={styles.gateTitle}>Acceso Denegado</Text>
        <Text style={styles.gateText}>No tienes permisos de administrador. Contacta al equipo de Descubre Ciénaga.</Text>
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
      {/* Header */}
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
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['places', 'stats'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={tab === 'places' ? 'place' : 'bar-chart'}
              size={18}
              color={activeTab === tab ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'places' ? 'Lugares' : 'Estadísticas'}
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
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + Spacing.xl, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {places.map((place) => (
            <View key={place.id} style={styles.placeRow}>
              <Image
                source={{ uri: place.imageUrl }}
                style={styles.placeRowImg}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.placeRowInfo}>
                <Text style={styles.placeRowName} numberOfLines={1}>{place.name}</Text>
                <CategoryBadge category={place.category} />
                <View style={styles.placeRowMeta}>
                  <MaterialIcons name="stars" size={12} color={Colors.gold} />
                  <Text style={styles.placeRowPts}>{place.points} pts</Text>
                  <Text style={styles.placeRowQR} numberOfLines={1}>{place.qrCode}</Text>
                  <TouchableOpacity onPress={() => handleDownloadQR(place.qrCode, place.name)}>
                    <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: FontWeight.bold, marginLeft: Spacing.xs }}>
                      Descargar
                    </Text>
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
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
          <View style={styles.statCard}>
            <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.statCardGrad}>
              <MaterialIcons name="place" size={28} color="#FFF" />
              <Text style={styles.statNum}>{places.length}</Text>
              <Text style={styles.statLabel}>Lugares activos</Text>
            </LinearGradient>
          </View>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const count = places.filter((p) => p.category === cat.id).length;
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
              Los QR codes se pueden imprimir y colocar en cada lugar turístico.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingPlace ? 'Editar lugar' : 'Nuevo lugar turístico'}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.saveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Basic Info */}
              <Text style={styles.sectionLabel}>Información básica</Text>

              <AdminInput label="Nombre del lugar *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Plaza del Centenario" />
              <AdminInput label="Descripción corta *" value={form.shortDescription} onChangeText={(v) => setForm((p) => ({ ...p, shortDescription: v }))} placeholder="El corazón histórico..." multiline />
              <AdminInput label="Descripción completa" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Descripción detallada..." multiline />
              <AdminInput label="Dirección" value={form.address} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="Cra. 17 #12-00, Ciénaga" />
              <AdminInput label="URL de imagen *" value={form.imageUrl} onChangeText={(v) => setForm((p) => ({ ...p, imageUrl: v }))} placeholder="https://images.unsplash.com/..." />
              <AdminInput label="Texto de audioguía" value={form.audioText} onChangeText={(v) => setForm((p) => ({ ...p, audioText: v }))} placeholder="Narración del lugar..." multiline />
              <AdminInput label="Insignia" value={form.badge} onChangeText={(v) => setForm((p) => ({ ...p, badge: v }))} placeholder="🏛️ Guardián de la Historia" />
              <AdminInput label="Código QR" value={form.qrCode} onChangeText={(v) => setForm((p) => ({ ...p, qrCode: v }))} placeholder="QR_PLAZA_CENTENARIO_2024" />

              {/* Category */}
              <Text style={styles.fieldLabel}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xs }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 }}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, form.category === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color }]}
                      onPress={() => setForm((p) => ({ ...p, category: cat.id }))}
                    >
                      <Text style={[styles.catChipText, form.category === cat.id && { color: cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* AR Type */}
              <Text style={styles.fieldLabel}>Tipo AR</Text>
              <View style={styles.chipRow}>
                {(['history', 'legend', 'nature', 'culture'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, form.arType === type && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, arType: type }))}
                  >
                    <Text style={[styles.chipText, form.arType === type && styles.chipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty */}
              <Text style={styles.fieldLabel}>Dificultad</Text>
              <View style={styles.chipRow}>
                {(['facil', 'medio', 'dificil'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, form.difficulty === d && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, difficulty: d }))}
                  >
                    <Text style={[styles.chipText, form.difficulty === d && styles.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Numbers */}
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Puntos" value={String(form.points)} onChangeText={(v) => setForm((p) => ({ ...p, points: Number(v) || 100 }))} keyboardType="number-pad" placeholder="100" />
                </View>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Duración visita" value={form.visitDuration} onChangeText={(v) => setForm((p) => ({ ...p, visitDuration: v }))} placeholder="45 min" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Latitud" value={String(form.latitude)} onChangeText={(v) => setForm((p) => ({ ...p, latitude: Number(v) || 11.007 }))} keyboardType="decimal-pad" placeholder="11.007" />
                </View>
                <View style={{ flex: 1 }}>
                  <AdminInput label="Longitud" value={String(form.longitude)} onChangeText={(v) => setForm((p) => ({ ...p, longitude: Number(v) || -74.255 }))} keyboardType="decimal-pad" placeholder="-74.255" />
                </View>
              </View>

              {/* Tags */}
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

              {/* Preview image */}
              {form.imageUrl ? (
                <View style={{ gap: Spacing.xs }}>
                  <Text style={styles.fieldLabel}>Vista previa</Text>
                  <Image source={{ uri: form.imageUrl }} style={styles.previewImg} contentFit="cover" transition={300} />
                </View>
              ) : null}

              {/* QR Code display */}
              <View style={styles.qrDisplay}>
                <MaterialIcons name="qr-code" size={32} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.qrDisplayLabel}>Código QR generado</Text>
                  <Text style={styles.qrDisplayCode}>{form.qrCode}</Text>
                </View>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '22', padding: 8, borderRadius: Radius.md }}
                  onPress={() => handleDownloadQR(form.qrCode, form.name || 'Lugar')}
                >
                  <MaterialIcons name="file-download" size={20} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold }}>Descargar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
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
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
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
  list: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },
  placeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  placeRowImg: { width: 70, height: 70 },
  placeRowInfo: { flex: 1, padding: Spacing.sm, gap: 4 },
  placeRowName: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  placeRowMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  placeRowPts: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  placeRowQR: { color: Colors.textMuted, fontSize: 9, flex: 1 },
  placeRowActions: { flexDirection: 'row', gap: Spacing.xs, paddingRight: Spacing.sm },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.danger + '22', alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
  emptyBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  // Stats
  statCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  statCardGrad: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.xl },
  statNum: { color: '#FFF', fontSize: 48, fontWeight: FontWeight.extrabold },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center',
    gap: Spacing.sm, borderWidth: 1,
  },
  catCount: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  catLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, textAlign: 'center' },
  infoCard: {
    flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '33',
  },
  infoText: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 20, flex: 1 },
  // Gate
  gateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  gateTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, textAlign: 'center' },
  gateText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  gateEmail: { color: Colors.primary, fontSize: FontSize.sm },
  gateBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  gateBtnGrad: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  gateBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.md },
  backLinkText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bgPrimary },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  saveText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  modalScroll: { flex: 1 },
  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginLeft: 4 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, backgroundColor: Colors.bgSurface,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, backgroundColor: Colors.bgSurface,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  tagInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  tagInput: {
    flex: 1, backgroundColor: Colors.bgSurface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
    height: 44, color: Colors.textPrimary, fontSize: FontSize.sm,
  },
  tagAddBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '22',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '44',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bgSurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagChipText: { color: Colors.textMuted, fontSize: FontSize.xs },
  previewImg: { width: '100%', height: 160, borderRadius: Radius.lg },
  qrDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '33',
  },
  qrDisplayLabel: { color: Colors.textSecondary, fontSize: FontSize.xs },
  qrDisplayCode: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

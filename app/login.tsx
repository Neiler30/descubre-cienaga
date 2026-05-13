import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSupabaseClient } from '@/template';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

type Mode = 'login' | 'register' | 'otp';

const supabase = getSupabaseClient();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Campos requeridos', 'Por favor ingresa email y contraseña');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      showAlert('Error al ingresar', error.message);
      return;
    }
    router.replace('/(tabs)' as any);
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert('Email requerido', 'Por favor ingresa tu email');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Contraseñas no coinciden', 'Por favor verifica tu contraseña');
      return;
    }
    if (password.length < 6) {
      showAlert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) {
      showAlert('Error', error.message);
      return;
    }
    setMode('otp');
    showAlert('Código enviado', `Revisa tu correo ${email} para el código de verificación`);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('Código requerido', 'Ingresa el código de verificación');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });
    if (error) {
      setLoading(false);
      showAlert('Código inválido', error.message);
      return;
    }
    // Update password after OTP verification
    if (data.session && password) {
      await supabase.auth.updateUser({ password });
    }
    setLoading(false);
    router.replace('/(tabs)' as any);
  };

  const handleSkip = () => {
    router.replace('/(tabs)' as any);
  };

  return (
    <LinearGradient colors={[Colors.bgDeep, Colors.bgPrimary, Colors.bgDeep]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/explorer-badge.png')}
              style={styles.logo}
              contentFit="contain"
              transition={300}
            />
            <Text style={styles.appName}>Descubre Ciénaga</Text>
            <Text style={styles.appTagline}>Tu guía turística interactiva</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Mode Tabs */}
            {mode !== 'otp' && (
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'login' && styles.tabActive]}
                  onPress={() => setMode('login')}
                >
                  <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                    Ingresar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'register' && styles.tabActive]}
                  onPress={() => setMode('register')}
                >
                  <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                    Registrarme
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* OTP Mode */}
            {mode === 'otp' && (
              <View style={styles.otpSection}>
                <View style={styles.otpIcon}>
                  <MaterialIcons name="mark-email-read" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.otpTitle}>Verifica tu email</Text>
                <Text style={styles.otpSub}>
                  Enviamos un código de 4 dígitos a{'\n'}
                  <Text style={{ color: Colors.primary }}>{email}</Text>
                </Text>

                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="0000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.gradientBlue as [string, string]}
                    style={styles.primaryBtnGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <MaterialIcons name="check-circle" size={20} color="#FFF" />
                        <Text style={styles.primaryBtnText}>Verificar código</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('register')} style={styles.linkBtn}>
                  <Text style={styles.linkText}>Cambiar email</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="email" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tu@email.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPass}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                      <MaterialIcons
                        name={showPass ? 'visibility-off' : 'visibility'}
                        size={18}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.gradientBlue as [string, string]}
                    style={styles.primaryBtnGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <MaterialIcons name="login" size={20} color="#FFF" />
                        <Text style={styles.primaryBtnText}>Ingresar</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="email" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tu@email.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                      <MaterialIcons
                        name={showPass ? 'visibility-off' : 'visibility'}
                        size={18}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPass}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.gradientGreen as [string, string]}
                    style={styles.primaryBtnGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color="#FFF" />
                        <Text style={styles.primaryBtnText}>Enviar código de verificación</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Explorar sin cuenta</Text>
            <MaterialIcons name="arrow-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Admin hint */}
          <View style={styles.adminHint}>
            <MaterialIcons name="admin-panel-settings" size={14} color={Colors.textMuted} />
            <Text style={styles.adminHintText}>
              Admin: admin@descubrecienaga.co / CienagaAdmin2024!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 90,
    height: 90,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
  },
  appTagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
    gap: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: FontWeight.bold,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    height: '100%',
  },
  eyeBtn: {
    padding: Spacing.sm,
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 54,
    borderRadius: Radius.lg,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  // OTP
  otpSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  otpIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  otpSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 12,
    width: '100%',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    height: 64,
    color: Colors.textPrimary,
  },
  linkBtn: {
    padding: Spacing.sm,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  adminHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminHintText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});

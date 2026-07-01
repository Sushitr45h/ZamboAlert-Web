import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  ScrollView, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PrimaryButton } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { signUp, loading, error, clearError } = useAuth();
  const [role, setRole]               = useState('citizen');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPassword, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError]   = useState('');

  const combinedError = localError || error;
  function handleChange() { if (localError) setLocalError(''); if (error) clearError(); }

  async function handleSignUp() {
    setLocalError('');
    if (!name.trim())         { setLocalError('Please enter your full name.'); return; }
    if (!email.includes('@')) { setLocalError('Please enter a valid email address.'); return; }
    if (password.length < 8)  { setLocalError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setLocalError('Passwords do not match.'); return; }
    await signUp(name, email, password, role);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.logoRow}>
            <View style={styles.logoChip}>
              <Ionicons name="play" size={18} color={colors.textOnPrimary} />
            </View>
            <Text style={typography.appTitle}>ZamboAlert</Text>
          </View>

          <Text style={styles.heading}>Create an account</Text>
          <Text style={[typography.meta, styles.sub]}>
            Tell us who you are so we can route you to the right experience.
          </Text>

          <Text style={[typography.eyebrow, styles.fieldLabel]}>I am a</Text>
          <View style={styles.roleRow}>
            <RolePill label="Citizen" icon="person-outline" description="I need to send an SOS"   active={role === 'citizen'} onPress={() => { setRole('citizen');  handleChange(); }} />
            <RolePill label="Rescuer" icon="shield-outline" description="I respond to emergencies" active={role === 'rescuer'} onPress={() => { setRole('rescuer'); handleChange(); }} />
          </View>

          {role === 'rescuer' && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.statusSelf} />
              <Text style={[typography.meta, { flex: 1, color: colors.statusSelf, lineHeight: 18 }]}>
                The rescuer dashboard is coming soon. Your account will be ready when it launches.
              </Text>
            </View>
          )}

          <Text style={[typography.eyebrow, styles.fieldLabel]}>Full name</Text>
          <InputField icon="person-outline" placeholder="Juan Dela Cruz" value={name}
            onChangeText={(t) => { setName(t); handleChange(); }} autoCapitalize="words" />

          <Text style={[typography.eyebrow, styles.fieldLabel]}>Email</Text>
          <InputField icon="mail-outline" placeholder="you@example.com" value={email}
            onChangeText={(t) => { setEmail(t); handleChange(); }} keyboardType="email-address" />

          <Text style={[typography.eyebrow, styles.fieldLabel]}>Password</Text>
          <InputField icon="lock-closed-outline" placeholder="At least 8 characters" value={password}
            onChangeText={(t) => { setPassword(t); handleChange(); }}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPass(!showPassword)} />

          <Text style={[typography.eyebrow, styles.fieldLabel]}>Confirm password</Text>
          <InputField icon="lock-closed-outline" placeholder="Re-enter your password" value={confirm}
            onChangeText={(t) => { setConfirm(t); handleChange(); }}
            secureTextEntry={!showConfirm}
            rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowConfirm(!showConfirm)} />

          {combinedError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.errorText}>{combinedError}</Text>
            </View>
          ) : null}

          <View style={styles.submitRow}>
            {loading
              ? <ActivityIndicator color={colors.primary} size="large" />
              : <PrimaryButton label="Create account" icon="checkmark-circle-outline" onPress={handleSignUp}
                  disabled={!name.trim() || !email.trim() || !password || !confirm} />
            }
          </View>

          <View style={styles.switchRow}>
            <Text style={typography.meta}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RolePill({ label, icon, description, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.rolePill, active && styles.rolePillActive]}>
      <View style={[styles.rolePillIcon, active && styles.rolePillIconActive]}>
        <Ionicons name={icon} size={20} color={active ? colors.primary : colors.textSecondary} />
      </View>
      {active && <View style={styles.checkmark}><Ionicons name="checkmark" size={13} color="#fff" /></View>}
      <Text style={[styles.rolePillText, active && styles.rolePillTextActive]}>{label}</Text>
      <Text style={styles.rolePillDesc}>{description}</Text>
    </Pressable>
  );
}

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightIcon, onRightIconPress }) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={colors.textMuted}
        value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize || 'none'} autoCorrect={false} />
      {rightIcon ? (
        <Pressable onPress={onRightIconPress} hitSlop={8}>
          <Ionicons name={rightIcon} size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  logoChip: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.textPrimary },
  sub: { marginTop: 4, marginBottom: 28, lineHeight: 19 },
  fieldLabel: { marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  rolePill: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, gap: 6, position: 'relative' },
  rolePillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  rolePillIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.inactiveBg, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  rolePillIconActive: { backgroundColor: 'rgba(224,52,43,0.15)' },
  rolePillText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.textSecondary },
  rolePillTextActive: { color: colors.primary },
  rolePillDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },
  checkmark: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(47,111,237,0.08)', borderRadius: 10, padding: 12, marginBottom: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, gap: 10 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textPrimary },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(224,52,43,0.08)', borderRadius: 10, padding: 12, marginBottom: 8 },
  errorText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary, lineHeight: 18 },
  submitRow: { marginTop: 8, marginBottom: 24 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
});

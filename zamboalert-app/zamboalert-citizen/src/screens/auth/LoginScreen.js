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

export default function LoginScreen({ navigation }) {
  const { login, loading, error, clearError } = useAuth();
  const [role, setRole]             = useState('citizen');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    await login(email, password, role);
  }
  function handleChange() { if (error) clearError(); }

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

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={[styles.sub, { color: colors.primary }]}>
            Sign in to your account to continue and stay alert.
          </Text>

          <Text style={[typography.eyebrow, styles.fieldLabel]}>I am a</Text>
          <View style={styles.roleRow}>
            <RolePill label="Citizen" icon="person-outline"  active={role === 'citizen'} onPress={() => { setRole('citizen');  handleChange(); }} />
            <RolePill label="Rescuer" icon="shield-outline"  active={role === 'rescuer'} onPress={() => { setRole('rescuer'); handleChange(); }} />
          </View>

          <Text style={[typography.eyebrow, styles.fieldLabel]}>Email</Text>
          <InputField icon="mail-outline" placeholder="you@example.com" value={email}
            onChangeText={(t) => { setEmail(t); handleChange(); }} keyboardType="email-address" />

          <Text style={[typography.eyebrow, styles.fieldLabel]}>Password</Text>
          <InputField icon="lock-closed-outline" placeholder="Your password" value={password}
            onChangeText={(t) => { setPassword(t); handleChange(); }}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPass(!showPassword)} />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.submitRow}>
            {loading
              ? <ActivityIndicator color={colors.primary} size="large" />
              : <PrimaryButton label="Log in" icon="log-in-outline" onPress={handleLogin} disabled={!email.trim() || !password} />
            }
          </View>

          <View style={styles.demoBox}>
            <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
            <Text style={[typography.meta, styles.demoText]}>
              Demo — Citizen: citizen@test.com / Rescuer: rescuer@test.com{'\n'}Password: test1234
            </Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={typography.meta}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>Sign up</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RolePill({ label, icon, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.rolePill, active && styles.rolePillActive]}>
      <Ionicons name={icon} size={18} color={active ? colors.primary : colors.textSecondary} />
      <Text style={[styles.rolePillText, active && styles.rolePillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, rightIcon, onRightIconPress }) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={colors.textMuted}
        value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry}
        keyboardType={keyboardType} autoCapitalize="none" autoCorrect={false} />
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
  sub: { marginTop: 4, marginBottom: 28, lineHeight: 19, fontFamily: 'Inter_400Regular', fontSize: 13 },
  fieldLabel: { marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  rolePill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  rolePillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  rolePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textSecondary },
  rolePillTextActive: { color: colors.primary },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, gap: 10 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textPrimary },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(224,52,43,0.08)', borderRadius: 10, padding: 12, marginBottom: 8 },
  errorText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary, lineHeight: 18 },
  submitRow: { marginTop: 8, marginBottom: 16 },
  demoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.inactiveBg, borderRadius: 10, padding: 12, marginBottom: 24 },
  demoText: { flex: 1, lineHeight: 18 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 8 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
});

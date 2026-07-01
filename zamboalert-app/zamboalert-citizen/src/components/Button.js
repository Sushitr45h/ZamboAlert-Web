import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

export function PrimaryButton({ label, icon, onPress, disabled, fullWidth = true }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && { backgroundColor: colors.primaryDark },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 8 }} /> : null}
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, icon, onPress, fullWidth = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        fullWidth && styles.fullWidth,
        pressed && { backgroundColor: colors.border },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.textPrimary} style={{ marginRight: 8 }} /> : null}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function SOSButton({ active, onPress }) {
  function handlePress() {
    Haptics.notificationAsync(
      active ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    onPress();
  }
  return (
    <Pressable onPress={handlePress} style={[styles.sos, active && styles.sosActive]}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name={active ? 'radio' : 'warning'} size={36} color="#FFFFFF" />
        <Text style={styles.sosLabel}>{active ? 'BROADCASTING' : 'SEND SOS'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  disabled: { opacity: 0.5 },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inactiveBg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  secondaryLabel: {
    color: '#1A1A1A',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  fullWidth: { width: '100%' },
  sos: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  sosActive: { backgroundColor: colors.primaryDark },
  sosLabel: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.5 },
});

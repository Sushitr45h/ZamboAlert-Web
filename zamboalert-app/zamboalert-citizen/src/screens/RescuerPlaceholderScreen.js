// src/screens/RescuerPlaceholderScreen.js
//
// Shown when a user with role === 'rescuer' logs in.
// Replace this entire screen (or its contents) with the real rescuer tab
// navigator when the rescuer side is ready — the routing in RootNavigator.js
// already handles it: just swap this component for <RescuerTabNavigator />.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { SecondaryButton } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function RescuerPlaceholderScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>

        {/* Brand */}
        <View style={styles.logoRow}>
          <View style={styles.logoChip}>
            <Ionicons name="play" size={18} color={colors.textOnPrimary} />
          </View>
          <Text style={typography.appTitle}>ZamboAlert</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>rescuers</Text>
          </View>
        </View>

        {/* Illustration */}
        <View style={styles.iconWrap}>
          <Ionicons name="shield-outline" size={64} color={colors.primary} />
        </View>

        {/* Copy */}
        <Text style={styles.heading}>Rescuer portal{'\n'}coming soon</Text>
        <Text style={[typography.meta, styles.body]}>
          Your account is set up and ready. The rescuer dashboard — with the
          radar, pod map, and victim log — is actively being built and will be
          available in the next release.
        </Text>

        {/* User info */}
        <View style={styles.userCard}>
          <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={typography.body}>{user?.name}</Text>
            <Text style={typography.meta}>{user?.email}</Text>
          </View>
          <View style={styles.roleDot}>
            <Text style={styles.roleDotText}>Rescuer</Text>
          </View>
        </View>

        <SecondaryButton label="Log out" icon="log-out-outline" onPress={logout} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  logoChip: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  iconWrap: {
    width: 110, height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  heading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  body: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  roleDot: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  roleDotText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
});

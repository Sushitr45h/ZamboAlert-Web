import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PrimaryButton, SecondaryButton } from '../../components/Button';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Ionicons name="location" size={40} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.appName}>ZamboAlert</Text>
        <Text style={styles.tagline}>
          Emergency communication for Zamboanga City — even when all signals are gone.
        </Text>
        <View style={styles.pillRow}>
          <Pill icon="bluetooth" label="BLE Beacon" />
          <Pill icon="radio-outline" label="LoRa Mesh" />
          <Pill icon="navigate" label="GPS Offline" />
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.bottomHeading}>Get started</Text>
        <Text style={[typography.meta, styles.bottomSub]}>
          Sign in to your account or create a new one to access emergency
          services and stay connected during crises.
        </Text>
        <View style={styles.buttonStack}>
          <PrimaryButton label="Sign in" icon="arrow-forward-outline" onPress={() => navigation.navigate('Login')} />
          <SecondaryButton label="Create an account" onPress={() => navigation.navigate('SignUp')} fullWidth />
        </View>
        <Text style={[typography.meta, styles.disclaimer]}>
          By continuing you agree to ZamboAlert's terms of use and privacy policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Pill({ icon, label }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.85)" />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontFamily: 'Inter_700Bold', fontSize: 34,
    color: colors.textOnPrimary, letterSpacing: -0.5, marginBottom: 10,
  },
  tagline: {
    fontFamily: 'Inter_400Regular', fontSize: 15,
    color: 'rgba(255,255,255,0.80)', textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  bottom: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 16,
  },
  bottomHeading: { fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.textPrimary, marginBottom: 6 },
  bottomSub: { lineHeight: 19, marginBottom: 24 },
  buttonStack: { gap: 12 },
  disclaimer: { textAlign: 'center', marginTop: 16, lineHeight: 17, fontSize: 11 },
});

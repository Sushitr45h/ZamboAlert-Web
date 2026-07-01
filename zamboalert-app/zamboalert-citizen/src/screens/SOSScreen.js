// src/screens/SOSScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Header from '../components/Header';
import AlertBanner from '../components/AlertBanner';
import Card from '../components/Card';
import { useAppState } from '../context/AppStateContext';

// ─── Disaster types ─────────────────────────────────────────────────────────
const DISASTERS = [
  {
    id: 'earthquake',
    label: 'Earthquake',
    icon: 'earth-outline',
    color: '#C0792A',
    bg: 'rgba(192,121,42,0.12)',
  },
  {
    id: 'flood',
    label: 'Flash Flood',
    icon: 'water-outline',
    color: '#2F6FED',
    bg: 'rgba(47,111,237,0.12)',
  },
  {
    id: 'landslide',
    label: 'Landslide',
    icon: 'layers-outline',
    color: '#7C5C2E',
    bg: 'rgba(124,92,46,0.12)',
  },
  {
    id: 'fire',
    label: 'Fire',
    icon: 'flame-outline',
    color: '#E0342B',
    bg: 'rgba(224,52,43,0.12)',
  },
];

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function SOSScreen({ navigation }) {
  const {
    sosActive, disasterType,
    bluetoothOn, gpsLocked, nearbyPods,
    startBeacon, stopBeacon,
  } = useAppState();

  const activeDisaster = DISASTERS.find((d) => d.id === disasterType);

  const statusLine = sosActive
    ? `Broadcasting · ${nearbyPods.length} pod${nearbyPods.length === 1 ? '' : 's'} in range`
    : 'Tap your emergency to send SOS instantly';

  function handleTap(disaster) {
    if (sosActive) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    startBeacon(disaster.id);
  }

  function handleStop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    stopBeacon();
  }

  return (
    <View style={styles.screen}>
      <Header
        statusLine={statusLine}
        statusDotColor={sosActive ? colors.primary : colors.statusUnknown}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      {sosActive && activeDisaster && (
        <AlertBanner
          message={`SOS ACTIVE — ${activeDisaster.label.toUpperCase()} EMERGENCY`}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Heading ──────────────────────────────────────────────────── */}
        <View style={styles.heading}>
          <Text style={styles.headingTitle}>
            {sosActive ? 'SOS Beacon Live' : 'What is your emergency?'}
          </Text>
          <Text style={[typography.meta, styles.headingSub]}>
            {sosActive
              ? 'Your beacon is broadcasting. Stay where you are if it\'s safe.'
              : 'Tap once to immediately broadcast your SOS. No confirmation needed.'}
          </Text>
        </View>

        {/* ── Disaster grid ─────────────────────────────────────────────── */}
        <View style={styles.grid}>
          {DISASTERS.map((d) => {
            const isActive = sosActive && disasterType === d.id;
            const isOther  = sosActive && disasterType !== d.id;
            return (
              <DisasterCard
                key={d.id}
                disaster={d}
                active={isActive}
                dimmed={isOther}
                onPress={() => handleTap(d)}
              />
            );
          })}
        </View>

        {/* ── Active: stop button ───────────────────────────────────────── */}
        {sosActive && (
          <Pressable onPress={handleStop} style={styles.stopBtn}>
            <Ionicons name="stop-circle-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.stopText}>Stop Broadcasting</Text>
          </Pressable>
        )}

        {/* ── Device status ─────────────────────────────────────────────── */}
        <Card style={styles.statusCard}>
          <Text style={[typography.eyebrow, { marginBottom: 10 }]}>Device status</Text>
          <StatusRow icon="bluetooth"     label="Bluetooth"     value={bluetoothOn ? 'On' : 'Off'} ok={bluetoothOn} />
          <StatusRow icon="navigate"      label="GPS lock"      value={gpsLocked ? 'Locked' : 'Searching…'} ok={gpsLocked} />
          <StatusRow icon="radio-outline" label="Pods in range" value={String(nearbyPods.length)} ok={nearbyPods.length > 0} isLast />
        </Card>
      </ScrollView>
    </View>
  );
}

// ─── Disaster card ──────────────────────────────────────────────────────────
function DisasterCard({ disaster, active, dimmed, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={dimmed}
      style={({ pressed }) => [
        cardStyles.card,
        { backgroundColor: active ? disaster.color : disaster.bg },
        active  && cardStyles.activeElevation,
        dimmed  && cardStyles.dimmed,
        pressed && !dimmed && cardStyles.pressed,
      ]}
    >
      {/* Live pulse ring when active */}
      {active && <View style={[cardStyles.pulse, { borderColor: disaster.color }]} />}

      <Ionicons
        name={disaster.icon}
        size={36}
        color={active ? '#fff' : disaster.color}
      />
      <Text style={[cardStyles.label, active && cardStyles.labelActive]}>
        {disaster.label}
      </Text>

      {active && (
        <View style={cardStyles.liveBadge}>
          <Text style={cardStyles.liveBadgeText}>LIVE</Text>
        </View>
      )}
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 10,
  },
  activeElevation: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  dimmed: { opacity: 0.3 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    textAlign: 'center',
    width: '100%',
  },
  labelActive: { color: '#fff' },
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.8,
  },
  pulse: {
    position: 'absolute',
    width: '120%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.25,
  },
});

// ─── Status row ──────────────────────────────────────────────────────────────
function StatusRow({ icon, label, value, ok, isLast }) {
  return (
    <View style={[styles.statusRow, !isLast && styles.statusRowBorder]}>
      <View style={styles.statusLeft}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={typography.body}>{label}</Text>
      </View>
      <Text style={[typography.body, {
        color: ok ? colors.success : colors.textMuted,
        fontFamily: 'Inter_600SemiBold',
      }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 16 },

  heading: { gap: 4 },
  headingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  headingSub: { lineHeight: 19 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.textPrimary,
    paddingVertical: 15,
    borderRadius: 14,
  },
  stopText: {
    color: colors.textOnPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },

  statusCard: {},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statusRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

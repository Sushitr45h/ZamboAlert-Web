// src/screens/StatusScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Header from '../components/Header';
import Card from '../components/Card';
import StatusDot from '../components/StatusDot';
import { useAppState } from '../context/AppStateContext';

export default function StatusScreen({ navigation }) {
  const { sosActive, nearbyPods, coords, gpsLocked } = useAppState();

  return (
    <View style={styles.screen}>
      <Header
        statusLine={`${nearbyPods.length} pod${nearbyPods.length === 1 ? '' : 's'} detected`}
        statusDotColor={nearbyPods.length > 0 ? colors.success : colors.statusUnknown}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={typography.h2}>Last known position</Text>
            <View style={styles.cachedBadge}>
              <View style={styles.cachedDot} />
              <Text style={styles.cachedText}>{gpsLocked ? 'GPS' : 'NO FIX'}</Text>
            </View>
          </View>

          <View style={styles.coordsBox}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text style={typography.body}>
              {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'No GPS fix yet'}
            </Text>
          </View>

          <View style={styles.legendRow}>
            <StatusDot color={colors.statusSelf} label="You" />
            <StatusDot color={colors.statusCritical} label="Beacon" />
            <StatusDot color={colors.statusUnknown} label="No fix" />
          </View>
        </Card>

        <Card>
          <Text style={[typography.eyebrow, styles.cardLabel]}>Rescuer pods nearby</Text>

          {nearbyPods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="radio-outline" size={22} color={colors.textMuted} />
              <Text style={[typography.meta, styles.emptyText]}>
                {sosActive
                  ? 'No pods in range yet — keep your beacon on.'
                  : 'Send your SOS from the home tab to start scanning for nearby pods.'}
              </Text>
            </View>
          ) : (
            nearbyPods.map((pod, i) => (
              <View
                key={pod.id}
                style={[styles.podRow, i !== nearbyPods.length - 1 && styles.podRowBorder]}
              >
                <View style={styles.podLeft}>
                  <View style={styles.podDot} />
                  <Text style={typography.entryTitle}>{pod.label}</Text>
                </View>
                <Text style={typography.meta}>{pod.rssi} dBm</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cachedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cachedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  cachedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5 },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  legendRow: { flexDirection: 'row', gap: 18, marginTop: 14 },
  cardLabel: { marginBottom: 10 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  emptyText: { textAlign: 'center', maxWidth: 240 },
  podRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  podRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  podLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  podDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
});

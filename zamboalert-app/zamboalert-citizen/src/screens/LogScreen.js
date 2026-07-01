// src/screens/LogScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Header from '../components/Header';
import Card from '../components/Card';
import { useAppState } from '../context/AppStateContext';

const ICONS = {
  sos: { name: 'warning', color: colors.statusCritical },
  detected: { name: 'checkmark-circle', color: colors.success },
  info: { name: 'information-circle', color: colors.statusUnknown },
};

export default function LogScreen({ navigation }) {
  const { log } = useAppState();

  return (
    <View style={styles.screen}>
      <Header
        statusLine={`${log.length} event${log.length === 1 ? '' : 's'} recorded`}
        statusDotColor={colors.statusUnknown}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={log}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const icon = ICONS[item.type] || ICONS.info;
          return (
            <Card style={styles.entryCard}>
              <Ionicons name={icon.name} size={20} color={icon.color} style={styles.entryIcon} />
              <View style={styles.entryBody}>
                <Text style={typography.body}>{item.message}</Text>
                <Text style={[typography.meta, styles.entryTime]}>{item.time}</Text>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={22} color={colors.textMuted} />
            <Text style={[typography.meta, styles.emptyText]}>No events yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  entryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  entryIcon: { marginTop: 2 },
  entryBody: { flex: 1 },
  entryTime: { marginTop: 2 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { textAlign: 'center' },
});

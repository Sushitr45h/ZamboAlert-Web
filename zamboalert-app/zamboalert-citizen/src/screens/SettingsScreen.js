// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Header from '../components/Header';
import Card from '../components/Card';
import { SecondaryButton } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [notes, setNotes] = useState('');
  const [autoSos, setAutoSos] = useState(false);

  return (
    <View style={styles.screen}>
      <Header statusLine={null} onSettingsPress={() => {}} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Logged-in user card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.entryTitle}>{user?.name}</Text>
              <Text style={typography.meta}>{user?.email}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role}</Text>
            </View>
          </View>
        </Card>

        {/* Emergency profile */}
        <Card>
          <Text style={[typography.eyebrow, styles.cardLabel]}>Emergency profile</Text>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Juan Dela Cruz" autoCapitalize="words" />
          <Field label="Emergency contact" value={contact} onChangeText={setContact} placeholder="Name and phone number" />
          <Field label="Blood type" value={bloodType} onChangeText={setBloodType} placeholder="O+" />
          <Field label="Medical notes" value={notes} onChangeText={setNotes} placeholder="Allergies, conditions, medication" multiline isLast />
        </Card>

        {/* Beacon behavior */}
        <Card>
          <Text style={[typography.eyebrow, styles.cardLabel]}>Beacon behavior</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>Auto-send SOS on signal loss</Text>
              <Text style={[typography.meta, styles.switchHint]}>
                Starts broadcasting automatically when cellular signal drops out.
              </Text>
            </View>
            <Switch
              value={autoSos}
              onValueChange={setAutoSos}
              trackColor={{ false: colors.inactiveBg, true: colors.primaryLight }}
              thumbColor={autoSos ? colors.primary : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Permissions */}
        <Card>
          <Text style={[typography.eyebrow, styles.cardLabel]}>Permissions</Text>
          <PermissionRow icon="bluetooth" label="Bluetooth" granted />
          <PermissionRow icon="location" label="Location" granted isLast />
        </Card>

        {/* About */}
        <Card>
          <View style={styles.aboutRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={typography.meta}>ZamboAlert Citizen · v1.0.0</Text>
          </View>
        </Card>

        {/* Logout */}
        <SecondaryButton
          label="Log out"
          icon="log-out-outline"
          onPress={logout}
          fullWidth
        />

      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, isLast, autoCapitalize }) {
  return (
    <View style={[styles.field, !isLast && styles.fieldSpacing]}>
      <Text style={[typography.meta, styles.fieldLabel]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        autoCapitalize={autoCapitalize || 'none'}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function PermissionRow({ icon, label, granted, isLast }) {
  return (
    <View style={[styles.permRow, !isLast && styles.permRowBorder]}>
      <View style={styles.permLeft}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={typography.body}>{label}</Text>
      </View>
      <Text style={[typography.meta, { color: granted ? colors.success : colors.textMuted }]}>
        {granted ? 'Granted' : 'Not granted'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 32 },

  userCard: { padding: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: { color: colors.textOnPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  cardLabel: { marginBottom: 12 },
  field: {},
  fieldSpacing: { marginBottom: 14 },
  fieldLabel: { marginBottom: 6 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchHint: { marginTop: 2, lineHeight: 16 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  permRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  permLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

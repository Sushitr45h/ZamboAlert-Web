// src/components/AlertBanner.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function AlertBanner({ message, onPress }) {
  if (!message) return null;

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <Ionicons name="warning" size={18} color={colors.textOnPrimary} />
      <Text style={styles.text} numberOfLines={1}>
        {message}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textOnPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  text: {
    flex: 1,
    color: colors.textOnPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});

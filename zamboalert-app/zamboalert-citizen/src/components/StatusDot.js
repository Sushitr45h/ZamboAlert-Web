// src/components/StatusDot.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';

export default function StatusDot({ color, label, size = 10 }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]} />
      {label ? <Text style={typography.meta}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {},
});

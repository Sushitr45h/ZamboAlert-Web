import { View, Text, StyleSheet } from "react-native";
import type { SOSStatus } from "../types";
import { STATUS_COLOR } from "../constants";

export function StatusBadge({ status }: { status: SOSStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

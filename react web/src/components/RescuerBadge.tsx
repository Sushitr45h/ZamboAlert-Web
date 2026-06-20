import { View, Text, StyleSheet } from "react-native";
import type { Rescuer } from "../types";
import { STATUS_COLOR } from "../constants";

export function RescuerBadge({ status }: { status: Rescuer["status"] }) {
  return (
    <View style={[styles.smallBadge, { backgroundColor: `${STATUS_COLOR[status]}22`, borderColor: `${STATUS_COLOR[status]}55` }]}>
      <Text style={[styles.smallBadgeText, { color: STATUS_COLOR[status] }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

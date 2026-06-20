import { View, StyleSheet } from "react-native";

export function Dot({ active }: { active: boolean }) {
  return (
    <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: "#dc2626",
  },
  dotInactive: {
    backgroundColor: "#6b7280",
  },
});

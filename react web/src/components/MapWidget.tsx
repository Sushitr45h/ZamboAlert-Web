import { View, Text, StyleSheet } from "react-native";

export function MapWidget() {
  return (
    <View style={styles.mapCard}>
      <View style={styles.mapGradient}>
        <View style={[styles.mapMarker, { top: "20%", left: "35%" }]}>
          <Text style={styles.mapMarkerText}>SOS</Text>
        </View>
        <View style={[styles.mapMarkerSmall, { top: "55%", left: "63%" }]} />
        <View style={[styles.mapMarkerSmall, { top: "70%", left: "28%" }]} />
        <Text style={styles.mapHint}>Map overlay placeholder</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#030712",
    minHeight: 520,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#181c2b",
  },
  mapGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
  },
  mapMarker: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  mapMarkerSmall: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#f97316",
  },
  mapMarkerText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  mapHint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 16,
  },
});

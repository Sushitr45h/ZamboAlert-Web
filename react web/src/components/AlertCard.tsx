import { View, Text, StyleSheet } from "react-native";
import type { SOSAlert } from "../types";
import { STATUS_COLOR } from "../constants";
import { StatusBadge } from "./StatusBadge";

export function AlertCard({ alert }: { alert: SOSAlert }) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertName}>{alert.name}</Text>
        <Text style={styles.alertMethod}>{alert.method}</Text>
      </View>
      <View style={styles.alertRow}>
        <View>
          <Text style={styles.alertTime}>{alert.time}</Text>
          <Text style={styles.alertMeta}>SOS {alert.id}</Text>
        </View>
        <StatusBadge status={alert.status} />
      </View>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${alert.battery}%`, backgroundColor: STATUS_COLOR[alert.status] }]} />
      </View>
      <Text style={styles.alertBattery}>{alert.battery}% battery</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    minWidth: 240,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  alertHeader: {
    marginBottom: 12,
  },
  alertName: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  alertMethod: {
    color: "#94a3b8",
    fontSize: 11,
  },
  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alertTime: {
    color: "#38bdf8",
    fontSize: 32,
    fontWeight: "800",
  },
  alertMeta: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginTop: 12,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 999,
  },
  alertBattery: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 6,
  },
});

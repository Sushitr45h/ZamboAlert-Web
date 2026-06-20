export type SOSStatus = "UNASSIGNED" | "ASSIGNED" | "RESOLVED";

export type SOSAlert = {
  id: string;
  name: string;
  zone: string;
  method: string;
  status: SOSStatus;
  battery: number;
  time: string;
  message?: string;
  assignedTo?: string;
};

export type RescuerStatus = "AVAILABLE" | "EN ROUTE" | "ON SCENE";

export type Rescuer = {
  id: string;
  name: string;
  status: RescuerStatus;
  unit: string;
  lastPing: string;
  battery: number;
};

export const STATUS_COLOR: Record<SOSStatus | RescuerStatus, string> = {
  UNASSIGNED: "#dc2626",
  ASSIGNED: "#f97316",
  RESOLVED: "#38bdf8",
  AVAILABLE: "#22c55e",
  "EN ROUTE": "#f97316",
  "ON SCENE": "#ef4444",
};

export const INITIAL_ALERTS: SOSAlert[] = [
  {
    id: "A-03",
    name: "Barangay San Roque",
    zone: "Zone 1",
    method: "GPS",
    status: "UNASSIGNED",
    battery: 82,
    time: "08:22",
    message: "Medical emergency reported near market.",
  },
  {
    id: "A-07",
    name: "Carmen Heights",
    zone: "Zone 4",
    method: "BT-Mesh",
    status: "ASSIGNED",
    battery: 61,
    time: "08:18",
    assignedTo: "R-02",
  },
  {
    id: "A-12",
    name: "Iligan Junction",
    zone: "Zone 2",
    method: "GPS",
    status: "RESOLVED",
    battery: 96,
    time: "08:05",
  },
];

export const RESCUERS: Rescuer[] = [
  { id: "R-01", name: "Alpha Team", status: "AVAILABLE", unit: "Brgy. Patrol", lastPing: "2m ago", battery: 87 },
  { id: "R-02", name: "Bravo Unit", status: "EN ROUTE", unit: "Rescue Squad", lastPing: "1m ago", battery: 73 },
  { id: "R-03", name: "Charlie", status: "ON SCENE", unit: "Medical", lastPing: "45s ago", battery: 65 },
];

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-PH", { hour12: false });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function computeStats(alerts: SOSAlert[]) {
  const unassigned = alerts.filter((a) => a.status === "UNASSIGNED");
  return {
    active: alerts.filter((a) => a.status !== "RESOLVED").length,
    rescuers: RESCUERS.length,
    nodes: 12,
    unassigned: unassigned.length,
  };
}

export function dispatchAlert(
  alerts: SOSAlert[],
  alertId: string,
  rescuerId: string
): SOSAlert[] {
  return alerts.map((alert) =>
    alert.id === alertId
      ? { ...alert, status: "ASSIGNED" as SOSStatus, assignedTo: rescuerId }
      : alert
  );
}

export function resolveAlert(alerts: SOSAlert[], alertId: string): SOSAlert[] {
  return alerts.map((alert) =>
    alert.id === alertId ? { ...alert, status: "RESOLVED" as SOSStatus } : alert
  );
}

export function getUnassignedAlerts(alerts: SOSAlert[]): SOSAlert[] {
  return alerts.filter((a) => a.status === "UNASSIGNED");
}

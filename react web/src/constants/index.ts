import type { SOSAlert, SOSStatus, Rescuer } from "../types";

export const STATUS_COLOR: Record<SOSStatus | Rescuer["status"], string> = {
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

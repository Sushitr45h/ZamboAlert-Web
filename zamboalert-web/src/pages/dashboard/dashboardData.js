import { useEffect, useState } from "react";

export const INITIAL_ALERTS = [
  {
    id: "SOS-01",
    name: "Clarissa Guevara",
    method: "GPS",
    time: "03:45:12",
    zone: "Zone 1 - Riverbank",
    message: "Floodwater rising fast, trapped on the second floor!",
    status: "unassigned",
    assignedTo: null,
    battery: 84,
    lat: "6.9230° N",
    lng: "122.0762° E"
  }
];

export const INITIAL_RESCUERS = [
  {
    id: "R-01",
    name: "Rescue Team Alpha",
    unit: "Barangay BDRRMC",
    coords: [55, 60],
    lat: "6.9220° N",
    lng: "122.0800° E",
    status: "available",
    assignedAlert: null,
    battery: 95,
    lastPing: "04:48:12"
  },
  {
    id: "R-02",
    name: "Medic Unit 1",
    unit: "Red Cross Volunteer",
    coords: [25, 20],
    lat: "6.9180° N",
    lng: "122.0740° E",
    status: "available",
    battery: 78,
    lastPing: "04:49:05"
  },
  {
    id: "R-03",
    name: "Rescue Team Beta",
    unit: "Zamboanga City DRRMO",
    coords: [80, 50],
    lat: "6.9260° N",
    lng: "122.0850° E",
    status: "available",
    battery: 90,
    lastPing: "04:47:30"
  }
];

export const MESH_NODES = [
  {
    id: "GW-01",
    label: "Barangay Hall Gateway",
    type: "gateway",
    online: true,
    signalDbm: -48,
    lastSeen: "Just now",
    relayCount: 342,
    coords: [6.9235, 122.0780]
  },
  {
    id: "RL-02",
    label: "Tumaga Bridge Relay",
    type: "relay",
    online: true,
    signalDbm: -65,
    lastSeen: "2s ago",
    relayCount: 189,
    coords: [6.9214, 122.0812]
  },
  {
    id: "RL-03",
    label: "Zone 4 Chapel Relay",
    type: "relay",
    online: true,
    signalDbm: -72,
    lastSeen: "5s ago",
    relayCount: 94,
    coords: [6.9250, 122.0795]
  },
  {
    id: "MN-04",
    label: "Riverview Subd. Node",
    type: "mesh",
    online: false,
    signalDbm: -85,
    lastSeen: "4m ago",
    relayCount: 12,
    coords: [6.9260, 122.0725]
  }
];

export const TUMAGA_BUILDINGS = [
  { id: "b1", name: "Tumaga Barangay Hall", lat: 6.9235, lng: 122.0780, w: 26, d: 20, h: 36, type: "gov" },
  { id: "b2", name: "Tumaga Police Outpost", lat: 6.9239, lng: 122.0784, w: 14, d: 14, h: 26, type: "gov" },
  { id: "b3", name: "Tumaga Elementary School - Bldg A", lat: 6.9248, lng: 122.0768, w: 32, d: 16, h: 22, type: "school" },
  { id: "b4", name: "Tumaga Elementary School - Bldg B", lat: 6.9244, lng: 122.0766, w: 28, d: 16, h: 22, type: "school" },
  { id: "b5", name: "Tumaga Covered Gym", lat: 6.9242, lng: 122.0772, w: 36, d: 24, h: 18, type: "court" },
  { id: "b6", name: "Zamboanga Peninsula Medical Center", lat: 6.9185, lng: 122.0862, w: 42, d: 32, h: 56, type: "medical" },
  { id: "b7", name: "Tumaga Health Center", lat: 6.9230, lng: 122.0778, w: 18, d: 16, h: 20, type: "medical" },
  { id: "b8", name: "Tumaga Catholic Chapel", lat: 6.9250, lng: 122.0795, w: 22, d: 32, h: 42, type: "chapel" },
  { id: "b9", name: "Phoenix Gas Station & Plaza", lat: 6.9212, lng: 122.0750, w: 22, d: 22, h: 16, type: "comm" },
  { id: "b10", name: "Commercial Center", lat: 6.9208, lng: 122.0745, w: 28, d: 16, h: 28, type: "comm" },
  { id: "b11", name: "Riverview Subdivision Block A", lat: 6.9265, lng: 122.0720, w: 24, d: 24, h: 24, type: "res" },
  { id: "b12", name: "Riverview Subdivision Block B", lat: 6.9258, lng: 122.0728, w: 20, d: 20, h: 22, type: "res" },
  { id: "b13", name: "Villa Teresa Subd Block A", lat: 6.9192, lng: 122.0785, w: 24, d: 24, h: 24, type: "res" },
  { id: "b14", name: "Villa Teresa Subd Block B", lat: 6.9185, lng: 122.0792, w: 20, d: 24, h: 24, type: "res" },
  { id: "b15", name: "Riverbank Housing Cluster", lat: 6.9224, lng: 122.0758, w: 16, d: 16, h: 18, type: "res" }
];

export function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function fmtTime(d) {
  return d.toLocaleTimeString("en-PH", { hour12: false });
}

export function signalBars(dbm) {
  if (dbm > -60) return 4;
  if (dbm > -70) return 3;
  if (dbm > -80) return 2;
  return 1;
}

export function parseCoordinate(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

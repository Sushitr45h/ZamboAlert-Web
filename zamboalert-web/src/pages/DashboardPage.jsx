import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ManpowerAlertPage from "./ManpowerAlertPage";
import {
  Radio,
  Wifi,
  Bluetooth,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Send,
  X,
  ChevronRight,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Navigation,
  Zap,
  PhoneCall,
  UserCheck,
  Layers,
  Signal,
  Volume2,
  ClipboardList,
  Plus,
  Minus,
  Trash2,
  Search,
  RefreshCw,
  Settings,
  LogOut,
  Home,
  Building,
  Phone,
  Shield,
  FileSpreadsheet,
  Download,
  BarChart2,
  Filter,
  MapPin,
  Printer,
  Edit3,
  Compass,
  FileText,
  Eye,
  Check,
  PhoneForwarded,
  PhoneOutgoing,
  Headphones,
  Play,
  Square,
  VolumeX
} from "lucide-react";

// ── Seed data ──────────────────────────────────────────────────────────────────

const INITIAL_ALERTS = [
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

const INITIAL_RESCUERS = [
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

const MESH_NODES = [
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

// Seed buildings in Barangay Tumaga, Zamboanga City
const TUMAGA_BUILDINGS = [
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

// ── Utils ──────────────────────────────────────────────────────────────────────

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(d) {
  return d.toLocaleTimeString("en-PH", { hour12: false });
}

function signalBars(dbm) {
  if (dbm > -60) return 4;
  if (dbm > -70) return 3;
  if (dbm > -80) return 2;
  return 1;
}

function parseCoordinate(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// ── Badges & Micro-Components ──────────────────────────────────────────────────

function SignalBars({ bars, active }) {
  return (
    <span className="inline-flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((b) => (
        <span
          key={b}
          className="w-1 rounded-xs transition-colors"
          style={{
            height: `${b * 3}px`,
            background: b <= bars && active ? "#dc2626" : "#cbd5e1",
          }}
        />
      ))}
    </span>
  );
}

function PingDot({ active }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
      )}
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ background: active ? "#10b981" : "#94a3b8" }}
      />
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    unassigned: "bg-red-50 text-red-700 border-red-200/80 font-bold",
    assigned: "bg-amber-50 text-amber-700 border-amber-200/80 font-bold",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold",
  }[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`text-[10px] font-mono tracking-wider px-2.5 py-0.5 rounded-full uppercase border ${cfg}`}>
      {status}
    </span>
  );
}

function RescuerBadge({ status }) {
  const cfg = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    "en-route": "bg-amber-50 text-amber-700 border-amber-200/80",
    "on-scene": "bg-red-50 text-red-700 border-red-200/80",
    offline: "bg-slate-100 text-slate-500 border-slate-200"
  }[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`text-[10px] font-mono font-semibold tracking-wider px-2.5 py-0.5 rounded-full uppercase border ${cfg}`}>
      {status}
    </span>
  );
}

// ── Tactical Map ───────────────────────────────────────────────────────────────

function TacticalMap({
  alerts,
  rescuers,
  casualties = [],
  selected,
  onSelect,
  selectedCasualtyId,
  onSelectCasualty,
  onDispatchToTarget,
}) {
  const [is3D, setIs3D] = useState(false);
  const [showDetectionWeb, setShowDetectionWeb] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const pathsGroupRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([6.9214, 122.0790], 15);

    mapRef.current = map;

    markersGroupRef.current = L.layerGroup().addTo(map);
    pathsGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Base Layer
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const url = is3D
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = is3D
      ? "&copy; Esri &mdash; Satellite Imagery"
      : "&copy; OpenStreetMap contributors";

    tileLayerRef.current = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [is3D]);

  // Center view on selected entities
  useEffect(() => {
    if (!mapRef.current) return;

    let targetCoords = null;

    if (selected) {
      const a = alerts.find((x) => x.id === selected);
      if (a) {
        const lat = parseCoordinate(a.lat || a.latitude);
        const lng = parseCoordinate(a.lng || a.longitude);
        if (lat && lng) targetCoords = [lat, lng];
      }
    } else if (selectedCasualtyId) {
      const c = casualties.find((x) => x.id === selectedCasualtyId);
      if (c) {
        const lat = parseCoordinate(c.latitude || c.lat);
        const lng = parseCoordinate(c.longitude || c.lng);
        if (lat && lng) targetCoords = [lat, lng];
      }
    }

    if (targetCoords) {
      mapRef.current.setView(targetCoords, 16, { animate: true, duration: 1 });
    }
  }, [selected, selectedCasualtyId, alerts, casualties]);

  // Update Markers & Paths
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current || !pathsGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    pathsGroupRef.current.clearLayers();

    // 1. Draw Buildings
    TUMAGA_BUILDINGS.forEach((b) => {
      const getBuildingColor = (type) => {
        if (type === "gov") return "#0284c7";
        if (type === "medical") return "#dc2626";
        if (type === "school" || type === "court") return "#d97706";
        if (type === "chapel") return "#7c3aed";
        return "#64748b";
      };

      const getBuildingBorderColor = (type) => {
        if (type === "gov") return "#0284c7";
        if (type === "medical") return "#dc2626";
        if (type === "school" || type === "court") return "#d97706";
        if (type === "chapel") return "#7c3aed";
        return "#475569";
      };

      const getBuildingSvgIcon = (type) => {
        if (type === "gov") {
          return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M4 10l8-7 8 7"/></svg>`;
        }
        if (type === "medical") {
          return `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
        }
        if (type === "school") {
          return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`;
        }
        if (type === "court") {
          return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 1 4 4v3H8V6a4 4 0 0 1 4-4z"/></svg>`;
        }
        if (type === "chapel") {
          return `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M11 2h2v5h5v2h-5v12h-2V9H6V7h5V2z"/></svg>`;
        }
        if (type === "comm") {
          return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>`;
        }
        return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
      };

      const customIcon = L.divIcon({
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background-color: ${getBuildingColor(b.type)}25;
            border: 2px solid ${getBuildingBorderColor(b.type)};
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            color: ${getBuildingBorderColor(b.type)};
          ">
            ${getBuildingSvgIcon(b.type)}
          </div>
        `,
        className: "custom-building-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const buildingMarker = L.marker([b.lat, b.lng], { icon: customIcon });

      buildingMarker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong>${b.name}</strong><br/>
          <span style="font-size: 9px; opacity: 0.8; text-transform: uppercase;">Type: ${b.type}</span>
        </div>`,
        {
          permanent: false,
          direction: "top",
          className: "custom-building-tooltip",
        }
      );

      buildingMarker.addTo(markersGroupRef.current);
    });

    // 2. Draw SOS Alerts
    alerts.forEach((a) => {
      const lat = parseCoordinate(a.lat || a.latitude);
      const lng = parseCoordinate(a.lng || a.longitude);
      if (lat && lng) {
        const isSel = selected === a.id;
        const isUnassigned = a.status === "unassigned";

        const html = `
          <div class="relative flex flex-col items-center justify-center">
            ${isUnassigned ? '<span class="absolute w-9 h-9 rounded-full border-2 border-red-600 animate-ping opacity-75" style="margin-top:-6px;"></span>' : ""}
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 text-[9px] font-bold font-mono transition-transform shadow-md ${
              isSel ? "scale-125 border-white bg-red-900 text-white shadow-xl ring-2 ring-red-500" : "bg-red-600 border-white text-white"
            } ${a.status === "assigned" ? "bg-amber-500 border-white text-white" : ""}">
              SOS
            </div>
            <span class="absolute top-8 bg-slate-900/90 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md border border-slate-700 font-semibold whitespace-nowrap shadow-lg z-50">
              ${a.name}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: html,
          className: "custom-sos-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.on("click", () => {
          onSelect(a.id);
        });
        marker.addTo(markersGroupRef.current);
      }
    });

    // 3. Draw Rescuer Units
    rescuers.forEach((r) => {
      const lat = parseCoordinate(r.lat || r.latitude);
      const lng = parseCoordinate(r.lng || r.longitude);
      if (lat && lng) {
        const html = `
          <div class="relative flex flex-col items-center justify-center">
            <div class="relative flex items-center justify-center w-6 h-6 rounded-lg border-2 border-white text-[9px] font-bold font-mono shadow-md ${
              r.status === "available"
                ? "bg-emerald-600 text-white"
                : r.status === "en-route"
                ? "bg-amber-500 text-white"
                : "bg-red-600 text-white"
            }">
              R
            </div>
            <span class="absolute top-7 bg-slate-900/90 text-slate-100 text-[8px] px-1.5 py-px rounded border border-slate-700 font-mono whitespace-nowrap shadow-xs">
              ${r.id}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: html,
          className: "custom-rescuer-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.addTo(markersGroupRef.current);
      }
    });

    // 4. Draw Casualties / Victims
    casualties.forEach((c) => {
      const lat = parseCoordinate(c.latitude || c.lat);
      const lng = parseCoordinate(c.longitude || c.lng);
      if (lat && lng) {
        const isSel = selectedCasualtyId === c.id;
        const statusColors = {
          Injured: "bg-amber-500 border-white text-white",
          Deceased: "bg-purple-800 border-white text-white",
          Missing: "bg-red-600 border-white text-white animate-pulse",
          Rescued: "bg-emerald-600 border-white text-white",
        }[c.status] || "bg-slate-500 border-white text-white";

        const disasterEmoji = {
          Flood: "🌊",
          Landslide: "🪨",
          Earthquake: "🫨",
          Fire: "🔥",
          "Storm Surge": "💨",
        }[c.disaster_type] || "🪨";

        const html = `
          <div class="relative flex flex-col items-center justify-center">
            ${isSel ? '<span class="absolute w-9 h-9 rounded-full border-2 border-dashed border-red-600 animate-spin" style="margin-top:-2px;"></span>' : ""}
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 text-[12px] ${statusColors} shadow-md" title="${c.disaster_type || "Unknown"} Area">
              ${disasterEmoji}
            </div>
            <span class="absolute top-8 bg-white/95 text-slate-900 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap shadow-md z-[1000]">
              ${c.victim_name}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: html,
          className: "custom-casualty-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const popupDiv = document.createElement("div");
        popupDiv.className = "p-3 font-sans text-xs text-slate-800 max-w-[220px]";
        
        const assignedRescuer = rescuers.find(r => r.status === "en-route" && r.assignedTargetType === "victim" && String(r.assignedTargetId) === String(c.id));
        
        popupDiv.innerHTML = `
          <div class="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
            <span>VICTIM LOG</span>
            <span class="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">VIC-${c.id}</span>
          </div>
          <div class="space-y-1 mb-3 text-[11px]">
            <div><strong>Name:</strong> ${c.victim_name}</div>
            <div><strong>Status:</strong> <span class="font-bold text-red-700 uppercase">${c.status}</span></div>
            <div><strong>Disaster:</strong> <span class="font-semibold text-slate-700">${c.disaster_type || "Unknown"}</span></div>
            <div><strong>Age / Gender:</strong> ${c.age || "--"} / ${c.gender || "--"}</div>
            <div><strong>Injury:</strong> <span class="italic text-slate-600">${c.injury_details || "None listed"}</span></div>
          </div>
          <div class="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
            ${
              assignedRescuer
                ? `<div class="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-1.5 border border-emerald-200 rounded-lg text-center">
                     Dispatched: ${assignedRescuer.name}
                   </div>`
                : `<label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assign Rescuer Unit</label>
                   <select id="popup-select-${c.id}" class="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 outline-none">
                     ${
                       rescuers.filter(r => r.isVerified && r.status === "available").length === 0
                         ? '<option value="">No rescuers available</option>'
                         : rescuers.filter(r => r.isVerified && r.status === "available").map(r => `<option value="${r.id}">${r.name}</option>`).join("")
                     }
                   </select>
                   <button id="popup-btn-${c.id}" class="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] py-2 rounded-lg transition-colors uppercase tracking-wider cursor-pointer mt-1" ${
                     rescuers.filter(r => r.isVerified && r.status === "available").length === 0 ? "disabled" : ""
                   }>
                     Dispatch Unit
                   </button>`
            }
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.bindPopup(popupDiv);

        marker.on("click", () => {
          if (onSelectCasualty) onSelectCasualty(c.id);
        });

        marker.on("popupopen", () => {
          const btn = document.getElementById(`popup-btn-${c.id}`);
          if (btn) {
            btn.onclick = () => {
              const select = document.getElementById(`popup-select-${c.id}`);
              const rescuerId = select ? select.value : "";
              if (rescuerId) {
                if (onDispatchToTarget) {
                  onDispatchToTarget(rescuerId, "victim", c.id, c.victim_name);
                }
                marker.closePopup();
              }
            };
          }
        });

        marker.addTo(markersGroupRef.current);
      }
    });

    // 5. Draw Barangay Hall Detection Web
    if (showDetectionWeb) {
      const bhCoords = [6.9235, 122.0780];
      
      // Outer Range Ring (3km)
      L.circle(bhCoords, {
        radius: 3000,
        color: "#dc2626",
        weight: 1,
        dashArray: "3, 9",
        fillColor: "#dc2626",
        fillOpacity: 0.02,
        className: "radar-ring-outer",
        interactive: false,
      }).addTo(pathsGroupRef.current);

      // Mid Range Ring (2km)
      L.circle(bhCoords, {
        radius: 2000,
        color: "#dc2626",
        weight: 1.2,
        dashArray: "6, 6",
        fillColor: "#dc2626",
        fillOpacity: 0.03,
        className: "radar-ring-mid",
        interactive: false,
      }).addTo(pathsGroupRef.current);

      // Inner Core Ring (1km)
      L.circle(bhCoords, {
        radius: 1000,
        color: "#dc2626",
        weight: 1.5,
        fillColor: "#dc2626",
        fillOpacity: 0.06,
        className: "radar-ring-inner",
        interactive: false,
      }).addTo(pathsGroupRef.current);
    }

    // 6. Draw Dispatch routing lines
    rescuers
      .filter((r) => r.assignedAlert || r.assignedTargetType)
      .forEach((r) => {
        let tLat = null;
        let tLng = null;
        let pulseColor = "#dc2626";

        if (r.assignedAlert) {
          const alert = alerts.find((a) => a.id === r.assignedAlert);
          if (alert) {
            tLat = parseCoordinate(alert.lat || alert.latitude);
            tLng = parseCoordinate(alert.lng || alert.longitude);
          }
        } else if (r.assignedTargetType === "victim") {
          const victim = casualties.find((c) => String(c.id) === String(r.assignedTargetId));
          if (victim) {
            tLat = parseCoordinate(victim.latitude || victim.lat);
            tLng = parseCoordinate(victim.longitude || victim.lng);
            pulseColor = "#f59e0b";
          }
        }

        const rLat = parseCoordinate(r.lat || r.latitude);
        const rLng = parseCoordinate(r.lng || r.longitude);

        if (rLat && rLng && tLat && tLng) {
          const polyline = L.polyline([[rLat, rLng], [tLat, tLng]], {
            color: pulseColor,
            weight: 3,
            dashArray: "6, 6",
            opacity: 0.85,
            className: "routing-line-animated",
          });
          polyline.addTo(pathsGroupRef.current);
        }
      });
  }, [alerts, rescuers, casualties, selected, selectedCasualtyId, showDetectionWeb]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetZoom = () => mapRef.current?.setView([6.9214, 122.0790], 15);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* Floating View & Radar Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 gap-1">
          <button
            onClick={() => setIs3D(false)}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
              !is3D ? "bg-red-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2D PLAN
          </button>
          <button
            onClick={() => setIs3D(true)}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
              is3D ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            3D SATELLITE
          </button>
        </div>

        <button
          onClick={() => setShowDetectionWeb(!showDetectionWeb)}
          className={`px-3 py-1.5 text-xs font-bold font-mono rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md border ${
            showDetectionWeb
              ? "bg-white/95 backdrop-blur-md text-red-700 border-red-200"
              : "bg-white/95 backdrop-blur-md text-slate-500 border-slate-200 hover:text-slate-800"
          }`}
        >
          <Signal size={13} className={showDetectionWeb ? "text-red-600 animate-pulse" : "text-slate-400"} />
          <span>RADAR: {showDetectionWeb ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Coordinates Pill */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-xs font-mono text-slate-700 flex items-center gap-2">
        <MapPin size={13} className="text-red-600" />
        <span>6.9214° N, 122.0790° E · Tumaga</span>
      </div>

      {/* Map Legend (Collapsible) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-md p-3 text-xs">
        <div 
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="flex items-center justify-between gap-4 font-bold text-slate-900 cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-slate-600" />
            <span className="text-[11px] uppercase tracking-wider font-mono">Map Legend</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{isLegendOpen ? "▲" : "▼"}</span>
        </div>
        
        {isLegendOpen && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-2 font-medium text-slate-700 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] font-bold">SOS</span>
              <span>Distress Alert</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">R</span>
              <span>Rescuer Unit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-bold">V</span>
              <span>Reported Victim</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-lg bg-sky-100 border border-sky-600 text-sky-700 flex items-center justify-center text-[8px] font-bold">🏛️</span>
              <span>Barangay Key Facility</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer font-bold"
          title="Zoom In"
        >
          <Plus size={15} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer font-bold"
          title="Zoom Out"
        >
          <Minus size={15} />
        </button>
        <button
          onClick={handleResetZoom}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
          title="Reset View"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────────

function BroadcastModal({ onClose }) {
  const [msg, setMsg] = useState("");
  const [priority, setPriority] = useState("emergency");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!msg.trim()) return;
    setSent(true);
    setTimeout(() => onClose(), 1600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Volume2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                Emergency LoRa Broadcast
              </h3>
              <p className="text-[11px] text-slate-500">Transmits to all offline mesh nodes & rescuer radios</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle size={28} />
              </div>
              <span className="text-sm font-bold font-mono text-emerald-700">BROADCAST TRANSMITTED</span>
              <span className="text-xs text-slate-500">Successfully relayed across 3 mesh repeaters</span>
            </div>
          ) : (
            <>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {["emergency", "advisory", "info"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      priority === p
                        ? "bg-white text-red-700 shadow-sm font-black"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={4}
                maxLength={280}
                placeholder="Enter emergency announcement to broadcast across all active Barangay LoRa nodes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 resize-none p-4 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-sans"
              />

              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>TARGET: ALL ONLINE NODES</span>
                <span>{msg.length} / 280</span>
              </div>

              <button
                onClick={handleSend}
                disabled={!msg.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-700 hover:bg-red-800 active:bg-red-900 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Send size={14} />
                TRANSMIT LORA BROADCAST
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DispatchModal({ alert, rescuers, onDispatch, onClose }) {
  const [chosen, setChosen] = useState(null);
  const available = rescuers.filter((r) => r.status === "available" && r.isVerified !== false);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <UserCheck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                Dispatch Rescuer
              </h3>
              <p className="text-[11px] text-slate-500">Assign tactical unit to emergency SOS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-red-50/60 border border-red-100 rounded-xl p-4 text-xs space-y-1.5">
            <div className="text-red-900 font-bold flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold text-[10px]">{alert.id}</span>
              <span className="text-sm">{alert.name}</span>
            </div>
            <div className="text-slate-600">{alert.zone} · {alert.lat}, {alert.lng}</div>
            {alert.message && (
              <div className="text-red-800 italic border-t border-red-100/60 pt-2 mt-2">&ldquo;{alert.message}&rdquo;</div>
            )}
          </div>

          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Available Rescue Units ({available.length})
          </div>

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {available.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6 italic">No rescue units available online right now.</div>
            ) : (
              available.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setChosen(r.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    chosen === r.id
                      ? "border-red-500 bg-red-50/40 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{r.unit} · {r.id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">BAT {r.battery}%</span>
                    {chosen === r.id ? (
                      <CheckCircle size={16} className="text-red-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => chosen && onDispatch(chosen, "alert", alert.id, alert.name)}
            disabled={!chosen}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Navigation size={14} />
            CONFIRM DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
}

function CallRescuerModal({ rescuers, casualties, alerts, onClose, onDispatch }) {
  const [selectedRescuerId, setSelectedRescuerId] = useState("");
  const [targetType, setTargetType] = useState("victim");
  const [targetId, setTargetId] = useState("");

  const availableRescuers = rescuers.filter(r => (r.isVerified !== false) && r.status === "available");

  useEffect(() => {
    if (availableRescuers.length > 0 && !selectedRescuerId) {
      setSelectedRescuerId(availableRescuers[0].id);
    }
  }, [availableRescuers, selectedRescuerId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRescuerId || !targetType || !targetId) return;

    let targetName = "";
    if (targetType === "victim") {
      const victim = casualties.find(c => String(c.id) === String(targetId));
      targetName = victim ? victim.victim_name : `Victim #${targetId}`;
    } else if (targetType === "alert") {
      const alertItem = alerts.find(a => String(a.id) === String(targetId));
      targetName = alertItem ? alertItem.name : `SOS Alert #${targetId}`;
    }

    onDispatch(selectedRescuerId, targetType, targetId, targetName);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <PhoneCall size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                Call & Assign Rescuer
              </h3>
              <p className="text-[11px] text-slate-500">Directly route a unit to an objective</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">1. Select Rescuer Unit</label>
            {availableRescuers.length === 0 ? (
              <div className="text-red-700 text-xs p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                No active rescuers are currently available.
              </div>
            ) : (
              <select
                value={selectedRescuerId}
                onChange={(e) => setSelectedRescuerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500 cursor-pointer"
              >
                {availableRescuers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id}) - {r.unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">2. Destination Target Type</label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetType("victim")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  targetType === "victim" ? "bg-white text-red-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Victim
              </button>
              <button
                type="button"
                onClick={() => setTargetType("alert")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  targetType === "alert" ? "bg-white text-red-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                SOS Alert
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">3. Choose Target</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500 cursor-pointer"
              required
            >
              <option value="" disabled>-- Select Destination --</option>
              {targetType === "victim" && (
                casualties.filter(c => c.status !== "Rescued").map(c => (
                  <option key={c.id} value={c.id}>
                    VIC-{c.id}: {c.victim_name} ({c.status} - {c.location})
                  </option>
                ))
              )}
              {targetType === "alert" && (
                alerts.filter(a => a.status === "unassigned").map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id}: {a.name} ({a.zone})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={availableRescuers.length === 0 || !targetId}
            className="w-full py-3 mt-2 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
          >
            DISPATCH RESCUER UNIT
          </button>
        </form>
      </div>
    </div>
  );
}

function AutoCallZcdrrmoModal({ alerts, casualties, onClose }) {
  const [selectedDesk, setSelectedDesk] = useState("zcdrrmo_main");
  const [selectedAlertId, setSelectedAlertId] = useState(alerts?.[0]?.id || "ALL");
  const [priorityLevel, setPriorityLevel] = useState("Level 3 - Critical SOS Escalation");
  const [scriptText, setScriptText] = useState("");
  
  // Call Lifecycle: 'idle' | 'dialing' | 'connected' | 'completed'
  const [callState, setCallState] = useState("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [dispatchRef, setDispatchRef] = useState(`ZCD-AUTO-${Math.floor(1000 + Math.random() * 9000)}`);

  const desks = {
    zcdrrmo_main: {
      name: "ZCDRRMO Main Command & Operations Center",
      hotline: "(062) 991-2999",
      alt: "0917-891-9911 / 911 Direct",
      facility: "Mayor Vitaliano Agan Ave, Camino Nuevo",
      badge: "Central HQ"
    }
  };

  const currentDesk = desks[selectedDesk] || desks.zcdrrmo_main;

  const speakScript = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    let timer = null;
    if (callState === "connected") {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartCall = () => {
    const code = `ZCD-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
    setDispatchRef(code);
    setCallState("dialing");

    setTimeout(() => {
      setCallState("connected");
      speakScript(scriptText);

      setTimeout(() => {
        setCallState("completed");
        stopAudio();
      }, 9000);
    }, 2800);
  };

  const handleHangUp = () => {
    stopAudio();
    if (callState === "connected" || callState === "dialing") {
      setCallState("completed");
    } else {
      onClose();
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${
              callState === "connected"
                ? "bg-emerald-100 text-emerald-700 animate-pulse"
                : callState === "dialing"
                ? "bg-amber-100 text-amber-700 animate-bounce"
                : "bg-red-50 text-red-600"
            }`}>
              <PhoneForwarded size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide font-mono">
                  ZCDRRMO Office Auto-Dialer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                  Automated Voice
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Autonomous priority voice dispatch to central command hotline</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          
          {/* Active Call Status Banner */}
          <div className={`p-4 rounded-2xl border transition-all ${
            callState === "idle"
              ? "bg-slate-50 border-slate-200"
              : callState === "dialing"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
              : callState === "connected"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
              : "bg-blue-50 border-blue-300"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${
                  callState === "idle"
                    ? "bg-slate-400"
                    : callState === "dialing"
                    ? "bg-amber-500 animate-ping"
                    : callState === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-blue-600"
                }`} />
                <div>
                  <span className="text-xs font-black font-mono uppercase tracking-wider block text-slate-900">
                    {callState === "idle" && "STANDBY — READY TO DISPATCH"}
                    {callState === "dialing" && "DIALING MAIN ZCDRRMO HOTLINE..."}
                    {callState === "connected" && "CONNECTED — STREAMING SYNTHETIC VOICE BRIEFING"}
                    {callState === "completed" && "CALL TRANSMITTED & ACKNOWLEDGED"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Target: {currentDesk.name} ({currentDesk.hotline})
                  </span>
                </div>
              </div>
              {callState === "connected" && (
                <div className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-xs rounded-lg animate-pulse">
                  {formatTime(callDuration)}
                </div>
              )}
            </div>

            {/* Visualizer bars when active */}
            {(callState === "dialing" || callState === "connected") && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-1 h-8 px-2">
                {[40, 70, 95, 60, 85, 100, 75, 90, 50, 80, 100, 65, 85, 45, 90, 70, 95, 60, 40].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${callState === "connected" ? h : Math.sin(i) * 30 + 30}%` }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      callState === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {callState === "completed" ? (
            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950 font-mono">
                  DISPATCH CONFIRMATION LOGGED
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Voice alert acknowledged by ZCDRRMO Main Desk Officer.
                </p>
              </div>
              <div className="mt-2 p-2.5 bg-white border border-emerald-200 rounded-xl w-full text-left font-mono text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Reference ID:</span>
                  <strong className="text-slate-900">{dispatchRef}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Recipient:</span>
                  <span className="text-slate-800">{currentDesk.hotline}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Timestamp:</span>
                  <span className="text-slate-800">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Form Controls */}
              <div className="space-y-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                    1. Target ZCDRRMO Hotline Destination
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(desks).map(([key, desk]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDesk(key)}
                        disabled={callState !== "idle"}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedDesk === key
                            ? "bg-red-50/80 border-red-300 ring-1 ring-red-300"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{desk.name}</span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                              {desk.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                            Hotline: <strong>{desk.hotline}</strong> • Alt: {desk.alt}
                          </span>
                        </div>
                        {selectedDesk === key && <Check size={16} className="text-red-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                      2. Emergency Context
                    </label>
                    <select
                      value={selectedAlertId}
                      onChange={(e) => setSelectedAlertId(e.target.value)}
                      disabled={callState !== "idle"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500 cursor-pointer"
                    >
                      <option value="ALL">Barangay General Flash Flood</option>
                      {alerts?.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.id}: {a.name} ({a.zone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                      3. Escalation Level
                    </label>
                    <select
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      disabled={callState !== "idle"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500 cursor-pointer"
                    >
                      <option value="Level 3 - Critical SOS Escalation">Level 3 - Critical SOS Escalation</option>
                      <option value="Level 2 - Heavy Flood Rescue Reinforcement">Level 2 - Heavy Flood Rescue Reinforcement</option>
                      <option value="Level 1 - Preemptive Evacuation Advisory">Level 1 - Preemptive Evacuation Advisory</option>
                    </select>
                  </div>
                </div>

                {/* Script Input & Audio Test */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Voice Message (Text-To-Speech)
                    </label>
                    <button
                      type="button"
                      onClick={() => (isPlayingAudio ? stopAudio() : speakScript(scriptText))}
                      disabled={!scriptText.trim()}
                      className="text-[11px] font-bold text-slate-700 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Square size={12} className="text-red-600 fill-red-600" />
                          <span>Stop Preview</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} className="text-emerald-600 fill-emerald-600" />
                          <span>Listen Voice Preview</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    disabled={callState !== "idle"}
                    rows={4}
                    placeholder="Enter the voice message to be spoken via Text-To-Speech..."
                    className="w-full p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y min-h-[90px] disabled:opacity-75"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span> Enter your custom message above before previewing or initiating the call.</span>
                    <span>{scriptText.length} chars</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          {callState === "idle" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartCall}
                disabled={!scriptText.trim()}
                className="flex-2 py-3 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOutgoing size={15} />
                <span>INITIATE AUTOMATED CALL</span>
              </button>
            </>
          )}

          {(callState === "dialing" || callState === "connected") && (
            <button
              type="button"
              onClick={handleHangUp}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <VolumeX size={15} />
              <span>END CALL / HANG UP</span>
            </button>
          )}

          {callState === "completed" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              DONE & RETURN TO DASHBOARD
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const now = useNow();

  // Primary States
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [rescuers, setRescuers] = useState(INITIAL_RESCUERS);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showCallRescuerModal, setShowCallRescuerModal] = useState(false);
  const [showAutoCallModal, setShowAutoCallModal] = useState(false);
  const [activeTab, setActiveTab] = useState("map"); // "map", "alerts", "residents", "units", "reports", "victims", "approvals", "manpower"

  const [casualtyLogs, setCasualtyLogs] = useState([]);
  const [selectedCasualtyId, setSelectedCasualtyId] = useState(null);
  const [isFetchingCasualties, setIsFetchingCasualties] = useState(false);

  const [households, setHouseholds] = useState([]);
  const [isFetchingHouseholds, setIsFetchingHouseholds] = useState(false);

  const [incidents, setIncidents] = useState([]);
  const [isFetchingIncidents, setIsFetchingIncidents] = useState(false);

  const [isFetchingRescuers, setIsFetchingRescuers] = useState(false);
  const [flashCount, setFlashCount] = useState(0);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState("");
  const [sessionRemaining, setSessionRemaining] = useState(0);

  useEffect(() => {
    const sessionData = localStorage.getItem("zamboalert_auth");
    if (!sessionData) {
      navigate("/login");
      return;
    }
    try {
      const { token, user, expiry } = JSON.parse(sessionData);
      if (Date.now() > expiry) {
        localStorage.removeItem("zamboalert_auth");
        navigate("/login");
        return;
      }
      setIsAuthenticated(true);
      setSessionUser(user || "Barangay Admin");
      setSessionRemaining(Math.round((expiry - Date.now()) / 1000));

      const timer = setInterval(() => {
        const remaining = Math.round((expiry - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timer);
          localStorage.removeItem("zamboalert_auth");
          navigate("/login");
        } else {
          setSessionRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    } catch (e) {
      localStorage.removeItem("zamboalert_auth");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("zamboalert_auth");
    navigate("/login");
  };

  // Flash ticker for active SOS signals
  useEffect(() => {
    const t = setInterval(() => setFlashCount((c) => c + 1), 800);
    return () => clearInterval(t);
  }, []);

  // Data Fetching
  const fetchCasualtyLogs = async () => {
    setIsFetchingCasualties(true);
    try {
      const res = await fetch("http://localhost:5000/api/logs/casualties");
      if (res.ok) {
        const data = await res.json();
        setCasualtyLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingCasualties(false);
    }
  };

  const fetchRescuers = async () => {
    setIsFetchingRescuers(true);
    try {
      const res = await fetch("http://localhost:5000/api/rescuers");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(r => ({
          id: r.id_number || `R-${r.id}`,
          dbId: r.id,
          name: `${r.first_name} ${r.last_name}`,
          email: r.email,
          unit: r.phone_number || "Barangay Volunteer",
          idType: r.id_type,
          idNumber: r.id_number,
          isVerified: r.is_verified === 1,
          status: r.is_verified === 1 ? r.status : "offline",
          role: r.role || (r.id_type?.toLowerCase().includes("tanod") ? "Tanod" : "Rescuer"),
          assignedZone: r.assigned_zone || "Unassigned",
          lat: r.latitude ? `${r.latitude.toFixed(4)}° N` : "6.9220° N",
          lng: r.longitude ? `${r.longitude.toFixed(4)}° E` : "122.0800° E",
          battery: r.is_verified === 1 ? 95 : 0,
          lastPing: r.is_verified === 1 ? "Just now" : "--",
          assignedTargetType: r.assigned_target_type || null,
          assignedTargetId: r.assigned_target_id || null,
          assignedTargetName: r.assigned_target_name || null,
          assignedAlert: r.assigned_target_type === "alert" ? r.assigned_target_id : null
        }));
        setRescuers(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingRescuers(false);
    }
  };

  const fetchHouseholds = async () => {
    setIsFetchingHouseholds(true);
    try {
      const res = await fetch("http://localhost:5000/api/households");
      if (res.ok) {
        const data = await res.json();
        setHouseholds(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingHouseholds(false);
    }
  };

  const fetchIncidents = async () => {
    setIsFetchingIncidents(true);
    try {
      const res = await fetch("http://localhost:5000/api/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingIncidents(false);
    }
  };

  useEffect(() => {
    fetchCasualtyLogs();
    fetchRescuers();
    fetchHouseholds();
    fetchIncidents();
    const interval = setInterval(() => {
      fetchCasualtyLogs();
      fetchRescuers();
      fetchHouseholds();
      fetchIncidents();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (rescuerId, targetType, targetId, targetName) => {
    try {
      const response = await fetch("http://localhost:5000/api/rescuers/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rescuerId, targetType, targetId, targetName })
      });
      if (response.ok) {
        if (targetType === "alert") {
          setAlerts((prev) =>
            prev.map((a) => (a.id === targetId ? { ...a, status: "assigned", assignedTo: rescuerId } : a))
          );
        }
        fetchRescuers();
        setDispatchTarget(null);
      }
    } catch (err) {
      console.error("Failed to dispatch rescuer", err);
    }
  };

  const handleResolve = (alertId) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a)));
  };

  const unassignedAlerts = alerts.filter((a) => a.status === "unassigned");
  const pendingApprovals = rescuers.filter((r) => !r.isVerified);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 font-mono text-xs">
        <Activity className="animate-spin mb-3" size={24} />
        INITIALIZING COMMAND NODE...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden text-slate-800 antialiased font-sans">
      
      {/* ── Top Emergency Flash Banner (When Active Unassigned SOS) ── */}
      {unassignedAlerts.length > 0 && (
        <div className={`px-6 py-2 transition-colors duration-300 flex items-center justify-between text-white ${
          flashCount % 2 === 0 ? "bg-red-700" : "bg-red-600"
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={15} className="animate-pulse" />
            <span>⚠️ CRITICAL DISTRESS ALERT: {unassignedAlerts.length} UNASSIGNED SOS REQUEST(S) IN PROGRESS</span>
          </div>
          <button
            onClick={() => setDispatchTarget(unassignedAlerts[0])}
            className="px-3 py-1 bg-white text-red-700 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Dispatch Unit Now
          </button>
        </div>
      )}

      {/* ── Main Command Header ── */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-40">
        
        {/* Brand & Sector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md shadow-red-100 text-white">
            <Radio size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">ZamboAlert</span>
              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                Barangay Tumaga
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Disaster Risk & Rescue Operations Portal</p>
          </div>
        </div>

        {/* Center Primary Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          {[
            { id: "map", label: "Tactical Map", icon: Compass },
            { id: "alerts", label: "SOS Stream", icon: AlertTriangle, badge: unassignedAlerts.length },
            { id: "residents", label: "Residents & SMS", icon: Home },
            { id: "units", label: "Units & Tanods", icon: Users },
            { id: "reports", label: "Reports & Analytics", icon: BarChart2 },
            { id: "victims", label: "Victims DB", icon: ClipboardList, count: casualtyLogs.length },
            { id: "approvals", label: "Approvals", icon: ShieldCheck, badge: pendingApprovals.length },
            { id: "manpower", label: "Manpower Alert", icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-white text-red-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon size={14} className={isActive ? "text-red-600" : "text-slate-500"} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-black animate-pulse">
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && tab.count > 0 && !tab.badge && (
                  <span className="text-[10px] font-mono text-slate-400">({tab.count})</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Session & Tools */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono font-bold text-slate-800">{fmtTime(now)}</div>
            <div className="text-[10px] text-slate-400">
              {now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Open System Settings"
          >
            <Settings size={14} />
            <span className="hidden md:inline">Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Logout Session"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main Work Area ── */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* ── VIEW 1: TACTICAL MAP (3-Column Layout) ── */}
        {activeTab === "map" && (
          <>
            {/* Left Feed: Active SOS Alerts */}
            <aside className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    SOS Alerts Queue
                  </h3>
                  <p className="text-[10px] text-slate-500">Live incoming emergency signals</p>
                </div>
                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono font-bold rounded-full">
                  {alerts.filter(a => a.status !== "resolved").length} Active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-2">
                    <CheckCircle size={32} className="text-emerald-500" />
                    <span className="text-xs font-medium">All SOS requests are clear and resolved</span>
                  </div>
                ) : (
                  alerts.map((a) => {
                    const isUnassigned = a.status === "unassigned";
                    const isSelected = selectedAlert === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAlert(isSelected ? null : a.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-50/40 border-red-300 shadow-sm"
                            : isUnassigned
                            ? "bg-red-50/15 border-red-200 animate-pulse-border-red"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-red-700">{a.id}</span>
                          <span className="text-[10px] font-mono text-slate-400">{a.time}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">{a.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{a.zone}</div>
                        {a.message && (
                          <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 truncate">
                            &ldquo;{a.message}&rdquo;
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                          <StatusBadge status={a.status} />
                          <span className="text-[10px] font-mono text-slate-500">BAT {a.battery}%</span>
                        </div>
                        {isUnassigned && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDispatchTarget(a);
                            }}
                            className="mt-3 w-full py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Navigation size={12} />
                            Dispatch Unit
                          </button>
                        )}
                        {a.status === "assigned" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(a.id);
                            }}
                            className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle size={12} />
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Center Map */}
            <main className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
              <TacticalMap
                alerts={alerts}
                rescuers={rescuers}
                casualties={casualtyLogs}
                selected={selectedAlert}
                onSelect={(id) => {
                  setSelectedAlert(prev => prev === id ? null : id);
                  setSelectedCasualtyId(null);
                }}
                selectedCasualtyId={selectedCasualtyId}
                onSelectCasualty={(id) => {
                  setSelectedCasualtyId(prev => prev === id ? null : id);
                  setSelectedAlert(null);
                }}
                onDispatchToTarget={handleDispatch}
              />
            </main>

            {/* Right Quick Actions & Network Monitor */}
            <aside className="w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  Quick Operations
                </h3>
                <p className="text-[10px] text-slate-500">Fast action emergency dispatches</p>
              </div>

              <div className="p-4 flex flex-col gap-2.5">
                <button
                  onClick={() => setShowBroadcast(true)}
                  className="w-full py-3 px-4 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2.5 cursor-pointer"
                >
                  <Volume2 size={16} />
                  <span>LoRa Mesh Broadcast</span>
                </button>

                <button
                  onClick={() => setShowAutoCallModal(true)}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2.5 cursor-pointer"
                >
                  <PhoneForwarded size={16} />
                  <span>Auto-Call ZCDRRMO Office</span>
                </button>

                <button
                  onClick={() => setShowCallRescuerModal(true)}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2.5 cursor-pointer"
                >
                  <PhoneCall size={16} />
                  <span>Call & Dispatch Rescuer</span>
                </button>

                <button
                  onClick={() => setActiveTab("residents")}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <Home size={15} />
                  <span>Resident SMS Broadcast</span>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <BarChart2 size={15} />
                  <span>ZCDRRMO Incident Logs</span>
                </button>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Mesh Network Relays
                </h4>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {MESH_NODES.map((node) => (
                  <div key={node.id} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{node.label}</span>
                      <div className="flex items-center gap-1.5">
                        <PingDot active={node.online} />
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-600">
                          {node.online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{node.id} ({node.type})</span>
                      <div className="flex items-center gap-1.5">
                        <SignalBars bars={signalBars(node.signalDbm)} active={node.online} />
                        <span>{node.signalDbm} dBm</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* ── VIEW 2: SOS STREAM FULL VIEW ── */}
        {activeTab === "alerts" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">SOS Emergency Stream</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time distress signals from mobile apps & emergency radio beacons</p>
              </div>
              <button
                onClick={() => setActiveTab("map")}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Compass size={14} />
                <span>View on Map</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((a) => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-red-700">{a.id}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-base font-bold text-slate-900">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.zone} · {a.lat}, {a.lng}</div>
                    {a.message && (
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        &ldquo;{a.message}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Battery: {a.battery}%</span>
                    {a.status === "unassigned" ? (
                      <button
                        onClick={() => setDispatchTarget(a)}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Dispatch
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolve(a.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIEW 3: RESIDENTS & SMS ── */}
        {activeTab === "residents" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Resident Registry & SMS Broadcast</h2>
                <p className="text-xs text-slate-500 mt-0.5">Barangay Tumaga household directory and targeted SMS alerts</p>
              </div>
              <button
                onClick={fetchHouseholds}
                disabled={isFetchingHouseholds}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw size={13} className={isFetchingHouseholds ? "animate-spin" : ""} />
                <span>Sync Directory</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs text-slate-500 font-bold uppercase block">Total Households</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{households.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs text-emerald-700 font-bold uppercase block">SMS Subscribed</span>
                <span className="text-2xl font-black font-mono text-emerald-800 mt-1 block">
                  {households.filter(h => h.status === "Active").length}
                </span>
              </div>
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl">
                <span className="text-xs text-sky-700 font-bold uppercase block">Covered Residents</span>
                <span className="text-2xl font-black font-mono text-sky-800 mt-1 block">
                  {households.reduce((sum, h) => sum + (h.occupants_count || 1), 0)}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs text-amber-700 font-bold uppercase block">Seniors / PWD</span>
                <span className="text-2xl font-black font-mono text-amber-800 mt-1 block">
                  {households.reduce((sum, h) => sum + (h.vulnerable_count || 0), 0)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-4">Resident Name</th>
                    <th className="p-3.5">Mobile Number</th>
                    <th className="p-3.5">Purok / Zone</th>
                    <th className="p-3.5">Occupants</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {households.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 italic">No registered households found.</td>
                    </tr>
                  ) : (
                    households.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-slate-900">{h.resident_name}</td>
                        <td className="p-3.5 font-mono text-slate-700">{h.phone_number}</td>
                        <td className="p-3.5 font-semibold text-slate-600">{h.purok_zone}</td>
                        <td className="p-3.5 font-mono">{h.occupants_count} resident(s)</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {h.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VIEW 4: UNITS & TANODS ── */}
        {activeTab === "units" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Units & Barangay Tanods Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">Field volunteer units, zone assignments, and real-time statuses</p>
              </div>
              <button
                onClick={fetchRescuers}
                disabled={isFetchingRescuers}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw size={13} className={isFetchingRescuers ? "animate-spin" : ""} />
                <span>Sync Units</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rescuers.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-red-700">{r.id}</span>
                      <RescuerBadge status={r.status} />
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1">{r.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{r.unit}</div>
                    <div className="text-xs text-slate-600 mt-2">
                      <strong>Assigned Zone:</strong> {r.assignedZone}
                    </div>
                    <div className="text-xs text-slate-600 font-mono mt-1">
                      📍 {r.lat}, {r.lng}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Ping: {r.lastPing}</span>
                    <span>BAT: {r.battery}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIEW 5: REPORTS & ANALYTICS ── */}
        {activeTab === "reports" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">ZCDRRMO Incident Reports & Analytics</h2>
                <p className="text-xs text-slate-500 mt-0.5">Historical disaster events, response times, and evacuation records</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open("http://localhost:5000/api/incidents/export", "_blank")}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Printer size={13} />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs text-slate-500 font-bold uppercase block">Recorded Events</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{incidents.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs text-emerald-700 font-bold uppercase block">Avg Response</span>
                <span className="text-2xl font-black font-mono text-emerald-800 mt-1 block">12.4m</span>
              </div>
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl">
                <span className="text-xs text-sky-700 font-bold uppercase block">Total Rescued</span>
                <span className="text-2xl font-black font-mono text-sky-800 mt-1 block">
                  {incidents.reduce((sum, i) => sum + (i.total_rescued || 0), 0)}
                </span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                <span className="text-xs text-purple-700 font-bold uppercase block">Casualties</span>
                <span className="text-2xl font-black font-mono text-purple-800 mt-1 block">
                  {incidents.reduce((sum, i) => sum + (i.casualties_count || 0), 0)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-4">Event Title</th>
                    <th className="p-3.5">Disaster Type</th>
                    <th className="p-3.5">Date Occurred</th>
                    <th className="p-3.5">Water Level</th>
                    <th className="p-3.5">Rescued</th>
                    <th className="p-3.5">Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 italic">No disaster records logged yet.</td>
                    </tr>
                  ) : (
                    incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-slate-900">{inc.title}</td>
                        <td className="p-3.5 font-semibold text-red-700">{inc.disaster_type}</td>
                        <td className="p-3.5 font-mono text-slate-500">{inc.date_occurred}</td>
                        <td className="p-3.5 font-mono">{inc.water_level_m}m</td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">{inc.total_rescued}</td>
                        <td className="p-3.5 font-mono">{inc.avg_response_time_mins} mins</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VIEW 6: VICTIMS DATABASE ── */}
        {activeTab === "victims" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Victims Database & Casualties Log</h2>
                <p className="text-xs text-slate-500 mt-0.5">Field rescuer reports and casualty tracking</p>
              </div>
              <button
                onClick={fetchCasualtyLogs}
                disabled={isFetchingCasualties}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw size={13} className={isFetchingCasualties ? "animate-spin" : ""} />
                <span>Sync Victims</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-4">Victim Name</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Disaster Type</th>
                    <th className="p-3.5">Age / Gender</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Injuries / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {casualtyLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 italic">No victim logs recorded yet.</td>
                    </tr>
                  ) : (
                    casualtyLogs.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-slate-900">{c.victim_name}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            c.status === "Injured" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            c.status === "Rescued" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{c.disaster_type}</td>
                        <td className="p-3.5 font-mono">{c.age || "--"} / {c.gender || "--"}</td>
                        <td className="p-3.5 font-mono">{c.location}</td>
                        <td className="p-3.5 text-slate-600 italic">{c.injury_details || "No comments"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VIEW 7: APPROVALS ── */}
        {activeTab === "approvals" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Official Rescuer Verification</h2>
                <p className="text-xs text-slate-500 mt-0.5">Review credentials submitted via mobile registration</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold rounded-full">
                {pendingApprovals.length} Pending
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-3">
                <ShieldCheck size={40} className="text-emerald-500" />
                <span className="text-sm font-bold text-slate-800">All Rescuers Verified</span>
                <p className="text-xs text-slate-400 max-w-sm">No unverified rescuer accounts waiting for administrator review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((r) => (
                  <div key={r.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-500">{r.idType} ({r.idNumber})</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{r.email}</div>
                      <div className="text-xs text-slate-600 mt-1">Phone: {r.unit}</div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          await fetch(`http://localhost:5000/api/rescuers/verify/${r.dbId}`, { method: "POST" });
                          fetchRescuers();
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Approve & Verify
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Reject this rescuer registration?")) {
                            await fetch(`http://localhost:5000/api/rescuers/${r.dbId}`, { method: "DELETE" });
                            fetchRescuers();
                          }
                        }}
                        className="py-2.5 px-4 border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 8: MANPOWER ALERT ── */}
        {activeTab === "manpower" && <ManpowerAlertPage />}

      </div>

      {/* ── Modals ── */}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
      {dispatchTarget && (
        <DispatchModal
          alert={dispatchTarget}
          rescuers={rescuers}
          onDispatch={handleDispatch}
          onClose={() => setDispatchTarget(null)}
        />
      )}
      {showCallRescuerModal && (
        <CallRescuerModal
          rescuers={rescuers}
          casualties={casualtyLogs}
          alerts={alerts}
          onClose={() => setShowCallRescuerModal(false)}
          onDispatch={(rescuerId, targetType, targetId, targetName) => {
            handleDispatch(rescuerId, targetType, targetId, targetName);
            setShowCallRescuerModal(false);
          }}
        />
      )}
      {showAutoCallModal && (
        <AutoCallZcdrrmoModal
          alerts={alerts}
          casualties={casualtyLogs}
          onClose={() => setShowAutoCallModal(false)}
        />
      )}
    </div>
  );
}
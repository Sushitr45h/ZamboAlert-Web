import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

// ── Small components ───────────────────────────────────────────────────────────

function SignalBars({ bars, active }) {
  return (
    <span className="inline-flex items-end gap-px h-3">
      {[1, 2, 3, 4].map((b) => (
        <span
          key={b}
          className="w-1 rounded-sm"
          style={{
            height: `${b * 3}px`,
            background: b <= bars && active ? "#dc2626" : "rgba(220,38,38,0.15)",
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
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-50" />
      )}
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ background: active ? "#dc2626" : "#fca5a5" }}
      />
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    unassigned: "bg-red-800 text-white",
    assigned: "bg-orange-500 text-white",
    resolved: "bg-green-600 text-white",
  }[status];
  return (
    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-px rounded-sm ${cfg}`}>
      {status}
    </span>
  );
}

function RescuerBadge({ status }) {
  const cfg = {
    available: "bg-green-100 text-green-700 border border-green-300",
    "en-route": "bg-orange-100 text-orange-700 border border-orange-300",
    "on-scene": "bg-red-100 text-red-800 border border-red-300",
  }[status];
  return (
    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-px rounded-sm ${cfg}`}>
      {status}
    </span>
  );
}

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
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
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

  // Update Base Layer (Street vs Satellite)
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const url = is3D
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";

    const attribution = is3D
      ? "&copy; Esri &mdash; Source: Esri, USDA, USGS, GeoEye, and the GIS User Community"
      : "&copy; OpenStreetMap contributors &copy; CARTO";

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
          return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M4 10l8-7 8 7"/></svg>`;
        }
        if (type === "medical") {
          return `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="display: block;"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
        }
        if (type === "school") {
          return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`;
        }
        if (type === "court") {
          return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 1 4 4v3H8V6a4 4 0 0 1 4-4z"/></svg>`;
        }
        if (type === "chapel") {
          return `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="display: block;"><path d="M11 2h2v5h5v2h-5v12h-2V9H6V7h5V2z"/></svg>`;
        }
        if (type === "comm") {
          return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>`;
        }
        return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
      };

      const customIcon = L.divIcon({
        html: `
          <div class="building-icon-container" style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            background-color: ${getBuildingColor(b.type)}20;
            border: 1.5px solid ${getBuildingBorderColor(b.type)};
            border-radius: 6px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            color: ${getBuildingBorderColor(b.type)};
          ">
            ${getBuildingSvgIcon(b.type)}
          </div>
        `,
        className: "custom-building-marker",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const buildingMarker = L.marker([b.lat, b.lng], { icon: customIcon });

      buildingMarker.bindTooltip(
        `<div style="font-family: monospace; font-size: 9px; padding: 2px;">
          <strong>${b.name}</strong><br/>
          <span style="font-size: 7.5px; opacity: 0.8; text-transform: uppercase;">Type: ${b.type}</span>
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
            ${isUnassigned ? '<span class="absolute w-8 h-8 rounded-full border-2 border-red-600 animate-ping opacity-60" style="margin-top:-6px;"></span>' : ""}
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full border text-[8px] font-bold font-mono transition-transform ${
              isSel ? "scale-125 border-red-500 bg-red-950 text-white shadow-lg font-extrabold" : "bg-red-800 border-red-800 text-white shadow-md"
            } ${a.status === "assigned" ? "bg-orange-500 border-orange-600 text-white" : ""}">
              SOS
            </div>
            <span class="absolute top-7 bg-slate-900 text-white text-[7.5px] px-1 py-0.5 rounded border border-slate-700 font-mono whitespace-nowrap shadow-md z-50">
              ${a.name}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: html,
          className: "custom-sos-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
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
            <div class="relative flex items-center justify-center w-5 h-5 rounded border text-[8px] font-bold font-mono transition-transform ${
              r.status === "available"
                ? "bg-cyan-500 border-cyan-600 text-white shadow-sm"
                : r.status === "en-route"
                ? "bg-orange-500 border-orange-600 text-white shadow-[0_0_6px_rgba(249,115,22,0.3)]"
                : "bg-red-600 border-red-700 text-white"
            }">
              R
            </div>
            <span class="absolute top-6 bg-cyan-950 text-cyan-200 text-[7px] px-1 py-px rounded border border-cyan-800 font-mono whitespace-nowrap shadow-sm">
              ${r.id}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: html,
          className: "custom-rescuer-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
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
          Injured: "bg-amber-500 border-amber-600 text-white",
          Deceased: "bg-purple-800 border-purple-900 text-white",
          Missing: "bg-red-600 border-red-700 text-white animate-pulse",
          Rescued: "bg-green-600 border-green-700 text-white",
        }[c.status] || "bg-slate-500 border-slate-600 text-white";

        const html = `
          <div class="relative flex flex-col items-center justify-center">
            ${isSel ? '<span class="absolute w-6 h-6 rounded-full border border-dashed border-red-600 animate-spin" style="margin-top:-3px;"></span>' : ""}
            <div class="relative flex items-center justify-center w-4 h-4 rounded-full border text-[8px] font-extrabold font-mono transition-transform ${statusColors}">
              V
            </div>
            <span class="absolute top-5 bg-white text-slate-800 text-[7px] px-1 py-px rounded border border-slate-300 font-mono whitespace-nowrap shadow-xs">
              ${c.victim_name}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: html,
          className: "custom-casualty-marker",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const popupDiv = document.createElement("div");
        popupDiv.className = "p-2 font-mono text-[10px] text-slate-800 max-w-[200px]";
        
        // Find if any rescuer is currently dispatched to this victim
        const assignedRescuer = rescuers.find(r => r.status === "en-route" && r.assignedTargetType === "victim" && String(r.assignedTargetId) === String(c.id));
        
        popupDiv.innerHTML = `
          <div class="font-bold text-red-950 border-b border-red-100 pb-1 mb-1">VICTIM INFO: VIC-${c.id}</div>
          <div class="space-y-0.5 mb-2">
            <div><strong>Name:</strong> ${c.victim_name}</div>
            <div><strong>Status:</strong> <span class="font-semibold uppercase text-red-700">${c.status}</span></div>
            <div><strong>Age/Gender:</strong> ${c.age || "N/A"} / ${c.gender || "N/A"}</div>
            <div><strong>Injury:</strong> <span class="italic text-slate-500">${c.injury_details || "None listed"}</span></div>
          </div>
          <div class="mt-2 border-t border-slate-100 pt-1.5 flex flex-col gap-1">
            ${
              assignedRescuer
                ? `<div class="text-[9px] text-green-700 font-bold bg-green-50 p-1 border border-green-200 rounded-sm text-center">
                     Dispatched: ${assignedRescuer.name}
                   </div>`
                : `<label class="text-[9px] font-bold text-slate-500">ASSIGN RESCUER</label>
                   <select id="popup-select-${c.id}" class="w-full text-[10px] p-1 border border-red-100 rounded-sm bg-white text-red-900 outline-none">
                     ${
                       rescuers.filter(r => r.isVerified && r.status === "available").length === 0
                         ? '<option value="">No rescuers available</option>'
                         : rescuers.filter(r => r.isVerified && r.status === "available").map(r => `<option value="${r.id}">${r.name}</option>`).join("")
                     }
                   </select>
                   <button id="popup-btn-${c.id}" class="mt-1 w-full bg-red-800 hover:bg-red-900 text-white font-bold text-[9px] py-1 rounded-sm transition-colors uppercase tracking-wider cursor-pointer" ${
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

    // 1b. Draw Barangay Hall Detection Web
    if (showDetectionWeb) {
      const bhCoords = [6.9235, 122.0780]; // Tumaga Barangay Hall
      
      // Outer Range Ring (3km - Dense Urban Limit)
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

      // Mid Range Ring (2km - Dense Urban Mid)
      L.circle(bhCoords, {
        radius: 2000,
        color: "#dc2626",
        weight: 1.2,
        dashArray: "6, 6",
        fillColor: "#dc2626",
        fillOpacity: 0.04,
        className: "radar-ring-mid",
        interactive: false,
      }).addTo(pathsGroupRef.current);

      // Inner Dense Ring (1km - Dense Urban Core)
      L.circle(bhCoords, {
        radius: 1000,
        color: "#dc2626",
        weight: 1.8,
        fillColor: "#dc2626",
        fillOpacity: 0.08,
        className: "radar-ring-inner",
        interactive: false,
      }).addTo(pathsGroupRef.current);
    }

    // 5. Draw Dispatch paths & Routing Detection Web
    rescuers
      .filter((r) => r.assignedAlert || r.assignedTargetType)
      .forEach((r) => {
        let tLat = null;
        let tLng = null;
        let tName = "";
        let pulseColor = "#ef4444"; // Red for alert/victim
        let radarRange = 90;

        if (r.assignedAlert) {
          const alert = alerts.find((a) => a.id === r.assignedAlert);
          if (alert) {
            tLat = parseCoordinate(alert.lat || alert.latitude);
            tLng = parseCoordinate(alert.lng || alert.longitude);
            tName = alert.name;
          }
        } else if (r.assignedTargetType === "victim") {
          const victim = casualties.find((c) => String(c.id) === String(r.assignedTargetId));
          if (victim) {
            tLat = parseCoordinate(victim.latitude || victim.lat);
            tLng = parseCoordinate(victim.longitude || victim.lng);
            tName = victim.victim_name;
            pulseColor = "#f59e0b"; // Orange/Amber for injured victim
          }
        } else if (r.assignedTargetType === "respondent") {
          const other = rescuers.find((res) => String(res.id) === String(r.assignedTargetId));
          if (other) {
            tLat = parseCoordinate(other.lat || other.latitude);
            tLng = parseCoordinate(other.lng || other.longitude);
            tName = other.name;
            pulseColor = "#06b6d4"; // Cyan for rescuer
            radarRange = 120;
          } else {
            const node = MESH_NODES.find((n) => String(n.id) === String(r.assignedTargetId));
            if (node && node.coords) {
              tLat = node.coords[0];
              tLng = node.coords[1];
              tName = node.label;
              pulseColor = "#f97316"; // Orange for mesh nodes
              radarRange = 70;
            }
          }
        }

        const rLat = parseCoordinate(r.lat || r.latitude);
        const rLng = parseCoordinate(r.lng || r.longitude);

        if (rLat && rLng && tLat && tLng) {
          // Animated polyline representing active rescue route flow
          const polyline = L.polyline([[rLat, rLng], [tLat, tLng]], {
            color: pulseColor,
            weight: 3,
            dashArray: "6, 6",
            opacity: 0.85,
            className: "routing-line-animated",
          });
          polyline.addTo(pathsGroupRef.current);

          if (showDetectionWeb) {
            // Dynamic coverage web around the Rescuer Unit (120m range)
            L.circle([rLat, rLng], {
              radius: 120,
              color: "#06b6d4",
              weight: 1.5,
              dashArray: "4, 4",
              fillColor: "#06b6d4",
              fillOpacity: 0.04,
              className: "rescuer-radar-pulse",
              interactive: false,
            }).addTo(pathsGroupRef.current);

            // Dynamic coverage web around the target (radarRange range)
            L.circle([tLat, tLng], {
              radius: radarRange,
              color: pulseColor,
              weight: 1.5,
              dashArray: "3, 6",
              fillColor: pulseColor,
              fillOpacity: 0.05,
              className: "alert-radar-pulse",
              interactive: false,
            }).addTo(pathsGroupRef.current);

            // Intermediate Mesh relay nodes along the routing line to form a "connection web"
            const steps = 4;
            for (let i = 1; i < steps; i++) {
              const fraction = i / steps;
              const intLat = rLat + fraction * (tLat - rLat);
              const intLng = rLng + fraction * (tLng - rLng);

              // Circular coverage pulse for the relay node
              L.circle([intLat, intLng], {
                radius: 70,
                color: "#f97316",
                weight: 1,
                dashArray: "2, 4",
                fillColor: "#f97316",
                fillOpacity: 0.03,
                className: "intermediate-mesh-node",
                interactive: false,
              }).addTo(pathsGroupRef.current);

              // Core visual dot for the intermediate relay hop
              L.circleMarker([intLat, intLng], {
                radius: 3,
                color: "#f97316",
                fillColor: "#ffffff",
                fillOpacity: 1,
                weight: 1.5,
                className: "intermediate-mesh-core",
                interactive: false,
              }).addTo(pathsGroupRef.current);
            }
          }
        }
      });
  }, [alerts, rescuers, casualties, selected, selectedCasualtyId, showDetectionWeb]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetZoom = () => {
    if (mapRef.current) {
      mapRef.current.setView([6.9214, 122.0790], 15);
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-sm select-none border border-red-200/20"
      style={{
        background: "#f8fafc",
      }}
    >
      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* Map Layer & Detection Web Controls */}
      <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1.5">
        <div
          className={`flex gap-1 p-0.5 rounded border backdrop-blur-sm transition-colors duration-500 ${
            is3D ? "bg-slate-100 border-slate-200" : "bg-red-950/5 border-red-800/10"
          }`}
        >
          <button
            onClick={() => setIs3D(false)}
            className={`px-2 py-0.5 text-[8px] font-mono border transition-all cursor-pointer rounded-sm ${
              !is3D ? "bg-red-800 border-red-800 text-white font-bold" : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            2D PLAN
          </button>
          <button
            onClick={() => setIs3D(true)}
            className={`px-2 py-0.5 text-[8px] font-mono border transition-all cursor-pointer rounded-sm ${
              is3D ? "bg-slate-900 border-slate-900 text-white font-bold shadow-sm" : "bg-transparent border-transparent text-red-800 hover:text-red-950"
            }`}
          >
            3D SATELLITE
          </button>
        </div>

        <div className="flex p-0.5 rounded border backdrop-blur-sm bg-white/90 border-slate-200 shadow-xs animate-fade-in">
          <button
            onClick={() => setShowDetectionWeb(!showDetectionWeb)}
            className={`w-full px-2 py-0.5 text-[8px] font-mono border transition-all cursor-pointer rounded-sm flex items-center justify-center gap-1 ${
              showDetectionWeb
                ? "bg-red-800 border-red-800 text-white font-bold"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Signal size={8} />
            {showDetectionWeb ? "MESH WEB: ON" : "MESH WEB: OFF"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-2 left-2 z-[1000] flex flex-col gap-1 text-[9px] font-mono bg-white/60 backdrop-blur-md rounded border border-slate-200/40 shadow-sm p-1.5"
        style={{ color: "#1e293b" }}
      >
        <div className="flex items-center gap-1 border-b border-slate-200/40 pb-1 mb-1 font-semibold text-slate-900">
          <Layers size={10} className="text-slate-700" />
          <span className="text-[8px] tracking-wider">MAP LEGEND</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded-full bg-red-800 border border-red-800 text-white flex items-center justify-center text-[7px]" style={{ lineHeight: '12px' }}>SOS</span>
          SOS ALERT
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-600 text-white flex items-center justify-center text-[7px]" style={{ lineHeight: '12px' }}>R</span>
          RESCUER UNIT
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 flex items-center justify-center text-[7px] text-white" style={{ lineHeight: '12px' }}>V</span>
          VICTIM LOG
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-400 flex items-center justify-center text-[7.5px] text-slate-700">
            <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M4 10l8-7 8 7"/></svg>
          </span>
          KEY BUILDING
        </div>
        {showDetectionWeb && (
          <>
            <div className="h-px bg-slate-200/60 my-0.5" />
            <div className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="w-3 h-3 rounded-full border border-dashed border-red-600/80 bg-red-500/10 flex items-center justify-center text-[6px]" style={{ lineHeight: '12px' }}>◎</span>
              GATEWAY RANGE (BH - 3km DENSE URBAN)
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="w-3 h-3 rounded-full border border-dashed border-cyan-500/80 bg-cyan-500/10 flex items-center justify-center text-[6px]" style={{ lineHeight: '12px' }}>◎</span>
              MOBILE MESH RANGE
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="w-3 h-3 rounded-full border border-dashed border-orange-500/80 bg-orange-50/10 flex items-center justify-center text-[6px]" style={{ lineHeight: '12px' }}>◎</span>
              RELAY DETECTION ZONE
            </div>
          </>
        )}
      </div>

      {/* Zoom / Navigation Controls */}
      <div className="absolute bottom-2 right-2 z-[1000] flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="flex items-center justify-center w-6 h-6 border rounded-sm font-bold shadow-xs cursor-pointer transition-all bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          title="Zoom In"
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex items-center justify-center w-6 h-6 border rounded-sm font-bold shadow-xs cursor-pointer transition-all bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          title="Zoom Out"
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleResetZoom}
          className="flex items-center justify-center w-6 h-6 border rounded-sm shadow-xs cursor-pointer transition-all bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          title="Reset View"
        >
          <RefreshCw size={10} />
        </button>
      </div>

      {/* Coords */}
      <div className="absolute top-2 right-2 z-[1000] text-[9px] font-mono text-right transition-colors duration-500 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-200/50" style={{ color: "#475569" }}>
        <div>6.9214° N / 122.0790° E</div>
        <div>TUMAGA, ZAMBOANGA CITY</div>
      </div>

      {/* Target assignment alert overlay banner */}
      {(() => {
        if (!selectedCasualtyId) return null;
        const selectedCasualty = casualties.find(c => String(c.id) === String(selectedCasualtyId));
        if (!selectedCasualty) return null;
        const assignedRescuer = rescuers.find(r => r.assignedTargetType === "victim" && String(r.assignedTargetId) === String(selectedCasualtyId));
        if (assignedRescuer) return null;

        return (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[1000] bg-white border-2 border-red-500 rounded p-3 shadow-xl max-w-sm w-11/12 animate-fade-in flex flex-col gap-2 font-mono text-[10px] text-red-950">
            <button
              onClick={() => {
                if (onSelectCasualty) onSelectCasualty(null);
              }}
              className="absolute top-2 right-2 text-red-400 hover:text-red-700 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={12} />
            </button>
            <div className="flex items-center gap-1.5 font-bold text-red-700 pr-5">
              <AlertTriangle size={12} className="animate-pulse" />
              <span>UNASSIGNED VICTIM: VIC-{selectedCasualty.id}</span>
            </div>
            <div>
              <strong>Name:</strong> {selectedCasualty.victim_name}<br/>
              <strong>Status:</strong> <span className="text-red-700 font-bold">{selectedCasualty.status}</span> · {selectedCasualty.location}<br/>
              <strong>Injury:</strong> {selectedCasualty.injury_details || "N/A"}
            </div>
            <div className="border-t border-red-100 pt-2 flex flex-col gap-1">
              <div className="font-bold text-[8px] uppercase tracking-wider text-slate-500">Quick Dispatch Rescuer:</div>
              <div className="flex gap-1.5">
                <select
                  id="quick-dispatch-select"
                  className="flex-1 bg-red-50 border border-red-200 text-red-900 rounded p-1 text-[10px] outline-none"
                >
                  {rescuers.filter(r => r.isVerified && r.status === "available").length === 0 ? (
                    <option value="">No rescuers available</option>
                  ) : (
                    rescuers.filter(r => r.isVerified && r.status === "available").map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  )}
                </select>
                <button
                  onClick={() => {
                    const selectEl = document.getElementById("quick-dispatch-select");
                    const rescuerId = selectEl ? selectEl.value : "";
                    if (rescuerId) {
                      if (onDispatchToTarget) {
                        onDispatchToTarget(rescuerId, "victim", selectedCasualty.id, selectedCasualty.victim_name);
                      }
                    } else {
                      alert("Please select a rescuer to dispatch.");
                    }
                  }}
                  disabled={rescuers.filter(r => r.isVerified && r.status === "available").length === 0}
                  className="bg-red-800 hover:bg-red-950 disabled:bg-red-100 disabled:text-red-300 disabled:border-red-100 text-white font-bold px-2 py-1 rounded text-[9px] uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Navigation size={10} />
                  DISPATCH
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Settings Modal ─────────────────────────────────────────────────────────────

function SettingsModal({
  settings,
  rescuers,
  onToggleSetting,
  onVerifyRescuer,
  onClose,
  onLogout,
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-sm">
      <div className="bg-white border border-red-200 rounded-sm w-full max-w-lg mx-4 shadow-2xl shadow-red-100 font-mono text-xs text-red-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-red-800" />
            <span className="text-sm font-semibold tracking-widest uppercase text-red-800">
              System Settings
            </span>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-800 transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {/* Rule Card */}
          <div className="bg-red-50/40 p-4 border border-red-100 rounded-sm shadow-xs space-y-3">
            <h4 className="text-[10px] font-bold text-red-800 tracking-wider uppercase">Rescuer Onboarding Rules</h4>
            <div className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="require-approval-chk-modal"
                checked={settings.requireRescuerApproval}
                onChange={(e) => onToggleSetting("require_rescuer_approval", e.target.checked)}
                className="mt-0.5 rounded border-red-200 text-red-800 focus:ring-red-500 focus:border-red-400"
              />
              <label htmlFor="require-approval-chk-modal" className="flex-1 text-[10px] text-slate-700 leading-tight cursor-pointer">
                <span className="font-semibold text-slate-900 block">Require Administrator Approval</span>
                When enabled, rescuers registering from the mobile application must be manually verified and approved by the administrator before receiving rescue alerts. If disabled, rescuers are auto-approved upon registration.
              </label>
            </div>
          </div>

          {/* Pending Applications section */}
          <div className="border border-red-100 rounded-sm p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-red-50 pb-2">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                Pending Rescuer Applications ({rescuers.filter(r => !r.isVerified).length})
              </h4>
              {rescuers.filter(r => !r.isVerified).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {rescuers.filter(r => !r.isVerified).length === 0 ? (
                <div className="text-[10px] text-slate-400 text-center py-6 italic font-mono">
                  No pending registration applications at this time.
                </div>
              ) : (
                rescuers.filter(r => !r.isVerified).map(r => (
                  <div key={`settings-modal-pend-${r.id}`} className="bg-amber-50/20 p-3 rounded border border-amber-200/50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">{r.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{r.email}</div>
                      </div>
                      <span className="text-[8px] font-mono font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/60 uppercase">
                        {r.idType}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono space-y-0.5">
                      <div>ID Number: {r.idNumber}</div>
                      <div>Contact Info: {r.unit}</div>
                    </div>
                    <button
                      onClick={() => onVerifyRescuer(r.dbId)}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle size={10} />
                      Approve & Verify Rescuer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account/Session Action */}
          <div className="border border-red-100 rounded-sm p-4 bg-white flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Account Session
            </h4>
            <button
              onClick={onLogout}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 hover:border-red-300 text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-mono"
            >
              <LogOut size={12} />
              Logout System
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Broadcast Modal ────────────────────────────────────────────────────────────

function BroadcastModal({ onClose }) {
  const [msg, setMsg] = useState("");
  const [priority, setPriority] = useState("emergency");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!msg.trim()) return;
    setSent(true);
    setTimeout(() => onClose(), 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-sm">
      <div className="bg-white border border-red-200 rounded-sm w-full max-w-lg mx-4 shadow-2xl shadow-red-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-red-800" />
            <span className="text-sm font-semibold tracking-widest uppercase text-red-800">
              Broadcast Announcement
            </span>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-800 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <CheckCircle size={32} className="text-green-500" />
              <span className="text-sm font-mono text-green-600">BROADCAST TRANSMITTED</span>
              <span className="text-xs text-red-400">Broadcast transmitted to all active nodes</span>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {["emergency", "advisory", "info"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-sm border transition-colors ${
                      priority === p
                        ? "bg-red-800 border-red-800 text-white"
                        : "border-red-200 text-slate-600 hover:border-red-400 hover:text-red-800"
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
                placeholder="Enter announcement message to broadcast across all mesh nodes..."
                className="w-full bg-red-50 border border-red-200 rounded-sm text-sm text-red-900 placeholder:text-slate-400 resize-none p-3 outline-none focus:border-red-400 font-mono"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>TARGET: ALL ACTIVE NODES</span>
                <span>{msg.length} / 280</span>
              </div>
              <button
                onClick={handleSend}
                disabled={!msg.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-800 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wider rounded-sm transition-colors"
              >
                <Send size={13} />
                TRANSMIT BROADCAST
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dispatch Modal ─────────────────────────────────────────────────────────────

function DispatchModal({
  alert,
  rescuers,
  onDispatch,
  onClose,
}) {
  const [chosen, setChosen] = useState(null);
  const available = rescuers.filter((r) => r.status === "available");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-sm">
      <div className="bg-white border border-red-200 rounded-sm w-full max-w-md mx-4 shadow-2xl shadow-red-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-red-800" />
            <span className="text-sm font-semibold tracking-widest uppercase text-red-800">
              Dispatch Rescue Unit
            </span>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-800 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="bg-red-50 border border-red-100 rounded-sm p-3 text-xs font-mono space-y-1">
            <div className="text-red-800 font-semibold">{alert.id} — {alert.name}</div>
            <div className="text-slate-600">{alert.zone} · {alert.lat}, {alert.lng}</div>
            {alert.message && (
              <div className="text-red-800 italic border-t border-red-100 pt-1 mt-1">&ldquo;{alert.message}&rdquo;</div>
            )}
          </div>
          <div className="text-[10px] font-mono text-red-700 uppercase tracking-widest">
            Available Units ({available.length})
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {available.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">No units available</div>
            )}
            {available.map((r) => (
              <button
                key={r.id}
                onClick={() => setChosen(r.id)}
                className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-colors ${
                  chosen === r.id
                    ? "border-red-600 bg-red-50"
                    : "border-red-100 hover:border-red-300"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-red-900">{r.name}</div>
                  <div className="text-[10px] font-mono text-slate-600">{r.unit} · {r.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-red-600">BAT {r.battery}%</span>
                  {chosen === r.id && <CheckCircle size={12} className="text-red-800" />}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => chosen && onDispatch(alert.id, chosen)}
            disabled={!chosen}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-800 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wider rounded-sm transition-colors"
          >
            <Navigation size={13} />
            AUTHORIZE DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Victims Database View ──────────────────────────────────────────────────────

function VictimsDatabaseView({
  casualtyLogs,
  fetchCasualtyLogs,
  onSimulateClick,
  onShowOnMap,
  isFetching
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Stats calculation
  const total = casualtyLogs.length;
  const injured = casualtyLogs.filter(c => c.status === "Injured").length;
  const deceased = casualtyLogs.filter(c => c.status === "Deceased").length;
  const missing = casualtyLogs.filter(c => c.status === "Missing").length;
  const rescued = casualtyLogs.filter(c => c.status === "Rescued").length;

  const filteredLogs = casualtyLogs.filter(c => {
    const matchesSearch =
      c.victim_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.rescuer_id && c.rescuer_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.injury_details && c.injury_details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all recorded casualty and victim logs? This cannot be undone.")) return;
    try {
      const response = await fetch("http://localhost:5000/api/logs/casualties/clear", { method: "POST" });
      if (response.ok) {
        fetchCasualtyLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Metrics Row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "TOTAL LOGGED", value: total, border: "border-red-200", bg: "bg-red-50/50", text: "text-red-900" },
          { label: "INJURED", value: injured, border: "border-amber-200", bg: "bg-amber-50/30", text: "text-amber-700" },
          { label: "DECEASED", value: deceased, border: "border-purple-200", bg: "bg-purple-50/30", text: "text-purple-800" },
          { label: "MISSING", value: missing, border: "border-red-200", bg: "bg-red-50/30", text: "text-red-600" },
          { label: "RESCUED", value: rescued, border: "border-green-200", bg: "bg-green-50/30", text: "text-green-700" },
        ].map((stat, i) => (
          <div key={i} className={`border ${stat.border} ${stat.bg} p-3 rounded-sm flex flex-col justify-between shadow-sm`}>
            <span className="text-[9px] text-red-700 font-bold uppercase tracking-wider">{stat.label}</span>
            <span className={`text-2xl font-bold mt-1 ${stat.text}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-red-100 rounded-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-slate-500"><Search size={14} /></span>
          <input
            type="text"
            placeholder="Search victims, locations, rescuers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-red-50/30 border border-red-100 rounded-sm px-2 py-1 outline-none text-red-900 placeholder:text-slate-400 text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          {["ALL", "Injured", "Deceased", "Missing", "Rescued"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-sm border text-[9px] font-mono uppercase transition-colors ${
                statusFilter === st
                  ? "bg-red-800 border-red-800 text-white"
                  : "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCasualtyLogs}
            disabled={isFetching}
            className="p-1.5 border border-red-100 hover:border-red-300 text-red-500 rounded-sm"
            title="Refresh database"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onSimulateClick}
            className="bg-red-800 hover:bg-red-800 text-white px-3 py-1.5 rounded-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={12} />
            RECORD CASUALTY
          </button>
          {total > 0 && (
            <button
              onClick={handleClearAll}
              className="border border-red-200 hover:border-red-400 text-red-500 hover:text-red-800 px-3 py-1.5 rounded-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={12} />
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white border border-red-100 rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50 border-b border-red-100 text-[10px] text-red-800 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Victim Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Age / Gender</th>
                <th className="py-2.5 px-3">Injury Details / Notes</th>
                <th className="py-2.5 px-3">Location Zone</th>
                <th className="py-2.5 px-3">Reported By</th>
                <th className="py-2.5 px-3">Time Logged</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No casualty records matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((c) => {
                  const statusBadgeClass = {
                    Injured: "bg-amber-100 text-amber-800 border-amber-300",
                    Deceased: "bg-purple-100 text-purple-800 border-purple-300",
                    Missing: "bg-red-100 text-red-800 border-red-300",
                    Rescued: "bg-green-100 text-green-800 border-green-300",
                  }[c.status] || "bg-slate-100 text-slate-800 border-slate-300";

                  return (
                    <tr key={c.id} className="hover:bg-red-50/30 text-red-900 transition-colors">
                      <td className="py-3 px-3 font-semibold text-xs text-red-800">
                        {c.victim_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-px border rounded-sm ${statusBadgeClass}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-mono">
                        {c.age ? `${c.age} y/o` : "--"} / {c.gender || "--"}
                      </td>
                      <td className="py-3 px-3 text-slate-700 italic">
                        {c.injury_details || "No comments"}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="font-semibold text-red-900">{c.location || "--"}</div>
                        {c.latitude && c.longitude && (
                          <div className="text-[9px] text-slate-500">{c.latitude}, {c.longitude}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {c.rescuer_name ? `${c.rescuer_name} (${c.rescuer_id})` : c.rescuer_id || "--"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {c.latitude && c.longitude ? (
                          <button
                            onClick={() => onShowOnMap(c)}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 hover:text-red-800 px-2 py-1 rounded-sm text-[10px] font-bold tracking-wider transition-colors"
                          >
                            LOCATE MAP
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">No Coords</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Record Casualty Modal (Simulated Rescuer action) ───────────────────────────

function RecordCasualtyModal({ onClose, onRecord }) {
  const [victimName, setVictimName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Unknown");
  const [status, setStatus] = useState("Injured");
  const [injuryDetails, setInjuryDetails] = useState("");
  const [location, setLocation] = useState("Zone 1 - Riverbank");
  const [rescuerId, setRescuerId] = useState("R-01");

  // Generate random coordinates inside Barangay Tumaga boundaries on mount
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    // Tumaga bounds: Lat 6.9200-6.9260, Lng 122.0720-122.0830
    const lat = (6.9200 + Math.random() * 0.0060).toFixed(4);
    const lng = (122.0720 + Math.random() * 0.0110).toFixed(4);
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!victimName.trim()) return;

    const rescuersMap = {
      "R-01": "Rescue Team Alpha",
      "R-02": "Medic Unit 1",
      "R-03": "Rescue Team Beta"
    };

    onRecord({
      rescuer_id: rescuerId,
      rescuer_name: rescuersMap[rescuerId] || "External Rescuer",
      victim_name: victimName,
      age: age ? parseInt(age) : null,
      gender,
      status,
      injury_details: injuryDetails,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-sm">
      <div className="bg-white border border-red-200 rounded-sm w-full max-w-md mx-4 shadow-2xl shadow-red-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-red-800" />
            <span className="text-sm font-semibold tracking-widest uppercase text-red-800">
              Simulate Rescuer Report
            </span>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-800 transition-colors">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5 text-xs font-mono">
          <div className="text-[10px] text-slate-500 leading-normal uppercase">
          
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] text-red-700 font-bold">RESCUER UNIT</label>
              <select
                value={rescuerId}
                onChange={(e) => setRescuerId(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400"
              >
                <option value="R-01">R-01 (Rescue Team Alpha)</option>
                <option value="R-02">R-02 (Medic Unit 1)</option>
                <option value="R-03">R-03 (Rescue Team Beta)</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] text-red-700 font-bold">VICTIM STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400 font-bold text-red-800"
              >
                <option value="Injured">Injured</option>
                <option value="Deceased">Deceased</option>
                <option value="Missing">Missing</option>
                <option value="Rescued">Rescued</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-red-700 font-bold">VICTIM NAME</label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Santos or Unknown Male"
              value={victimName}
              onChange={(e) => setVictimName(e.target.value)}
              className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] text-red-700 font-bold">AGE</label>
              <input
                type="number"
                placeholder="Optional"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] text-red-700 font-bold">GENDER</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400"
              >
                <option value="Unknown">Unknown</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-red-700 font-bold">LOCATION ZONE</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400"
            >
              <option value="Zone 1 - Riverbank">Zone 1 - Riverbank</option>
              <option value="Zone 2 - Commercial">Zone 2 - Commercial</option>
              <option value="Zone 3 - Lowland">Zone 3 - Lowland</option>
              <option value="Zone 4 - Chapel Area">Zone 4 - Chapel Area</option>
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] text-red-700 font-bold">LATITUDE</label>
              <input
                type="number"
                step="0.0001"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400 font-mono"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] text-red-700 font-bold">LONGITUDE</label>
              <input
                type="number"
                step="0.0001"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-red-700 font-bold">INJURY DETAILS / COMMENTS</label>
            <textarea
              value={injuryDetails}
              onChange={(e) => setInjuryDetails(e.target.value)}
              rows={2}
              placeholder="e.g. Compound fracture, internal bleeding, or Drowning victim..."
              className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none text-red-900 focus:border-red-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-red-100 hover:border-red-300 text-red-500 rounded-sm font-semibold transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!victimName.trim()}
              className="flex-1 py-2 bg-red-800 hover:bg-red-800 text-white rounded-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              TRANSMIT FIELD LOG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Call Rescuer Modal ──────────────────────────────────────────────────────────

function CallRescuerModal({ rescuers, casualties, alerts, onClose, onDispatch }) {
  const [selectedRescuerId, setSelectedRescuerId] = useState("");
  const [targetType, setTargetType] = useState("victim"); // "victim", "alert", "respondent"
  const [targetId, setTargetId] = useState("");

  const availableRescuers = rescuers.filter(r => r.isVerified && r.status === "available");

  useEffect(() => {
    // Select first available rescuer by default
    if (availableRescuers.length > 0 && !selectedRescuerId) {
      setSelectedRescuerId(availableRescuers[0].id);
    }
  }, [availableRescuers, selectedRescuerId]);

  // Handle target type change
  useEffect(() => {
    setTargetId("");
  }, [targetType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRescuerId || !targetType || !targetId) {
      alert("Please select both a rescuer and a target.");
      return;
    }

    let targetName = "";
    if (targetType === "victim") {
      const victim = casualties.find(c => String(c.id) === String(targetId));
      targetName = victim ? victim.victim_name : `Victim #${targetId}`;
    } else if (targetType === "alert") {
      const alertItem = alerts.find(a => String(a.id) === String(targetId));
      targetName = alertItem ? alertItem.name : `SOS Alert #${targetId}`;
    } else if (targetType === "respondent") {
      const otherRescuer = rescuers.find(r => String(r.id) === String(targetId));
      if (otherRescuer) {
        targetName = otherRescuer.name;
      } else {
        const node = MESH_NODES.find(n => String(n.id) === String(targetId));
        targetName = node ? node.label : `Node #${targetId}`;
      }
    }

    onDispatch(selectedRescuerId, targetType, targetId, targetName);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-sm">
      <div className="bg-white border border-red-200 rounded-sm w-full max-w-md mx-4 shadow-2xl shadow-red-100 font-mono text-xs text-red-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-2">
            <PhoneCall size={14} className="text-red-800" />
            <span className="text-sm font-semibold tracking-widest uppercase text-red-800">
              Call & Dispatch Rescuer
            </span>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-800 transition-colors">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-red-700 font-bold uppercase">1. Select Rescuer Unit</label>
            {availableRescuers.length === 0 ? (
              <div className="text-red-500 font-semibold p-2 border border-red-100 bg-red-50/20 text-center rounded-sm">
                No active rescuers are currently available.
              </div>
            ) : (
              <select
                value={selectedRescuerId}
                onChange={(e) => setSelectedRescuerId(e.target.value)}
                className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none focus:border-red-400 text-red-900"
              >
                {availableRescuers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id}) - {r.unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-red-700 font-bold uppercase">2. Select Target Type</label>
            <div className="flex border border-red-100 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setTargetType("victim")}
                className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer ${
                  targetType === "victim" ? "bg-red-800 text-white" : "bg-red-50/30 text-red-800 hover:bg-red-50"
                }`}
              >
                Victim
              </button>
              <button
                type="button"
                onClick={() => setTargetType("alert")}
                className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer ${
                  targetType === "alert" ? "bg-red-800 text-white" : "bg-red-50/30 text-red-800 hover:bg-red-50"
                }`}
              >
                SOS Alert
              </button>
              <button
                type="button"
                onClick={() => setTargetType("respondent")}
                className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer ${
                  targetType === "respondent" ? "bg-red-800 text-white" : "bg-red-50/30 text-red-800 hover:bg-red-50"
                }`}
              >
                Respondent/Node
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-red-700 font-bold uppercase">3. Choose Target Destination</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-red-50/50 border border-red-100 rounded-sm p-2 outline-none focus:border-red-400 text-red-900"
              required
            >
              <option value="" disabled>-- Select Target --</option>
              
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

              {targetType === "respondent" && (
                <>
                  <optgroup label="Other Rescuer Units">
                    {rescuers.filter(r => r.id !== selectedRescuerId && r.isVerified).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id}) - {r.status}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Mesh Network Nodes">
                    {MESH_NODES.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.label} ({node.id}) - {node.online ? "Online" : "Offline"}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-red-100 hover:border-red-300 text-red-500 rounded-sm font-semibold transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={availableRescuers.length === 0 || !targetId}
              className="flex-1 py-2 bg-red-800 hover:bg-red-900 text-white rounded-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
            >
              DISPATCH UNIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const now = useNow();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [rescuers, setRescuers] = useState(INITIAL_RESCUERS);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");
  const [flashCount, setFlashCount] = useState(0);

  const [casualtyLogs, setCasualtyLogs] = useState([]);
  const [selectedCasualtyId, setSelectedCasualtyId] = useState(null);
  const [isFetchingCasualties, setIsFetchingCasualties] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showCallRescuerModal, setShowCallRescuerModal] = useState(false);
  const [centerView, setCenterView] = useState("map");

  const [isFetchingRescuers, setIsFetchingRescuers] = useState(false);
  const [settings, setSettings] = useState({ requireRescuerApproval: true });
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);

  const fetchSettings = async () => {
    setIsFetchingSettings(true);
    try {
      const response = await fetch("http://localhost:5000/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setIsFetchingSettings(false);
    }
  };

  const handleToggleSetting = async (key, value) => {
    setSettings((prev) => ({
      ...prev,
      requireRescuerApproval: key === "require_rescuer_approval" ? value : prev.requireRescuerApproval
    }));

    try {
      const response = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (!response.ok) {
        fetchSettings();
        alert("Failed to save setting");
      }
    } catch (err) {
      console.error("Connection error", err);
      fetchSettings();
      alert("Failed to connect to backend server");
    }
  };

  const fetchRescuers = async () => {
    setIsFetchingRescuers(true);
    try {
      const response = await fetch("http://localhost:5000/api/rescuers");
      if (response.ok) {
        const data = await response.json();
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
          coords: r.id_number === "BRGY-R01" ? [55, 60] : r.id_number === "GOV-R02" ? [25, 20] : r.id_number === "BRGY-R03" ? [80, 50] : [50, 50],
          lat: r.id_number === "BRGY-R01" ? "6.9220° N" : r.id_number === "GOV-R02" ? "6.9180° N" : "6.9260° N",
          lng: r.id_number === "BRGY-R01" ? "122.0800° E" : r.id_number === "GOV-R02" ? "122.0740° E" : "122.0850° E",
          battery: r.is_verified === 1 ? (r.id_number === "BRGY-R01" ? 95 : r.id_number === "GOV-R02" ? 78 : 90) : 0,
          lastPing: r.is_verified === 1 ? "04:48:12" : "--",
          assignedTargetType: r.assigned_target_type || null,
          assignedTargetId: r.assigned_target_id || null,
          assignedTargetName: r.assigned_target_name || null,
          assignedAlert: r.assigned_target_type === "alert" ? r.assigned_target_id : null
        }));
        setRescuers(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch rescuers", err);
    } finally {
      setIsFetchingRescuers(false);
    }
  };

  const handleVerifyRescuer = async (dbId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rescuers/verify/${dbId}`, {
        method: "POST"
      });
      if (response.ok) {
        fetchRescuers();
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to verify rescuer");
      }
    } catch (err) {
      console.error("Connection error", err);
      alert("Failed to connect to backend server");
    }
  };

  const fetchCasualtyLogs = async () => {
    setIsFetchingCasualties(true);
    try {
      const response = await fetch("http://localhost:5000/api/logs/casualties");
      if (response.ok) {
        const data = await response.json();
        setCasualtyLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch casualty logs", err);
    } finally {
      setIsFetchingCasualties(false);
    }
  };

  const handleRecordCasualty = async (logData) => {
    try {
      const response = await fetch("http://localhost:5000/api/logs/casualties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (response.ok) {
        setShowRecordModal(false);
        fetchCasualtyLogs();
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to record log");
      }
    } catch (err) {
      console.error("Connection error", err);
      alert("Failed to connect to backend server");
    }
  };

  useEffect(() => {
    fetchCasualtyLogs();
    fetchRescuers();
    fetchSettings();
    const interval = setInterval(() => {
      fetchCasualtyLogs();
      fetchRescuers();
      fetchSettings();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState("");
  const [sessionRemaining, setSessionRemaining] = useState(0);

  useEffect(() => {
    const sessionData = localStorage.getItem("zamboalert_auth");
    if (!sessionData) {
      window.location.href = "login.html";
      return;
    }
    try {
      const { token, user, expiry } = JSON.parse(sessionData);
      if (Date.now() > expiry) {
        localStorage.removeItem("zamboalert_auth");
        window.location.href = "login.html";
        return;
      }
      setIsAuthenticated(true);
      setSessionUser(user);
      setSessionRemaining(Math.round((expiry - Date.now()) / 1000));

      const timer = setInterval(() => {
        const remaining = Math.round((expiry - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timer);
          localStorage.removeItem("zamboalert_auth");
          window.location.href = "login.html";
        } else {
          setSessionRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    } catch (e) {
      localStorage.removeItem("zamboalert_auth");
      window.location.href = "login.html";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("zamboalert_auth");
    window.location.href = "login.html";
  };

  const unassigned = alerts.filter((a) => a.status === "unassigned");

  useEffect(() => {
    const t = setInterval(() => setFlashCount((c) => c + 1), 800);
    return () => clearInterval(t);
  }, []);

  const handleDispatch = async (rescuerId, targetType, targetId, targetName) => {
    try {
      const response = await fetch("http://localhost:5000/api/rescuers/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescuerId,
          targetType,
          targetId,
          targetName
        })
      });
      if (response.ok) {
        if (targetType === "alert") {
          setAlerts((prev) =>
            prev.map((a) => (a.id === targetId ? { ...a, status: "assigned", assignedTo: rescuerId } : a))
          );
        }
        fetchRescuers();
        setDispatchTarget(null);
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to dispatch rescuer");
      }
    } catch (err) {
      console.error("Failed to dispatch rescuer", err);
      alert("Failed to connect to backend server");
    }
  };

  const handleResolveRescuer = async (rescuerDbId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rescuers/resolve/${rescuerDbId}`, {
        method: "POST"
      });
      if (response.ok) {
        const r = rescuers.find(res => res.dbId === rescuerDbId);
        if (r && r.assignedTargetType === "alert") {
          setAlerts((prev) => prev.map((a) => (a.id === r.assignedTargetId ? { ...a, status: "resolved" } : a)));
        }
        fetchRescuers();
      } else {
        alert("Failed to resolve rescuer status");
      }
    } catch (err) {
      console.error("Connection error", err);
    }
  };

  const handleResolve = async (alertId) => {
    const r = rescuers.find((res) => res.assignedTargetType === "alert" && String(res.assignedTargetId) === String(alertId));
    if (r) {
      await handleResolveRescuer(r.dbId);
    } else {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a)));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 font-mono text-xs">
        <Activity className="animate-spin mb-2" size={20} />
        VERIFYING SESSION NODE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-red-900 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Distress Flash Banner ── */}
      {unassigned.length > 0 && (
        <div
          className="border-b transition-colors duration-300"
          style={{
            background: flashCount % 2 === 0 ? "#dc2626" : "#ef4444",
            borderColor: "#b91c1c",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-1.5">
            <AlertTriangle size={13} className="text-white" />
            <span className="text-[11px] font-mono text-white tracking-wider font-semibold">
              ⚡ DISTRESS SIGNAL ACTIVE — {unassigned.length} UNASSIGNED SOS{unassigned.length > 1 ? "S" : ""} REQUIRE IMMEDIATE DISPATCH
            </span>
            <span className="ml-auto text-[10px] font-mono text-red-200 animate-pulse">
              AWAITING AUTHORIZATION
            </span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex items-center gap-4 px-5 py-3 border-b border-red-100 bg-white sticky top-0 z-40 shadow-sm shadow-red-50">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="text-base font-bold tracking-tight text-red-800 leading-none">ZamboAlert</div>
            <div className="text-[9px] font-mono text-red-700 tracking-widest">BARANGAY MONITORING SYSTEM</div>
          </div>
        </div>

        <div className="h-6 w-px bg-red-100 mx-1" />

        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
          <div className="flex items-center gap-1.5">
            <PingDot active />
            <span className="text-red-800 font-semibold">GATEWAY ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className="text-red-600" />
            <span>LOCAL AP ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio size={11} className="text-red-700" />
            <span>MESH: 3 NODES</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <div
              className="text-base font-mono text-red-800 tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {fmtTime(now)}
            </div>
            <div className="text-[9px] font-mono text-slate-600">
              {now.toLocaleDateString("en-PH", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:border-red-400 text-red-800 hover:text-red-800 text-[11px] font-semibold tracking-wider rounded-sm transition-colors cursor-pointer"
          >
            <Settings size={11} />
            SETTINGS
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>

        {/* Left sidebar */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-r border-red-100 overflow-y-auto bg-white">

          {/* Stat row */}
          <div className="grid grid-cols-3 border-b border-red-100">
            {[
              { label: "ACTIVE SOS", value: alerts.filter((a) => a.status !== "resolved").length, color: "text-red-800" },
              { label: "RESCUERS", value: rescuers.length, color: "text-red-600" },
              { label: "MESH NODES", value: MESH_NODES.filter((n) => n.online).length, color: "text-red-700" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-3 border-r border-red-100 last:border-0">
                <span
                  className={`text-2xl font-bold tabular-nums ${s.color}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {s.value}
                </span>
                <span className="text-[9px] font-mono text-slate-500 tracking-wider mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-red-100">
            {[
              { key: "alerts", label: "SOS", icon: AlertTriangle },
              { key: "rescuers", label: "RESCUERS", icon: Users },
              { key: "casualties", label: "RECORDS", icon: ClipboardList },
              { key: "nodes", label: "MESH", icon: Radio },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[8px] font-mono tracking-widest border-r border-red-100 last:border-0 transition-colors ${
                  activeTab === key
                    ? "bg-red-50 text-red-800 border-b-2 border-b-red-800"
                    : "text-slate-400 hover:text-red-800 hover:bg-red-50/50"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* Casualties / Victims Tab */}
            {activeTab === "casualties" && (
              <div className="flex flex-col divide-y divide-red-50">
                <div className="p-2 bg-red-50/50 flex items-center justify-between border-b border-red-50">
                  <span className="text-[9px] font-mono text-red-700 uppercase tracking-widest">
                    LOGGED: {casualtyLogs.length} RECORD(S)
                  </span>
                  <button
                    onClick={fetchCasualtyLogs}
                    disabled={isFetchingCasualties}
                    className="text-red-700 hover:text-red-800 flex items-center gap-1 text-[9px] font-mono"
                  >
                    <RefreshCw size={9} className={isFetchingCasualties ? "animate-spin" : ""} />
                    SYNC
                  </button>
                </div>
                {casualtyLogs.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                    <ClipboardList size={28} className="text-slate-300" />
                    <span className="text-[11px] font-mono text-slate-500 leading-relaxed">
                      NO RECORDED VICTIMS<br />Rescuers' logs will appear here
                    </span>
                    <button
                      onClick={() => setShowRecordModal(true)}
                      className="mt-2 px-2.5 py-1 bg-red-800 text-white text-[10px] font-mono uppercase tracking-widest rounded shadow-sm"
                    >
                      SIMULATE LOG
                    </button>
                  </div>
                )}
                {casualtyLogs.map((c) => {
                  const isSel = selectedCasualtyId === c.id;
                  const statusBadgeClass = {
                    Injured: "bg-amber-100 text-amber-800 border-amber-300",
                    Deceased: "bg-purple-100 text-purple-800 border-purple-300",
                    Missing: "bg-red-100 text-red-800 border-red-300",
                    Rescued: "bg-green-100 text-green-800 border-green-300",
                  }[c.status] || "bg-slate-100 text-slate-800 border-slate-300";

                  return (
                    <div
                      key={`side-cas-${c.id}`}
                      onClick={() => {
                        setSelectedCasualtyId(isSel ? null : c.id);
                        setCenterView("map");
                      }}
                      className={`p-3 cursor-pointer transition-colors ${
                        isSel ? "bg-red-50" : "hover:bg-red-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-red-800">VIC-{c.id}</span>
                          <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1 py-px rounded-sm border ${statusBadgeClass}`}>
                            {c.status}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-500">
                          {new Date(c.created_at || Date.now()).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-red-900">{c.victim_name}</div>
                      <div className="text-[10px] font-mono text-slate-600">
                        {c.location || "Unknown Zone"} {c.age ? `· Age ${c.age}` : ""} {c.gender ? `· ${c.gender}` : ""}
                      </div>
                      {c.injury_details && (
                        <div className="mt-1 text-[10px] text-red-700 italic truncate">&ldquo;{c.injury_details}&rdquo;</div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span>BY {c.rescuer_id || c.rescuer_name || "Unknown"}</span>
                        {c.latitude && c.longitude && (
                          <span className="text-[8px] text-red-700 font-semibold">📍 {c.latitude}, {c.longitude}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alerts */}
            {activeTab === "alerts" && (
              <div className="flex flex-col divide-y divide-red-50">
                {alerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                    <AlertTriangle size={28} className="text-slate-300" />
                    <span className="text-[11px] font-mono text-slate-500 leading-relaxed">
                      NO ACTIVE SOS ALERTS<br />Awaiting incoming distress signals
                    </span>
                  </div>
                )}
                {alerts.map((a) => {
                  const isUnassigned = a.status === "unassigned";
                  const isSel = selectedAlert === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlert(isSel ? null : a.id)}
                      className={`p-3 cursor-pointer transition-colors ${
                        isSel ? "bg-red-50" : "hover:bg-red-50/50"
                      } ${isUnassigned && flashCount % 2 === 0 ? "bg-red-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-red-800">{a.id}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-px rounded-sm border ${
                              a.method === "GPS"
                                ? "border-red-200 text-red-600 bg-red-50"
                                : "border-red-300 text-red-800 bg-red-50"
                            }`}
                          >
                            {a.method}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">{a.time}</span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-red-900">{a.name}</div>
                      <div className="text-[10px] font-mono text-slate-600">{a.zone}</div>
                      {a.message && (
                        <div className="mt-1 text-[10px] text-slate-600 italic truncate">&ldquo;{a.message}&rdquo;</div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={a.status} />
                        {a.assignedTo && (
                          <span className="text-[9px] font-mono text-slate-600">→ {a.assignedTo}</span>
                        )}
                        <span className="ml-auto text-[9px] font-mono text-slate-500">BAT {a.battery}%</span>
                      </div>
                      {isSel && (
                        <div
                          className="mt-1.5 text-[10px] font-mono text-slate-600"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {a.lat} {a.lng}
                        </div>
                      )}
                      {isSel && a.status === "unassigned" && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDispatchTarget(a)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 bg-red-800 hover:bg-red-800 text-white text-[10px] font-semibold tracking-widest rounded-sm transition-colors"
                          >
                            <Navigation size={10} />
                            DISPATCH
                          </button>
                        </div>
                      )}
                      {isSel && a.status === "assigned" && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold tracking-widest rounded-sm transition-colors"
                          >
                            <CheckCircle size={10} />
                            MARK RESOLVED
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rescuers */}
            {activeTab === "rescuers" && (
              <div className="flex flex-col divide-y divide-red-50">
                
                {/* Pending Verification Section */}
                {rescuers.some(r => !r.isVerified) && (
                  <div className="bg-amber-50/70 p-3 pb-4 border-b border-amber-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldAlert size={14} className="text-amber-700 animate-pulse" />
                      <h4 className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">Pending Verification</h4>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {rescuers.filter(r => !r.isVerified).map(r => (
                        <div key={r.id} className="bg-white p-3 rounded border border-amber-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              {r.idType}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {r.idNumber}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs font-semibold text-slate-900">{r.name}</div>
                          <div className="text-[10px] text-slate-600 font-mono mt-0.5">{r.email}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Contact: {r.unit}</div>
                          
                          {/* Simulated ID Photo Preview */}
                          <div className="mt-2 p-1.5 bg-slate-100 rounded border border-slate-200 flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center text-[10px] font-bold text-slate-600">ID</div>
                            <div className="flex-1">
                              <div className="text-[9px] font-bold text-slate-700 font-mono">id_photo.jpg</div>
                              <div className="text-[8px] text-slate-500">Simulated Uploaded Document</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleVerifyRescuer(r.dbId)}
                            className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={10} />
                            Approve & Verify
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Rescuers Section */}
                <div className="p-3 bg-red-50/20">
                  <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">Verified Units</h4>
                  {rescuers.filter(r => r.isVerified).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <Users size={24} className="text-slate-300" />
                      <span className="text-[10px] font-mono text-slate-400">NO VERIFIED RESCUERS ONLINE</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {rescuers.filter(r => r.isVerified).map((r) => (
                        <div key={r.id} className="p-2.5 bg-white border border-red-100 rounded hover:bg-red-50/30 transition-colors shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-red-800">{r.id}</span>
                            <RescuerBadge status={r.status} />
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-red-900">{r.name}</div>
                          <div className="text-[10px] font-mono text-slate-600">Phone: {r.unit}</div>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">ID: {r.idType} ({r.idNumber})</div>
                          <div className="mt-1 text-[10px] font-mono text-slate-500">
                            {r.lat} · {r.lng}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                            <span className="flex items-center gap-1"><PingDot active /> PING {r.lastPing}</span>
                            <span>BAT {r.battery}%</span>
                          </div>
                          {(r.assignedAlert || r.assignedTargetType) && (
                            <div className="mt-1.5 pt-1.5 border-t border-red-50 flex items-center justify-between gap-1.5 text-[9px] font-mono text-red-600">
                              <span className="truncate flex-1">→ {r.assignedTargetName || r.assignedTargetId || r.assignedAlert}</span>
                              <button
                                onClick={() => handleResolveRescuer(r.dbId)}
                                className="px-2 py-0.5 bg-green-700 text-white font-bold rounded-sm uppercase tracking-wider hover:bg-green-800 transition-colors cursor-pointer"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Nodes */}
            {activeTab === "nodes" && (
              <div className="flex flex-col divide-y divide-red-50">
                {MESH_NODES.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                    <Radio size={28} className="text-slate-300" />
                    <span className="text-[11px] font-mono text-slate-500 leading-relaxed">
                      NO MESH NODES DETECTED<br />Nodes register automatically on connect
                    </span>
                  </div>
                )}
                {MESH_NODES.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-red-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-800">{n.id}</span>
                      <div className="flex items-center gap-1.5">
                        <PingDot active={n.online} />
                        <span className={`text-[9px] font-mono uppercase tracking-widest ${n.online ? "text-red-800" : "text-slate-400"}`}>
                          {n.online ? "ONLINE" : "OFFLINE"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs text-red-900">{n.label}</div>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <SignalBars bars={signalBars(n.signalDbm)} active={n.online} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{n.signalDbm} dBm</span>
                      </div>
                      <span
                        className={`px-1.5 py-px rounded-sm border text-[8px] ${
                          n.type === "gateway"
                            ? "border-red-400 text-red-800 bg-red-50"
                            : n.type === "relay"
                            ? "border-slate-200 text-slate-600 bg-red-50"
                            : "border-slate-100 text-slate-400"
                        }`}
                      >
                        {n.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-500">
                      <span>RELAY {n.relayCount} pkts</span>
                      <span>SEEN {n.lastSeen}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Map / Victims Database */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-red-100 bg-white">
            <div className="flex gap-1">
              <button
                onClick={() => setCenterView("map")}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
                  centerView === "map"
                    ? "bg-red-800 text-white font-semibold"
                    : "text-red-400 hover:text-red-800 hover:bg-red-50"
                }`}
              >
                Tactical Map
              </button>
              <button
                onClick={() => setCenterView("victims")}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 ${
                  centerView === "victims"
                    ? "bg-red-800 text-white font-semibold"
                    : "text-red-400 hover:text-red-800 hover:bg-red-50"
                }`}
              >
                <ClipboardList size={11} />
                Victims Database ({casualtyLogs.length})
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
              <span className="text-red-600 animate-pulse">●</span>
              <span>BARANGAY TUMAGA FEEDS</span>
            </div>
          </div>

          {centerView === "map" ? (
            <div className="flex-1 p-2">
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
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto bg-red-50/10 space-y-4">
              <VictimsDatabaseView
                casualtyLogs={casualtyLogs}
                fetchCasualtyLogs={fetchCasualtyLogs}
                onSimulateClick={() => setShowRecordModal(true)}
                onShowOnMap={(c) => {
                  setSelectedCasualtyId(c.id);
                  setSelectedAlert(null);
                  setCenterView("map");
                }}
                isFetching={isFetchingCasualties}
              />
            </div>
          )}
          {/* Status bar */}
          <div className="flex items-center gap-4 px-3 py-1.5 border-t border-red-100 bg-red-50/30 text-[9px] font-mono text-slate-600">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-red-600" />
              <span>SYSTEM NOMINAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Signal size={10} />
              <span>INTERNET: OFFLINE (LOCAL AP MODE)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={10} className="text-red-600" />
              <span className="text-red-600">BATTERY BACKUP ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-red-100 pl-3 text-red-800">
              <ShieldCheck size={10} />
              <span>SECURE SESSION: ACTIVE ({sessionUser})</span>
              <span className="text-slate-500">| TTL: {sessionRemaining}s</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Clock size={10} />
              <span>UPTIME 04:32:17</span>
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-l border-red-100 bg-white">
          <div className="px-3 py-2.5 border-b border-red-100 bg-red-50/50">
            <div className="text-[10px] font-mono text-red-600 uppercase tracking-widest font-semibold">
              Quick Actions
            </div>
          </div>

          <div className="p-3 flex flex-col gap-2">
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-semibold tracking-wider rounded-sm transition-colors"
            >
              <Volume2 size={12} />
              BROADCAST ALERT
            </button>
            <button
              onClick={() => {
                const first = alerts.find((a) => a.status === "unassigned");
                if (first) setDispatchTarget(first);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 border border-red-800 hover:border-red-800 bg-red-800 hover:bg-red-800 text-white text-[11px] font-semibold tracking-wider rounded-sm transition-colors"
            >
              <Navigation size={12} />
              DISPATCH NEXT SOS
            </button>
            <button
              onClick={() => {
                setCenterView("victims");
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 border border-red-100 hover:border-red-300 text-red-500 hover:text-red-800 text-[11px] font-semibold tracking-wider rounded-sm transition-colors"
            >
              <ClipboardList size={12} />
              VICTIMS DATABASE
            </button>
            <button
              onClick={() => setShowCallRescuerModal(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 border border-red-100 hover:border-red-300 text-slate-600 hover:text-red-800 text-[11px] font-semibold tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              <PhoneCall size={12} />
              CALL RESCUER
            </button>
          </div>

          <div className="border-t border-red-100 px-3 py-2.5 bg-red-50/50">
            <div className="text-[10px] font-mono text-red-600 uppercase tracking-widest font-semibold">
              Unassigned SOS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-red-50">
            {unassigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <CheckCircle size={24} className="text-green-400" />
                <span className="text-[11px] font-mono text-slate-500">All SOS assigned</span>
              </div>
            ) : (
              unassigned.map((a) => (
                <div
                  key={a.id}
                  className="p-3 transition-colors"
                  style={{ background: flashCount % 2 === 0 ? "#fff1f1" : "#ffffff" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-red-800">{a.id}</span>
                    <AlertTriangle
                      size={10}
                      className={`text-red-800 transition-opacity ${flashCount % 2 === 0 ? "opacity-100" : "opacity-30"}`}
                    />
                  </div>
                  <div className="text-xs text-red-900 font-semibold mt-0.5">{a.name}</div>
                  <div className="text-[10px] font-mono text-slate-600">{a.zone}</div>
                  <div
                    className="text-[10px] font-mono text-slate-500 mt-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {a.lat}
                  </div>
                  <button
                    onClick={() => setDispatchTarget(a)}
                    className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 bg-red-800 hover:bg-red-800 text-white text-[10px] font-bold tracking-widest rounded-sm transition-colors"
                  >
                    <ChevronRight size={10} />
                    DISPATCH
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Network summary */}
          <div className="border-t border-red-100 p-3">
            <div className="text-[9px] font-mono text-red-700 uppercase tracking-widest mb-2">Network</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-red-600">
                  <Wifi size={10} />
                  <span>Wi-Fi AP</span>
                </div>
                <span className="text-red-800 font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Bluetooth size={10} />
                  <span>BT Mesh</span>
                </div>
                <span className="text-slate-500">3 NODES</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Radio size={10} />
                  <span>Internet</span>
                </div>
                <span className="text-slate-500 line-through">BLACKOUT</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
      {dispatchTarget && (
        <DispatchModal
          alert={dispatchTarget}
          rescuers={rescuers}
          onDispatch={handleDispatch}
          onClose={() => setDispatchTarget(null)}
        />
      )}
      {showRecordModal && (
        <RecordCasualtyModal
          onClose={() => setShowRecordModal(false)}
          onRecord={handleRecordCasualty}
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
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          rescuers={rescuers}
          onToggleSetting={handleToggleSetting}
          onVerifyRescuer={handleVerifyRescuer}
          onClose={() => setShowSettingsModal(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
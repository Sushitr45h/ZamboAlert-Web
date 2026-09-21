import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Layers, MapPin, Minus, Plus, RefreshCw, Signal } from "lucide-react";
import { TUMAGA_BUILDINGS, parseCoordinate, signalBars } from "./dashboardData";

export function SignalBars({ bars, active }) {
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

export function PingDot({ active }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />}
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: active ? "#10b981" : "#94a3b8" }} />
    </span>
  );
}

export function StatusBadge({ status }) {
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

export function RescuerBadge({ status }) {
  const cfg = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    "en-route": "bg-amber-50 text-amber-700 border-amber-200/80",
    "on-scene": "bg-red-50 text-red-700 border-red-200/80",
    offline: "bg-slate-100 text-slate-500 border-slate-200",
  }[status] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`text-[10px] font-mono font-semibold tracking-wider px-2.5 py-0.5 rounded-full uppercase border ${cfg}`}>
      {status}
    </span>
  );
}

export function TacticalMap({
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

  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current || !pathsGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    pathsGroupRef.current.clearLayers();

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
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;"><strong>${b.name}</strong><br/><span style="font-size: 9px; opacity: 0.8; text-transform: uppercase;">Type: ${b.type}</span></div>`,
        {
          permanent: false,
          direction: "top",
          className: "custom-building-tooltip",
        }
      );
      buildingMarker.addTo(markersGroupRef.current);
    });

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
          html,
          className: "custom-sos-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.on("click", () => onSelect(a.id));
        marker.addTo(markersGroupRef.current);
      }
    });

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
          html,
          className: "custom-rescuer-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([lat, lng], { icon: customIcon }).addTo(markersGroupRef.current);
      }
    });

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
          html,
          className: "custom-casualty-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const popupDiv = document.createElement("div");
        popupDiv.className = "p-3 font-sans text-xs text-slate-800 max-w-[220px]";

        const assignedRescuer = rescuers.find(
          (r) => r.status === "en-route" && r.assignedTargetType === "victim" && String(r.assignedTargetId) === String(c.id)
        );

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
                ? `<div class="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-1.5 border border-emerald-200 rounded-lg text-center">Dispatched: ${assignedRescuer.name}</div>`
                : `<label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assign Rescuer Unit</label>
                   <select id="popup-select-${c.id}" class="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 outline-none">${
                     rescuers.filter((r) => r.isVerified && r.status === "available").length === 0
                       ? '<option value="">No rescuers available</option>'
                       : rescuers.filter((r) => r.isVerified && r.status === "available").map((r) => `<option value="${r.id}">${r.name}</option>`).join("")
                   }</select>
                   <button id="popup-btn-${c.id}" class="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] py-2 rounded-lg transition-colors uppercase tracking-wider cursor-pointer mt-1" ${
                     rescuers.filter((r) => r.isVerified && r.status === "available").length === 0 ? "disabled" : ""
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
                if (onDispatchToTarget) onDispatchToTarget(rescuerId, "victim", c.id, c.victim_name);
                marker.closePopup();
              }
            };
          }
        });
        marker.addTo(markersGroupRef.current);
      }
    });

    if (showDetectionWeb) {
      const bhCoords = [6.9235, 122.0780];
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

    rescuers.filter((r) => r.assignedAlert || r.assignedTargetType).forEach((r) => {
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

      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-xs font-mono text-slate-700 flex items-center gap-2">
        <MapPin size={13} className="text-red-600" />
        <span>6.9214° N, 122.0790° E · Tumaga</span>
      </div>

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

export { signalBars };

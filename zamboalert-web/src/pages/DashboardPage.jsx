import React, { useState, useEffect } from "react";
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
  Navigation,
  Zap,
  PhoneCall,
  UserCheck,
  Layers,
  Signal,
  Volume2,
  ClipboardList,
  Plus,
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";

// ── Seed data ──────────────────────────────────────────────────────────────────

const INITIAL_ALERTS = [
  {
    id: "SOS-301",
    name: "Juan dela Cruz",
    coords: [35, 45],
    lat: "6.9234° N",
    lng: "122.0765° E",
    time: "04:50",
    method: "BT-Mesh",
    status: "unassigned",
    zone: "Zone 1 - Riverbank",
    battery: 42,
    message: "Water rising rapidly, family trapped on roof!"
  },
  {
    id: "SOS-302",
    name: "Sarah Alipate",
    coords: [65, 30],
    lat: "6.9205° N",
    lng: "122.0812° E",
    time: "04:52",
    method: "GPS",
    status: "unassigned",
    zone: "Zone 3 - Lowland",
    battery: 88,
    message: "Elderly relative needs immediate medical evacuation"
  },
  {
    id: "SOS-303",
    name: "Ben Valdez",
    coords: [50, 70],
    lat: "6.9250° N",
    lng: "122.0795° E",
    time: "04:45",
    method: "BT-Mesh",
    status: "assigned",
    assignedTo: "R-01",
    zone: "Zone 4 - Chapel Area",
    battery: 15,
    message: "Tree collapsed on house, blocked exit"
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
    status: "en-route",
    assignedAlert: "SOS-303",
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
    relayCount: 342
  },
  {
    id: "RL-02",
    label: "Tumaga Bridge Relay",
    type: "relay",
    online: true,
    signalDbm: -65,
    lastSeen: "2s ago",
    relayCount: 189
  },
  {
    id: "RL-03",
    label: "Zone 4 Chapel Relay",
    type: "relay",
    online: true,
    signalDbm: -72,
    lastSeen: "5s ago",
    relayCount: 94
  },
  {
    id: "MN-04",
    label: "Riverview Subd. Node",
    type: "mesh",
    online: false,
    signalDbm: -85,
    lastSeen: "4m ago",
    relayCount: 12
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

// ── Tactical Map ───────────────────────────────────────────────────────────────

function TacticalMap({
  alerts,
  rescuers,
  casualties = [],
  selected,
  onSelect,
  selectedCasualtyId,
  onSelectCasualty,
}) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-sm" style={{ background: "#fff9f9" }}>
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dc2626" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Contour rings */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.05 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse cx="50" cy="50" rx="35" ry="25" fill="none" stroke="#dc2626" strokeWidth="0.4" />
        <ellipse cx="50" cy="50" rx="25" ry="17" fill="none" stroke="#dc2626" strokeWidth="0.4" />
        <ellipse cx="50" cy="50" rx="15" ry="10" fill="none" stroke="#dc2626" strokeWidth="0.4" />
      </svg>

      {/* Dispatch paths */}
      {rescuers
        .filter((r) => r.assignedAlert)
        .map((r) => {
          const alert = alerts.find((a) => a.id === r.assignedAlert);
          if (!alert) return null;
          return (
            <svg key={r.id} className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                x1={r.coords[0]} y1={r.coords[1]}
                x2={alert.coords[0]} y2={alert.coords[1]}
                stroke="#dc2626" strokeWidth="0.5" strokeDasharray="2 1.5" opacity="0.4"
              />
            </svg>
          );
        })}

      {/* SOS markers */}
      {alerts.map((a) => {
        const isUnassigned = a.status === "unassigned";
        const isSel = selected === a.id;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ left: `${a.coords[0]}%`, top: `${a.coords[1]}%` }}
          >
            {isUnassigned && (
              <span className="absolute w-8 h-8 rounded-full border-2 border-red-600 animate-ping opacity-50" />
            )}
            <span
              className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full border text-[8px] font-bold font-mono transition-transform ${
                isSel ? "scale-125" : "group-hover:scale-110"
              } ${
                a.status === "unassigned"
                  ? "bg-red-800 border-red-800 text-white shadow-md shadow-red-200"
                  : a.status === "assigned"
                  ? "bg-orange-500 border-orange-600 text-white"
                  : "bg-red-100 border-red-300 text-red-400"
              }`}
            >
              SOS
            </span>
            <span className="mt-0.5 text-[8px] font-mono text-red-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-red-100 px-1 py-px rounded shadow-sm">
              {a.name}
            </span>
          </button>
        );
      })}

      {/* Rescuer markers */}
      {rescuers.map((r) => (
        <div
          key={r.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
          style={{ left: `${r.coords[0]}%`, top: `${r.coords[1]}%` }}
        >
          <span
            className={`relative z-10 flex items-center justify-center w-4 h-4 rounded border text-[7px] font-bold font-mono shadow-sm ${
              r.status === "available"
                ? "bg-white border-red-400 text-red-800"
                : r.status === "en-route"
                ? "bg-red-100 border-red-600 text-red-800"
                : "bg-red-800 border-red-800 text-white"
            }`}
          >
            R
          </span>
          <span className="mt-0.5 text-[8px] font-mono text-red-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-red-100 px-1 py-px rounded shadow-sm">
            {r.id}
          </span>
        </div>
      ))}

      {/* Casualty/Victim markers on tactical map */}
      {casualties.map((c) => {
        if (!c.latitude || !c.longitude) return null;
        // Convert lat/lng to map coordinates mathematically
        const x = Math.max(10, Math.min(90, ((parseFloat(c.longitude) - 122.0700) / 0.0200) * 100));
        const y = Math.max(10, Math.min(90, ((6.9300 - parseFloat(c.latitude)) / 0.0200) * 100));

        const isSel = selectedCasualtyId === c.id;
        const statusColors = {
          Injured: "bg-amber-500 border-amber-600 text-white",
          Deceased: "bg-purple-800 border-purple-900 text-white",
          Missing: "bg-red-600 border-red-700 text-white",
          Rescued: "bg-green-600 border-green-700 text-white",
        }[c.status] || "bg-slate-500 border-slate-600 text-white";

        return (
          <button
            key={`casualty-map-${c.id}`}
            onClick={() => onSelectCasualty && onSelectCasualty(c.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-20"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {isSel && (
              <span className="absolute w-6 h-6 rounded-full border border-dashed border-red-500 animate-spin" />
            )}
            <span
              className={`relative z-10 flex items-center justify-center w-3.5 h-3.5 rounded-full border text-[8px] font-extrabold font-mono transition-transform ${
                isSel ? "scale-125" : "group-hover:scale-110"
              } ${statusColors}`}
              title={`${c.victim_name} (${c.status})`}
            >
              V
            </span>
            <span className="mt-0.5 text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-red-100 px-1 py-px rounded shadow-sm">
              {c.victim_name}
            </span>
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-[9px] font-mono" style={{ color: "#b91c1c" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-800 border border-red-800" />
          UNASSIGNED SOS
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600" />
          ASSIGNED
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white border border-red-600" />
          RESCUER
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-600 flex items-center justify-center text-[7px] text-white">V</span>
          VICTIM LOG
        </div>
      </div>

      {/* Coords */}
      <div className="absolute top-2 right-2 text-[9px] font-mono text-right" style={{ color: "#b91c1c" }}>
        <div>6.9214° N / 122.0790° E</div>
        <div>ZAMBOANGA CITY</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
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

// ── Main App ───────────────────────────────────────────────────────────────────

export default function Home() {
  const now = useNow();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [rescuers, setRescuers] = useState(INITIAL_RESCUERS);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");
  const [flashCount, setFlashCount] = useState(0);

  const [casualtyLogs, setCasualtyLogs] = useState([]);
  const [selectedCasualtyId, setSelectedCasualtyId] = useState(null);
  const [isFetchingCasualties, setIsFetchingCasualties] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [centerView, setCenterView] = useState("map");

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
    const interval = setInterval(fetchCasualtyLogs, 10000);
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

  const handleDispatch = (alertId, rescuerId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "assigned", assignedTo: rescuerId } : a))
    );
    setRescuers((prev) =>
      prev.map((r) => (r.id === rescuerId ? { ...r, status: "en-route", assignedAlert: alertId } : r))
    );
    setDispatchTarget(null);
  };

  const handleResolve = (alertId) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a)));
    setRescuers((prev) =>
      prev.map((r) => (r.assignedAlert === alertId ? { ...r, status: "available", assignedAlert: null } : r))
    );
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
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:border-red-400 text-red-800 hover:text-red-800 text-[11px] font-semibold tracking-wider rounded-sm transition-colors"
          >
            <X size={11} />
            LOGOUT
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
              { key: "casualties", label: "VICTIMS", icon: ClipboardList },
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
                {rescuers.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                    <Users size={28} className="text-slate-300" />
                    <span className="text-[11px] font-mono text-slate-500 leading-relaxed">
                      NO RESCUERS ONLINE<br />Units appear here when connected
                    </span>
                  </div>
                )}
                {rescuers.map((r) => (
                  <div key={r.id} className="p-3 hover:bg-red-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-800">{r.id}</span>
                      <RescuerBadge status={r.status} />
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-red-900">{r.name}</div>
                    <div className="text-[10px] font-mono text-slate-600">{r.unit}</div>
                    <div
                      className="mt-1 text-[10px] font-mono text-slate-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {r.lat} · {r.lng}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span className="flex items-center gap-1"><PingDot active /> PING {r.lastPing}</span>
                      <span>BAT {r.battery}%</span>
                    </div>
                    {r.assignedAlert && (
                      <div className="mt-1 text-[9px] font-mono text-red-600">→ {r.assignedAlert}</div>
                    )}
                  </div>
                ))}
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
            <button className="flex items-center gap-2 w-full px-3 py-2.5 border border-red-100 hover:border-red-300 text-slate-600 hover:text-red-800 text-[11px] font-semibold tracking-wider rounded-sm transition-colors">
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
    </div>
  );
}

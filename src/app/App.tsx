import { useState, useEffect, useRef } from "react";
import {
  Bluetooth,
  BluetoothConnected,
  MapPin,
  Navigation,
  Signal,
  Battery,
  AlertTriangle,
  ChevronRight,
  Radio,
  Activity,
  Layers,
  Crosshair,
  HeartPulse,
  Settings,
  ArrowUp,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ── Mock Data ───────────────────────────────────────────────────────────────

const VICTIMS = [
  { id: "V-001", label: "VICTIM-01", distance: 14.2, bearing: 342, floor: -1, signalStrength: 87, status: "responsive", heartRate: 104, temp: 36.1, lastPing: "0:03 ago" },
  { id: "V-002", label: "VICTIM-02", distance: 31.7, bearing: 58,  floor: -1, signalStrength: 61, status: "critical",   heartRate: 140, temp: 38.9, lastPing: "0:11 ago" },
  { id: "V-003", label: "VICTIM-03", distance: 52.4, bearing: 195, floor: 0,  signalStrength: 44, status: "unknown",    heartRate: null, temp: null, lastPing: "1:42 ago" },
];

const VICTIM_COORDS: Record<string, { x: number; y: number }> = {
  "V-001": { x: 30, y: 25 },
  "V-002": { x: 68, y: 20 },
  "V-003": { x: 60, y: 72 },
};

const MESH_NODES = [
  { id: "N-01", name: "POD-ALPHA",   role: "anchor",  battery: 91, signal: 98, status: "connected", location: "Entry Point A",     hops: 0 },
  { id: "N-02", name: "POD-BRAVO",   role: "relay",   battery: 74, signal: 82, status: "connected", location: "Corridor B, Lvl 1", hops: 1 },
  { id: "N-03", name: "POD-CHARLIE", role: "relay",   battery: 58, signal: 67, status: "connected", location: "Stairwell C",        hops: 2 },
  { id: "N-04", name: "POD-DELTA",   role: "tracker", battery: 33, signal: 49, status: "syncing",   location: "Sub-Level -1",       hops: 3 },
  { id: "N-05", name: "POD-ECHO",    role: "tracker", battery: 12, signal: 24, status: "offline",   location: "Zone D (last)",      hops: 3 },
];

const LOG = [
  { id: "l1", time: "07:34:22", type: "victim",  message: "VICTIM-01 proximity alert — 14.2 m. Bearing 342°. Sub-level -1." },
  { id: "l2", time: "07:33:55", type: "alert",   message: "VICTIM-02 heart rate elevated: 140 bpm. Temp 38.9°C. Critical." },
  { id: "l3", time: "07:32:10", type: "mesh",    message: "POD-CHARLIE relayed packet from POD-DELTA. 3-hop route active." },
  { id: "l4", time: "07:31:44", type: "ble",     message: "BLE sync complete. Portable Tracker Pod v2.4.1 firmware confirmed." },
  { id: "l5", time: "07:30:08", type: "victim",  message: "VICTIM-03 ping timeout exceeded 90s. Status unknown. Last: Lvl 0." },
  { id: "l6", time: "07:28:33", type: "mesh",    message: "POD-ECHO signal lost. Attempting relay reroute via POD-DELTA." },
  { id: "l7", time: "07:27:19", type: "system",  message: "Offline map tile cache loaded. Coverage: 2.1 km² / Zone 4–7." },
  { id: "l8", time: "07:25:00", type: "ble",     message: "Portable Tracker Pod BLE handshake established. RSSI -42 dBm." },
];

// ── Config maps ────────────────────────────────────────────────────────────

const statusColors = {
  critical:   { text: "text-white",  bg: "bg-red-600",  dot: "bg-red-500" },
  responsive: { text: "text-white",  bg: "bg-black",    dot: "bg-green-500" },
  unknown:    { text: "text-black",  bg: "bg-gray-200", dot: "bg-gray-400" },
};

const podStatusColors = {
  connected: { dot: "bg-green-500" },
  syncing:   { dot: "bg-yellow-400" },
  offline:   { dot: "bg-gray-300" },
};

const logTypeColors = {
  ble:    { label: "BLE",    color: "text-blue-600" },
  mesh:   { label: "MESH",   color: "text-purple-600" },
  victim: { label: "VICTIM", color: "text-red-600" },
  alert:  { label: "ALERT",  color: "text-red-700" },
  system: { label: "SYS",    color: "text-gray-500" },
};

const roleColors = {
  anchor:  "bg-black text-white",
  relay:   "bg-red-600 text-white",
  tracker: "bg-gray-100 text-gray-700",
};

// ── Hooks ──────────────────────────────────────────────────────────────────

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useAnimatedValue(target, speed = 0.08) {
  const [val, setVal] = useState(target);
  const ref = useRef(val);
  useEffect(() => {
    ref.current = val;
    const tick = () => {
      const diff = target - ref.current;
      if (Math.abs(diff) < 0.1) { setVal(target); return; }
      ref.current += diff * speed;
      setVal(ref.current);
      requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Mono({ children, className = "" }) {
  return <span className={`font-mono ${className}`}>{children}</span>;
}

function PulsingDot({ color }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

// ── Radar View ─────────────────────────────────────────────────────────────

function RadarView({ victims, selected, onSelect }) {
  const target = victims.find((v) => v.id === selected) ?? victims[0];
  const bearing = useAnimatedValue(target.bearing);
  const arrowAngle = bearing - 180;
  const compassLabels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-mono font-semibold tracking-widest text-gray-400 uppercase">Bearing to Target</p>
            <p className="text-lg font-bold text-black">{target.label}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold ${statusColors[target.status].bg} ${statusColors[target.status].text}`}>
            {target.status.toUpperCase()}
          </div>
        </div>

        <div className="relative flex items-center justify-center my-2">
          <div className="relative w-52 h-52">
            <div className="absolute inset-0 rounded-full border-2 border-black/10" />
            <div className="absolute inset-4 rounded-full border border-black/6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-md" />
            </div>

            {compassLabels.map((label, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const r = 88;
              const x = 104 + r * Math.sin(angle);
              const y = 104 - r * Math.cos(angle);
              return (
                <span
                  key={label}
                  className={`absolute text-[10px] font-mono font-bold -translate-x-1/2 -translate-y-1/2 ${label === "N" ? "text-red-600" : "text-black/30"}`}
                  style={{ left: x, top: y }}
                >
                  {label}
                </span>
              );
            })}

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `rotate(${arrowAngle}deg)` }}
            >
              <div className="relative flex flex-col items-center" style={{ height: 80 }}>
                <ArrowUp size={36} className="text-red-600 drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>

            {victims.map((v) => {
              const a = ((v.bearing - 180) * Math.PI) / 180;
              const maxDist = Math.max(...victims.map((x) => x.distance));
              const ratio = Math.min(v.distance / maxDist, 1) * 56;
              const bx = 104 + ratio * Math.sin(a);
              const by = 104 - ratio * Math.cos(a);
              const isSelected = v.id === selected;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(v.id)}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
                    v.status === "critical" ? "bg-red-500 border-red-600" :
                    v.status === "responsive" ? "bg-black border-black" : "bg-gray-400 border-gray-500"
                  } ${isSelected ? "scale-150 shadow-lg" : ""}`}
                  style={{ left: bx, top: by }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-8 mt-3">
          <div className="text-center">
            <Mono className="text-3xl font-bold text-black">{Math.round(bearing)}°</Mono>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">BEARING</p>
          </div>
          <div className="w-px bg-black/10" />
          <div className="text-center">
            <Mono className="text-3xl font-bold text-red-600">{target.distance.toFixed(1)}<span className="text-lg">m</span></Mono>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">DISTANCE</p>
          </div>
          <div className="w-px bg-black/10" />
          <div className="text-center">
            <Mono className="text-3xl font-bold text-black">{target.floor > 0 ? `+${target.floor}` : target.floor}</Mono>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">FLOOR</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {victims.map((v) => {
          const isSelected = v.id === selected;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`w-full text-left bg-white rounded-xl border transition-all ${
                isSelected ? "border-red-600 shadow-md shadow-red-100" : "border-black/8"
              } p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PulsingDot color={statusColors[v.status].dot} />
                  <div>
                    <Mono className="text-[12px] font-bold text-black">{v.label}</Mono>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mono className="text-[11px] text-gray-400">{v.distance.toFixed(1)} m</Mono>
                      <span className="text-gray-200">·</span>
                      <Mono className="text-[11px] text-gray-400">{v.bearing}°</Mono>
                      <span className="text-gray-200">·</span>
                      <Mono className="text-[11px] text-gray-400">Floor {v.floor}</Mono>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {v.heartRate && (
                    <div className="flex items-center gap-1">
                      <HeartPulse size={12} className={v.status === "critical" ? "text-red-600" : "text-black"} />
                      <Mono className="text-[11px] text-black">{v.heartRate}</Mono>
                    </div>
                  )}
                  <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${statusColors[v.status].bg} ${statusColors[v.status].text}`}>
                    {v.status.toUpperCase()}
                  </div>
                </div>
              </div>
              {v.heartRate && isSelected && (
                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-black/6">
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Heart Rate</p>
                    <Mono className={`text-[14px] font-bold ${v.status === "critical" ? "text-red-600" : "text-black"}`}>
                      {v.heartRate} <span className="text-[10px] font-normal text-gray-400">bpm</span>
                    </Mono>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Temp</p>
                    <Mono className="text-[14px] font-bold text-black">{v.temp}° <span className="text-[10px] font-normal text-gray-400">C</span></Mono>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">RSSI</p>
                    <Mono className="text-[14px] font-bold text-black">-{100 - v.signalStrength} <span className="text-[10px] font-normal text-gray-400">dBm</span></Mono>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Map View ───────────────────────────────────────────────────────────────

function MapView({
  victims,
  selectedVictim,
  onSelectVictim,
  selectedFloor,
  setSelectedFloor,
  userPos,
  setUserPos,
  isNavigating,
  setIsNavigating,
}) {
  const gridCells = 12;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isNavigating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Clamp coordinates to keep user inside the layout boundary (x: 12%-88%, y: 10%-90%)
    const clampedX = Math.max(12, Math.min(88, x));
    const clampedY = Math.max(10, Math.min(90, y));
    setUserPos({ x: clampedX, y: clampedY });
  };

  const selectedV = victims.find((v) => v.id === selectedVictim);
  const targetCoords = selectedV ? VICTIM_COORDS[selectedV.id] : null;

  return (
    <div className="flex flex-col gap-4">
      <style>{`
        @keyframes route-crawl {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-route-path {
          animation: route-crawl 1s linear infinite;
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-black" />
            <span className="text-[12px] font-semibold text-black">Offline Map — Zone 4–7</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <Mono className="text-[10px] text-gray-500">CACHED</Mono>
          </div>
        </div>

        <div
          onClick={handleMapClick}
          className={`relative bg-gray-50 overflow-hidden select-none ${
            isNavigating ? "cursor-not-allowed" : "cursor-crosshair hover:bg-gray-100/50 transition-colors"
          }`}
          style={{ height: 280 }}
        >
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: gridCells }).map((_, i) => (
              <g key={i}>
                <line x1={`${(i / gridCells) * 100}%`} y1="0" x2={`${(i / gridCells) * 100}%`} y2="100%" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                <line x1="0" y1={`${(i / gridCells) * 100}%`} x2="100%" y2={`${(i / gridCells) * 100}%`} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              </g>
            ))}
            <rect x="12%" y="10%" width="76%" height="80%" rx="4" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
            <rect x="12%" y="10%" width="35%" height="38%" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
            <rect x="53%" y="10%" width="35%" height="38%" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
            <rect x="12%" y="52%" width="76%" height="38%" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
            <line x1="47%" y1="10%" x2="47%" y2="90%" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
            <line x1="12%" y1="48%" x2="88%" y2="48%" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />

            {/* Navigation path line */}
            {targetCoords && selectedV && selectedV.floor === (selectedFloor === "G" ? 0 : Number(selectedFloor)) && (
              <line
                x1={`${userPos.x}%`}
                y1={`${userPos.y}%`}
                x2={`${targetCoords.x}%`}
                y2={`${targetCoords.y}%`}
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="animate-route-path"
              />
            )}
          </svg>

          {/* User Icon */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out z-20"
            style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-7 h-7 rounded-full bg-red-600/20 animate-ping" />
              <div className="absolute w-5 h-5 rounded-full bg-red-600/40 animate-pulse" />
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-md flex items-center justify-center">
                <Navigation size={8} className="text-white fill-white rotate-45 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Victim Icons */}
          {victims.map((v, i) => {
            const coords = VICTIM_COORDS[v.id] || { x: 50, y: 50 };
            const isSelected = selectedVictim === v.id;

            // Only show victims on the selected floor
            const victimFloorStr = v.floor === 0 ? "G" : String(v.floor);
            if (victimFloorStr !== selectedFloor) return null;

            const dotColor = v.status === "critical" ? "#dc2626" : v.status === "responsive" ? "#0a0a0a" : "#9ca3af";
            const ringColor = v.status === "critical" ? "ring-red-500" : "ring-black";

            return (
              <button
                key={v.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVictim(v.id);
                }}
                className={`absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group transition-transform duration-200 cursor-pointer ${
                  isSelected ? "scale-125 z-10" : "hover:scale-110 z-0"
                }`}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                {/* Tooltip */}
                <div className="bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 pointer-events-none whitespace-nowrap z-35">
                  {v.label} ({v.distance.toFixed(1)}m)
                </div>

                <div
                  className={`w-5.5 h-5.5 rounded-full border-2 border-white flex items-center justify-center shadow-md text-[9px] text-white font-bold font-mono transition-all ${
                    isSelected ? `ring-2 ${ringColor} ring-offset-1` : ""
                  }`}
                  style={{ background: dotColor }}
                >
                  {i + 1}
                </div>
                <div className="w-px h-2" style={{ background: dotColor }} />
              </button>
            );
          })}

          <div className="absolute bottom-3 right-4 flex flex-col items-end gap-1 pointer-events-none">
            <div className="h-0.5 w-12 bg-black/40" />
            <Mono className="text-[9px] text-black/40">20 m</Mono>
          </div>
          <div className="absolute top-3 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center border border-black/10 shadow-sm pointer-events-none">
            <Mono className="text-[10px] font-bold text-red-600">N</Mono>
          </div>
        </div>

        <div className="px-4 py-2.5 flex items-center gap-4 border-t border-black/6 bg-white">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <Mono className="text-[10px] text-gray-500">You</Mono>
          </div>
          {["Critical", "Responsive", "Unknown"].map((s, i) => {
            const c = i === 0 ? "bg-red-600" : i === 1 ? "bg-black" : "bg-gray-400";
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                <Mono className="text-[10px] text-gray-500">{s}</Mono>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation action overlay */}
      {selectedV && (
        <div className="bg-white rounded-2xl border border-black/8 p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selectedV.status === "critical" ? "bg-red-500 animate-ping" : "bg-black"}`} />
                <span className="text-[13px] font-bold text-black">{selectedV.label}</span>
                <span className="text-[10px] text-gray-400 font-mono">Floor {selectedV.floor === 0 ? "G" : selectedV.floor}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                Status: <span className={selectedV.status === "critical" ? "text-red-600 font-semibold" : "text-black"}>{selectedV.status.toUpperCase()}</span>
              </p>
            </div>
            <div className="text-right">
              <Mono className="text-[14px] font-bold text-red-600 block">{selectedV.distance.toFixed(1)}m</Mono>
              <Mono className="text-[10px] text-gray-400 font-mono">{selectedV.bearing}° Bearing</Mono>
            </div>
          </div>

          <div className="flex gap-2">
            {selectedV.floor === (selectedFloor === "G" ? 0 : Number(selectedFloor)) ? (
              <button
                onClick={() => setIsNavigating(!isNavigating)}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isNavigating
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-200 hover:bg-amber-600 animate-pulse"
                    : "bg-red-600 text-white shadow-sm shadow-red-200 hover:bg-red-700"
                }`}
              >
                <Navigation size={13} className={isNavigating ? "animate-spin" : ""} />
                {isNavigating ? "Stop Navigation" : "Auto Navigate"}
              </button>
            ) : (
              <button
                onClick={() => setSelectedFloor(selectedV.floor === 0 ? "G" : String(selectedV.floor))}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers size={13} />
                Switch to Floor {selectedV.floor === 0 ? "G" : selectedV.floor}
              </button>
            )}

            <button
              onClick={() => {
                setUserPos({ x: 47, y: 48 });
                setIsNavigating(false);
                toast.info("Rescuer position reset to starting point.");
              }}
              className="px-3 py-2.5 rounded-xl border border-black/8 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
              title="Reset Position"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Floor selector */}
      <div className="bg-white rounded-2xl border border-black/8 p-4">
        <p className="text-[10px] font-mono tracking-widest text-gray-400 mb-3">FLOOR LEVEL</p>
        <div className="flex gap-2">
          {["-2", "-1", "G", "+1", "+2"].map((f) => (
            <button
              key={f}
              onClick={() => {
                if (isNavigating) return;
                setSelectedFloor(f);
              }}
              className={`flex-1 py-2 rounded-lg text-[12px] font-mono font-bold transition-all cursor-pointer ${
                f === selectedFloor
                  ? "bg-red-600 text-white shadow-sm shadow-red-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              } ${isNavigating ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isNavigating}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Pods View ──────────────────────────────────────────────────────────────

function PodsView({ nodes }) {
  const connected = nodes.filter((n) => n.status === "connected").length;
  const syncing   = nodes.filter((n) => n.status === "syncing").length;
  const offline   = nodes.filter((n) => n.status === "offline").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ONLINE",  value: connected, color: "text-black" },
          { label: "SYNCING", value: syncing,   color: "text-red-600" },
          { label: "OFFLINE", value: offline,   color: "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-black/8 p-3 text-center">
            <Mono className={`text-2xl font-bold block ${color}`}>{value}</Mono>
            <Mono className="text-[9px] tracking-widest text-gray-400">{label}</Mono>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {nodes.map((node) => {
          const s = podStatusColors[node.status];
          const batteryBar  = node.battery < 20 ? "bg-red-500"   : node.battery < 50 ? "bg-yellow-400" : "bg-green-500";
          const batteryText = node.battery < 20 ? "text-red-600" : node.battery < 50 ? "text-yellow-600" : "text-black";
          const signalBar   = node.signal  > 70 ? "bg-black"     : node.signal  > 40 ? "bg-yellow-400" : "bg-red-500";

          return (
            <div key={node.id} className={`bg-white rounded-xl border p-4 ${node.status === "offline" ? "border-black/6 opacity-60" : "border-black/8"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <PulsingDot color={s.dot} />
                  <div>
                    <Mono className="text-[13px] font-bold text-black">{node.name}</Mono>
                    <Mono className="text-[10px] text-gray-400">{node.location}</Mono>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${roleColors[node.role]}`}>
                  {node.role.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Battery</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${batteryBar}`} style={{ width: `${node.battery}%` }} />
                  </div>
                  <Mono className={`text-[11px] font-semibold mt-1 ${batteryText}`}>{node.battery}%</Mono>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Signal</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${signalBar}`} style={{ width: `${node.signal}%` }} />
                  </div>
                  <Mono className="text-[11px] font-semibold mt-1 text-black">{node.signal}%</Mono>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Hops</p>
                  <Mono className="text-[18px] font-bold text-black">{node.hops}</Mono>
                </div>
              </div>

              {node.battery < 20 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="text-red-600 flex-shrink-0" />
                  <Mono className="text-[11px] text-red-600">Critical battery — replace pod soon</Mono>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Log View ───────────────────────────────────────────────────────────────

function LogView({ log }) {
  return (
    <div className="flex flex-col gap-2">
      {log.map((entry) => {
        const t = logTypeColors[entry.type];
        return (
          <div key={entry.id} className="bg-white rounded-xl border border-black/8 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-mono font-bold ${t.color}`}>{t.label}</span>
              <Mono className="text-[10px] text-gray-400">{entry.time}</Mono>
            </div>
            <p className="text-[12px] text-black/80 leading-relaxed">{entry.message}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const clock = useClock();
  const [tab, setTab] = useState("radar");
  const [selectedFloor, setSelectedFloor] = useState("-1");
  const [userPos, setUserPos] = useState({ x: 47, y: 48 });
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedVictim, setSelectedVictim] = useState(VICTIMS[0].id);
  const bleConnected = true;

  const liveVictims = VICTIMS.map((v) => {
    const coords = VICTIM_COORDS[v.id];
    if (!coords) return v;
    const dx = coords.x - userPos.x;
    const dy = coords.y - userPos.y;
    // Scale: 1% coordinate distance = 0.8 meters
    const dist = Math.sqrt(dx * dx + dy * dy) * 0.8;

    // Bearing (0 at North, clockwise)
    let bearing = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (bearing < 0) bearing += 360;

    return {
      ...v,
      distance: dist,
      bearing: Math.round(bearing),
    };
  });

  // Sync selection across screens and change the active floor automatically
  const handleSelectVictim = (id: string) => {
    setSelectedVictim(id);
    const victim = liveVictims.find((v) => v.id === id);
    if (victim) {
      const flStr = victim.floor === 0 ? "G" : String(victim.floor);
      setSelectedFloor(flStr);
    }
  };

  // Simulate auto-navigation towards target
  useEffect(() => {
    if (!isNavigating) return;

    const targetV = liveVictims.find((v) => v.id === selectedVictim);
    if (!targetV) {
      setIsNavigating(false);
      return;
    }

    const targetCoords = VICTIM_COORDS[targetV.id];
    if (!targetCoords) {
      setIsNavigating(false);
      return;
    }

    const interval = setInterval(() => {
      setUserPos((prev) => {
        const dx = targetCoords.x - prev.x;
        const dy = targetCoords.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If we are close enough, stop navigation
        if (dist < 1.5) {
          clearInterval(interval);
          setIsNavigating(false);
          toast.success(`${targetV.label} reached!`, {
            description: `Successfully navigated to the victim on Floor ${
              targetV.floor === 0 ? "G" : targetV.floor
            }.`,
            duration: 4000,
          });
          return targetCoords;
        }

        // Move 2.5% of coordinates per step
        const step = 2.5;
        const ratio = step / dist;
        return {
          x: prev.x + dx * Math.min(ratio, 1),
          y: prev.y + dy * Math.min(ratio, 1),
        };
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isNavigating, selectedVictim]);

  const timeStr = clock.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

  const tabs = [
    { id: "radar", icon: Crosshair, label: "Radar" },
    { id: "map",   icon: MapPin,    label: "Map" },
    { id: "pods",  icon: Radio,     label: "Pods" },
    { id: "log",   icon: Activity,  label: "Log" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-sm bg-background flex flex-col overflow-hidden" style={{ minHeight: "100dvh", maxHeight: 900 }}>

        {/* Status bar */}
        <div className="bg-white px-5 pt-3 pb-2 flex items-center justify-between border-b border-black/6">
          <Mono className="text-[12px] font-bold text-black">{timeStr}</Mono>
          <div className="flex items-center gap-3">
            {bleConnected ? (
              <div className="flex items-center gap-1">
                <BluetoothConnected size={13} className="text-blue-600" />
                <Mono className="text-[10px] text-blue-600 font-semibold">POD v2.4</Mono>
              </div>
            ) : (
              <Bluetooth size={13} className="text-gray-400" />
            )}
            <Signal size={13} className="text-black" />
            <Battery size={13} className="text-black" />
          </div>
        </div>

        {/* App header */}
        <div className="bg-white px-5 py-3 border-b border-black/6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center">
                  <Navigation size={11} className="text-white" />
                </div>
                <span className="text-[15px] font-bold text-black tracking-tight">ZamboAlert</span>
                <span className="text-[9px] font-mono bg-red-600 text-white px-1.5 py-0.5 rounded font-bold tracking-wider">rescuers</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <PulsingDot color="bg-red-500" />
                <Mono className="text-[10px] text-gray-400">
                  {liveVictims.filter((v) => v.status !== "unknown").length} tracked · {MESH_NODES.filter((n) => n.status === "connected").length} pods live
                </Mono>
              </div>
            </div>
            <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              <Settings size={16} className="text-black" />
            </button>
          </div>
        </div>

        {/* Critical alert banner */}
        {liveVictims.some((v) => v.status === "critical") && (
          <div className="bg-red-600 px-5 py-2.5 flex items-center gap-3">
            <AlertTriangle size={14} className="text-white flex-shrink-0" />
            <Mono className="text-[11px] text-white font-semibold">
              {(() => {
                const crit = liveVictims.find((v) => v.status === "critical");
                return crit ? `${crit.label} CRITICAL — ${crit.distance.toFixed(1)} m at ${crit.bearing}°` : "";
              })()}
            </Mono>
            <ChevronRight size={14} className="text-white/60 ml-auto flex-shrink-0" />
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
          {tab === "radar" && <RadarView victims={liveVictims} selected={selectedVictim} onSelect={handleSelectVictim} />}
          {tab === "map"   && (
            <MapView
              victims={liveVictims}
              selectedVictim={selectedVictim}
              onSelectVictim={handleSelectVictim}
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
              userPos={userPos}
              setUserPos={setUserPos}
              isNavigating={isNavigating}
              setIsNavigating={setIsNavigating}
            />
          )}
          {tab === "pods"  && <PodsView nodes={MESH_NODES} />}
          {tab === "log"   && <LogView log={LOG} />}
        </div>

        {/* Bottom nav */}
        <div className="bg-white border-t border-black/8 px-2 pt-2 pb-4 flex">
          {tabs.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  active ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <Icon size={20} className={active ? "text-red-600" : "text-gray-400"} strokeWidth={active ? 2.5 : 1.5} />
                <Mono className={`text-[10px] font-semibold ${active ? "text-red-600" : "text-gray-400"}`}>{label}</Mono>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

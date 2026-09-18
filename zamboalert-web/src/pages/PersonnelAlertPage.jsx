import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Users,
  RefreshCw,
  Play,
  Download,
  Send,
  ArrowRightLeft,
  Building,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Edit3,
  CheckCircle,
  Phone,
  MapPin,
  BarChart2,
  Activity,
  Truck,
  Radio,
  Anchor,
  Heart,
  Package,
  FileText,
  Eye,
  Info
} from "lucide-react";

const API = "http://localhost:5000";

// ── Helpers ──────────────────────────────────────────────────────────────────

function alertLevelStyle(level = "") {
  if (level.includes("CRITICAL")) return { badge: "bg-red-600 text-white border-red-700", row: "border-l-4 border-red-500", icon: "text-red-600", glow: "bg-red-50" };
  if (level.includes("SEVERE"))   return { badge: "bg-orange-500 text-white border-orange-600", row: "border-l-4 border-orange-400", icon: "text-orange-500", glow: "bg-orange-50" };
  if (level.includes("MODERATE")) return { badge: "bg-amber-500 text-white border-amber-600", row: "border-l-4 border-amber-400", icon: "text-amber-600", glow: "bg-amber-50" };
  return { badge: "bg-emerald-600 text-white border-emerald-700", row: "border-l-4 border-emerald-400", icon: "text-emerald-600", glow: "bg-emerald-50" };
}

function riskStyle(level = "") {
  if (level === "Extreme") return "bg-red-50 text-red-700 border-red-200";
  if (level === "High")    return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function DeficitBar({ deficit, required }) {
  const pct = required > 0 ? Math.min(100, Math.round((deficit / required) * 100)) : 0;
  const color = pct >= 50 ? "bg-red-500" : pct >= 30 ? "bg-orange-400" : pct >= 15 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ label, value, sub, color = "slate", icon: Icon }) {
  const colors = {
    red: "bg-red-50 border-red-200 text-red-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    sky: "bg-sky-50 border-sky-200 text-sky-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <div className={`${colors[color]} border p-4 rounded-xl flex items-start gap-3`}>
      {Icon && <Icon size={20} className="mt-0.5 flex-shrink-0" />}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
        <div className="text-2xl font-black font-mono mt-0.5">{value}</div>
        {sub && <div className="text-[10px] font-medium mt-0.5 opacity-60">{sub}</div>}
      </div>
    </div>
  );
}



// ── Modal: Trigger Alert ─────────────────────────────────────────────────────

function TriggerAlertModal({ barangay, onClose, onTriggered }) {
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const defaultMsg = "ALL OFF-DUTY TANODS, SAR OPERATIVES, AND MEDICAL RESERVISTS REPORT TO BARANGAY COMMAND HQ IMMEDIATELY.";

  const handleTrigger = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/manpower/trigger-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barangay_name: barangay, custom_message: customMessage || defaultMsg, priority: "CRITICAL_DEFICIT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Alert trigger failed");
      setSuccess(true);
      onTriggered?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Radio size={15} className="text-red-600" />
              Emergency Red Alert Broadcast
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Brgy. {barangay} — LoRa + SMS mobilization signal</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Radio size={28} className="text-red-600 animate-pulse" />
              </div>
              <div className="font-bold text-slate-900">Alert Broadcasted!</div>
              <p className="text-xs text-slate-500">Emergency mobilization signal transmitted to Barangay {barangay}.</p>
              <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                This will escalate the alert level to CRITICAL RED and trigger mobilization for all off-duty personnel in Barangay {barangay}.
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Custom Broadcast Message <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={defaultMsg}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

              <div className="flex gap-2">
                <button
                  onClick={handleTrigger}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {loading ? "Broadcasting..." : "Trigger Alert"}
                </button>
                <button onClick={onClose} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: Mutual Aid Transfer ───────────────────────────────────────────────

function MutualAidModal({ barangays, defaultTo = "", onClose, onTransferred }) {
  const [fromBarangay, setFromBarangay] = useState("");
  const [toBarangay, setToBarangay] = useState(defaultTo);
  const [disasterType, setDisasterType] = useState("Flash Flood");
  const [sarCount, setSarCount] = useState(0);
  const [tanodCount, setTanodCount] = useState(0);
  const [medicCount, setMedicCount] = useState(0);
  const [logisticsCount, setLogisticsCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const total = sarCount + tanodCount + medicCount + logisticsCount;
  const barangayNames = barangays.map((b) => b.name);

  const handleSubmit = async () => {
    if (!fromBarangay || !toBarangay) { setError("Source and destination barangay are required."); return; }
    if (fromBarangay === toBarangay) { setError("Source and destination cannot be the same barangay."); return; }
    if (total <= 0) { setError("At least 1 personnel must be selected."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/manpower/mutual-aid-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_barangay: fromBarangay,
          to_barangay: toBarangay,
          disaster_type: disasterType,
          sar_count: sarCount,
          tanod_count: tanodCount,
          medic_count: medicCount,
          logistics_count: logisticsCount,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Transfer failed");
      setSuccess(data);
      onTransferred?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const NumInput = ({ label, icon: Icon, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
        <Icon size={12} /> {label}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center cursor-pointer">−</button>
        <span className="w-10 text-center font-black font-mono text-slate-900 text-sm">{value}</span>
        <button onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center cursor-pointer">+</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft size={15} className="text-sky-600" />
              Mutual Aid Transfer
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Deploy personnel from surplus to deficit barangay</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center mx-auto">
              <ArrowRightLeft size={26} className="text-sky-600" />
            </div>
            <div className="font-bold text-slate-900">Transfer Dispatched!</div>
            <p className="text-xs text-slate-500">{success.message}</p>
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer">Close</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">From (Surplus)</label>
                <select value={fromBarangay} onChange={(e) => setFromBarangay(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="">Select Barangay...</option>
                  {barangayNames.filter(n => n !== toBarangay).map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">To (Deficit)</label>
                <select value={toBarangay} onChange={(e) => setToBarangay(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="">Select Barangay...</option>
                  {barangayNames.filter(n => n !== fromBarangay).map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Disaster Type</label>
              <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300">
                {["Flash Flood","Super Typhoon","Earthquake","Storm Surge","Landslide"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">Personnel Breakdown</div>
              <div className="grid grid-cols-2 gap-4">
                <NumInput label="SAR Operatives" icon={Shield} value={sarCount} onChange={setSarCount} />
                <NumInput label="Barangay Tanods" icon={Users} value={tanodCount} onChange={setTanodCount} />
                <NumInput label="Medic Personnel" icon={Heart} value={medicCount} onChange={setMedicCount} />
                <NumInput label="Logistics Team" icon={Package} value={logisticsCount} onChange={setLogisticsCount} />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase">Total Personnel</span>
                <span className="text-2xl font-black font-mono text-slate-900">{total}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Notes <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Deployment notes, special instructions..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? "Dispatching..." : "Deploy Transfer"}
              </button>
              <button onClick={onClose} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal: Agency Escalation ─────────────────────────────────────────────────

function EscalateAgencyModal({ barangays, defaultTargets = [], onClose, onEscalated }) {
  const [selectedBarangays, setSelectedBarangays] = useState(defaultTargets);
  const [disasterType, setDisasterType] = useState("Flash Flood");
  const [scenarioLevel, setScenarioLevel] = useState("Level 4 - Worst-Case Catastrophe");
  const [requestedAgency, setRequestedAgency] = useState("Philippine Coast Guard (PCG)");
  const [requestedUnits, setRequestedUnits] = useState("");
  const [totalReinforcements, setTotalReinforcements] = useState(10);
  const [priority, setPriority] = useState("Critical Priority");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const agencies = [
    "Philippine Coast Guard (PCG)",
    "AFP Joint Task Force Zamboanga",
    "Bureau of Fire Protection (BFP)",
    "Philippine Red Cross",
    "ZCDRRMO Central Command",
    "Department of Social Welfare (DSWD)",
    "National Disaster Risk Reduction (NDRRMC)",
  ];

  const toggleBarangay = (name) => {
    setSelectedBarangays(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);
  };

  const handleSubmit = async () => {
    if (!selectedBarangays.length) { setError("Select at least one target barangay."); return; }
    if (!requestedAgency || !requestedUnits) { setError("Agency and requested units are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/manpower/escalate-agency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_barangays: selectedBarangays,
          disaster_type: disasterType,
          scenario_level: scenarioLevel,
          requested_agency: requestedAgency,
          requested_units: requestedUnits,
          total_reinforcements: totalReinforcements,
          priority,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Escalation failed");
      setSuccess(data);
      onEscalated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert size={15} className="text-purple-600" />
              External Agency Escalation
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Request reinforcements from PCG, AFP, BFP, Red Cross or ZCDRRMO</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={26} className="text-purple-600" />
            </div>
            <div className="font-bold text-slate-900">Escalation Transmitted!</div>
            <p className="text-xs text-slate-500">{success.message}</p>
            <div className="inline-block bg-purple-50 border border-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-mono font-bold">
              Ref: {success.reference_no}
            </div>
            <br />
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer">Close</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Barangay selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Target Barangays <span className="text-slate-400 normal-case font-normal">(select all affected)</span></label>
              <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                {barangays.map((b) => (
                  <button key={b.name}
                    onClick={() => toggleBarangay(b.name)}
                    className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border transition-all cursor-pointer text-left ${
                      selectedBarangays.includes(b.name)
                        ? "bg-purple-600 text-white border-purple-700"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}>
                    {b.name}
                  </button>
                ))}
              </div>
              {selectedBarangays.length > 0 && (
                <div className="text-[10px] text-purple-600 font-bold mt-1">{selectedBarangays.length} barangay(s) selected</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Disaster Type</label>
                <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300">
                  {["Flash Flood","Super Typhoon","Earthquake","Storm Surge","Landslide"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300">
                  {["Critical Priority","High Priority","Moderate Priority"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Requesting Agency</label>
              <select value={requestedAgency} onChange={(e) => setRequestedAgency(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300">
                {agencies.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Units / Assets Requested</label>
                <input type="text" value={requestedUnits} onChange={(e) => setRequestedUnits(e.target.value)}
                  placeholder="e.g., 4 Rubber Boats + 16 SAR Ops"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Total Reinforcements</label>
                <input type="number" min={1} value={totalReinforcements} onChange={(e) => setTotalReinforcements(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Mission Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the emergency situation and special requirements..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? "Escalating..." : "Send Escalation Request"}
              </button>
              <button onClick={onClose} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal: Edit Barangay Manpower ────────────────────────────────────────────

function EditBarangayModal({ barangay, onClose, onSaved }) {
  const [form, setForm] = useState({
    active_sar: barangay.active_sar || 0,
    active_tanods: barangay.active_tanods || 0,
    active_medics: barangay.active_medics || 0,
    active_logistics: barangay.active_logistics || 0,
    active_boat_crews: barangay.active_boat_crews || 0,
    rescue_boats: barangay.rescue_boats || 0,
    ambulances: barangay.ambulances || 0,
    contact_person: barangay.contact_person || "",
    contact_number: barangay.contact_number || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/manpower/barangays/${barangay.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, min = 0 }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>
      <input type="number" min={min} value={form[field]}
        onChange={(e) => setForm(p => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-300" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Edit3 size={14} className="text-slate-600" />
              Edit Manpower Inventory
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Barangay {barangay.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SAR Operatives" field="active_sar" />
            <Field label="Barangay Tanods" field="active_tanods" />
            <Field label="Medic Personnel" field="active_medics" />
            <Field label="Logistics Team" field="active_logistics" />
            <Field label="Boat Crew Members" field="active_boat_crews" />
            <Field label="Rescue Boats" field="rescue_boats" />
            <Field label="Ambulances" field="ambulances" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Contact Person</label>
              <input type="text" value={form.contact_person} onChange={(e) => setForm(p => ({ ...p, contact_person: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Contact Number</label>
              <input type="text" value={form.contact_number} onChange={(e) => setForm(p => ({ ...p, contact_number: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={onClose} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PersonnelAlertPage() {
  const [subTab, setSubTab] = useState("alerts"); // 'alerts' | 'barangays' | 'transfers' | 'escalations'

  // Data
  const [alerts, setAlerts] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [escalations, setEscalations] = useState([]);

  // Loading
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [loadingEscalations, setLoadingEscalations] = useState(false);

  // Search / Filter
  const [alertSearch, setAlertSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState("ALL"); // ALL | CRITICAL RED | SEVERE ORANGE | MODERATE YELLOW | SUFFICIENT GREEN
  const [barangaySearch, setBarangaySearch] = useState("");

  // Expanded alert rows
  const [expandedAlerts, setExpandedAlerts] = useState({});

  // Modals
  const [triggerAlert, setTriggerAlert] = useState(null); // barangay_name
  const [showMutualAid, setShowMutualAid] = useState(false);
  const [mutualAidDefaultTo, setMutualAidDefaultTo] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateDefaultTargets, setEscalateDefaultTargets] = useState([]);
  const [editBarangay, setEditBarangay] = useState(null);

  // ── Fetchers ───────────────────────────────────────────────────────────────

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${API}/api/manpower/alerts`);
      if (res.ok) setAlerts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingAlerts(false); }
  }, []);

  const fetchBarangays = useCallback(async () => {
    setLoadingBarangays(true);
    try {
      const res = await fetch(`${API}/api/manpower/barangays`);
      if (res.ok) setBarangays(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingBarangays(false); }
  }, []);

  const fetchTransfers = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const res = await fetch(`${API}/api/manpower/transfers`);
      if (res.ok) setTransfers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingTransfers(false); }
  }, []);

  const fetchEscalations = useCallback(async () => {
    setLoadingEscalations(true);
    try {
      const res = await fetch(`${API}/api/manpower/escalations`);
      if (res.ok) setEscalations(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingEscalations(false); }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchBarangays();
    fetchTransfers();
    fetchEscalations();
  }, [fetchAlerts, fetchBarangays, fetchTransfers, fetchEscalations]);

  // ── Computed stats ─────────────────────────────────────────────────────────

  const criticalCount = alerts.filter(a => a.alert_level?.includes("CRITICAL")).length;
  const severeCount   = alerts.filter(a => a.alert_level?.includes("SEVERE")).length;
  const moderateCount = alerts.filter(a => a.alert_level?.includes("MODERATE")).length;
  const sufficientCount = alerts.filter(a => a.alert_level?.includes("SUFFICIENT")).length;
  const totalDeficit  = alerts.reduce((s, a) => s + (a.deficit_count || 0), 0);

  // ── Filtered lists ─────────────────────────────────────────────────────────

  const filteredAlerts = alerts.filter(a => {
    const matchSearch = !alertSearch || a.barangay_name?.toLowerCase().includes(alertSearch.toLowerCase());
    const matchFilter = alertFilter === "ALL" || a.alert_level === alertFilter;
    return matchSearch && matchFilter;
  });

  const filteredBarangays = barangays.filter(b =>
    !barangaySearch || b.name?.toLowerCase().includes(barangaySearch.toLowerCase()) || b.district?.toLowerCase().includes(barangaySearch.toLowerCase())
  );

  // ── Sub-tab nav ────────────────────────────────────────────────────────────

  const subTabs = [
    { id: "alerts", label: "Alert Matrix", icon: ShieldAlert, badge: criticalCount },
    { id: "barangays", label: "Barangay Inventory", icon: Building },
    { id: "transfers", label: "Mutual Aid Log", icon: ArrowRightLeft, count: transfers.length },
    { id: "escalations", label: "Agency Escalations", icon: Send, count: escalations.length },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
      
      {/* ── Page Header ── */}
      <div className="flex-shrink-0 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-sm text-white flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Personnel Status
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
            
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMutualAidDefaultTo(""); setShowMutualAid(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowRightLeft size={13} /> Mutual Aid
            </button>
            <button
              onClick={() => { setEscalateDefaultTargets([]); setShowEscalate(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ShieldAlert size={13} /> Escalate
            </button>
            <button
              onClick={() => window.open(`${API}/api/manpower/export`, "_blank")}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              title="Export CSV Report"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          <StatCard label="Critical Red" value={criticalCount} sub="Emergency deficit" color="red" icon={AlertTriangle} />
          <StatCard label="Severe Orange" value={severeCount} sub="Major gap" color="orange" icon={ShieldAlert} />
          <StatCard label="Moderate Yellow" value={moderateCount} sub="Moderate gap" color="amber" icon={Activity} />
          <StatCard label="Sufficient" value={sufficientCount} sub="Adequate coverage" color="emerald" icon={ShieldCheck} />
          <StatCard label="Total Deficit" value={totalDeficit.toLocaleString()} sub="Personnel shortage" color="slate" icon={Users} />
        </div>

        {/* Sub-nav */}
        <div className="flex items-center gap-1 mt-4 bg-slate-100/80 p-1 rounded-xl border border-slate-200 w-fit">
          {subTabs.map((t) => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  isActive ? "bg-white text-red-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}>
                <Icon size={13} className={isActive ? "text-red-600" : "text-slate-500"} />
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-black animate-pulse">{t.badge}</span>
                )}
                {t.count !== undefined && !t.badge && t.count > 0 && (
                  <span className="text-[10px] font-mono text-slate-400">({t.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

        {/* ── SUB-TAB 1: ALERT MATRIX ── */}
        {subTab === "alerts" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-48">
                <Activity size={13} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search barangay..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="flex items-center gap-1">
                {["ALL","CRITICAL RED","SEVERE ORANGE","MODERATE YELLOW","SUFFICIENT GREEN"].map(f => (
                  <button key={f}
                    onClick={() => setAlertFilter(f)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      alertFilter === f
                        ? f === "ALL" ? "bg-slate-800 text-white border-slate-800"
                          : f.includes("CRITICAL") ? "bg-red-600 text-white border-red-700"
                          : f.includes("SEVERE") ? "bg-orange-500 text-white border-orange-600"
                          : f.includes("MODERATE") ? "bg-amber-500 text-white border-amber-600"
                          : "bg-emerald-600 text-white border-emerald-700"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}>
                    {f === "ALL" ? "All" : f.split(" ")[0]}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchAlerts}
                disabled={loadingAlerts}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                <RefreshCw size={12} className={loadingAlerts ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {/* Alert table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-4 w-8"></th>
                    <th className="p-3.5">Barangay</th>
                    <th className="p-3.5">Alert Level</th>
                    <th className="p-3.5">Affected Pop.</th>
                    <th className="p-3.5">Required</th>
                    <th className="p-3.5">Available</th>
                    <th className="p-3.5">Deficit</th>
                    <th className="p-3.5">Deficit %</th>
                    <th className="p-3.5">Mobilization</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-slate-400 italic">
                        {loadingAlerts ? "Loading personnel alerts..." : "No personnel alerts found."}
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((a) => {
                      const style = alertLevelStyle(a.alert_level);
                      const isExpanded = expandedAlerts[a.id];
                      return (
                        <React.Fragment key={a.id}>
                          <tr className={`hover:bg-slate-50/80 transition-colors ${style.row}`}>
                            <td className="p-3.5 pl-4">
                              <button
                                onClick={() => setExpandedAlerts(p => ({ ...p, [a.id]: !p[a.id] }))}
                                className="p-0.5 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                              </button>
                            </td>
                            <td className="p-3.5 font-bold text-slate-900">
                              <div>{a.barangay_name}</div>
                              <div className="text-[10px] font-normal text-slate-500 font-mono">{a.disaster_type}</div>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono uppercase border ${style.badge}`}>
                                {a.alert_level?.split(" ").slice(0,1).join(" ")} {a.alert_level?.split(" ")[1]}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-700">{(a.projected_affected_pop || 0).toLocaleString()}</td>
                            <td className="p-3.5 font-mono font-bold text-slate-900">{a.required_total || 0}</td>
                            <td className="p-3.5 font-mono text-emerald-700 font-bold">{a.available_total || 0}</td>
                            <td className="p-3.5">
                              <span className={`font-black font-mono text-sm ${a.deficit_count > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                {a.deficit_count > 0 ? "-" : "+"}{Math.abs(a.deficit_count || 0)}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-1 min-w-[100px]">
                                <DeficitBar deficit={a.deficit_count || 0} required={a.required_total || 1} />
                                <span className="font-mono text-[11px] text-slate-600 font-bold">{a.deficit_percentage || 0}%</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="text-[11px] text-slate-500 italic">{a.mobilization_status}</span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1">
                                {a.alert_level?.includes("CRITICAL") && (
                                  <button
                                    onClick={() => setTriggerAlert(a.barangay_name)}
                                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                                    title="Trigger Emergency Alert"
                                  >
                                    <Radio size={10} /> Alert
                                  </button>
                                )}
                                <button
                                  onClick={() => { setMutualAidDefaultTo(a.barangay_name); setShowMutualAid(true); }}
                                  className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                                  title="Deploy Mutual Aid"
                                >
                                  <ArrowRightLeft size={10} /> Aid
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded row detail */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className={`px-6 py-4 ${style.glow}`}>
                                <div className="grid grid-cols-4 gap-4 text-xs">
                                  <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1">
                                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Required Breakdown</div>
                                    <div className="flex justify-between"><span className="font-medium text-slate-600 flex items-center gap-1"><Shield size={10}/>SAR</span><span className="font-bold font-mono">{a.required_sar}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-slate-600 flex items-center gap-1"><Users size={10}/>Tanods</span><span className="font-bold font-mono">{a.required_tanods}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-slate-600 flex items-center gap-1"><Heart size={10}/>Medics</span><span className="font-bold font-mono">{a.required_medics}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-slate-600 flex items-center gap-1"><Package size={10}/>Logistics</span><span className="font-bold font-mono">{a.required_logistics}</span></div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Scenario Info</div>
                                    <div><span className="text-slate-500">Scenario:</span> <span className="font-bold">{a.scenario_level}</span></div>
                                    <div><span className="text-slate-500">Status:</span> <span className="font-bold">{a.status}</span></div>
                                    <div><span className="text-slate-500">Triggered By:</span> <span className="font-bold">{a.triggered_by}</span></div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quick Actions</div>
                                    <button
                                      onClick={() => { setEscalateDefaultTargets([a.barangay_name]); setShowEscalate(true); }}
                                      className="w-full py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                      <ShieldAlert size={11} /> Escalate to Agency
                                    </button>
                                    <button
                                      onClick={() => { setMutualAidDefaultTo(a.barangay_name); setShowMutualAid(true); }}
                                      className="w-full py-2 px-3 bg-sky-100 hover:bg-sky-200 text-sky-700 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                      <ArrowRightLeft size={11} /> Request Mutual Aid
                                    </button>
                                  </div>
                                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Timeline</div>
                                    <div className="text-[11px] text-slate-500">
                                      {a.created_at ? new Date(a.created_at).toLocaleString("en-PH") : "N/A"}
                                    </div>
                                    <div className="text-[11px] text-slate-700 font-bold mt-1">{a.mobilization_status}</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 2: BARANGAY INVENTORY ── */}
        {subTab === "barangays" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
                <Building size={13} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by barangay or district..."
                  value={barangaySearch}
                  onChange={(e) => setBarangaySearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
              <button onClick={fetchBarangays} disabled={loadingBarangays}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                <RefreshCw size={12} className={loadingBarangays ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-4">Barangay</th>
                    <th className="p-3.5">Risk Level</th>
                    <th className="p-3.5">Population</th>
                    <th className="p-3.5 flex items-center gap-1"><Shield size={10}/>SAR</th>
                    <th className="p-3.5">Tanods</th>
                    <th className="p-3.5">Medics</th>
                    <th className="p-3.5">Logistics</th>
                    <th className="p-3.5">Boats</th>
                    <th className="p-3.5">Ambul.</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBarangays.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-10 text-center text-slate-400 italic">
                        {loadingBarangays ? "Loading barangay inventory..." : "No barangays found."}
                      </td>
                    </tr>
                  ) : (
                    filteredBarangays.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-slate-900">{b.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{b.district}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${riskStyle(b.risk_level)}`}>{b.risk_level}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">{(b.population || 0).toLocaleString()}</td>
                        <td className="p-3.5 font-black font-mono text-slate-900">{b.active_sar}</td>
                        <td className="p-3.5 font-black font-mono text-slate-900">{b.active_tanods}</td>
                        <td className="p-3.5 font-black font-mono text-slate-900">{b.active_medics}</td>
                        <td className="p-3.5 font-black font-mono text-slate-900">{b.active_logistics}</td>
                        <td className="p-3.5 font-mono text-sky-700 font-bold">{b.rescue_boats}</td>
                        <td className="p-3.5 font-mono text-red-700 font-bold">{b.ambulances}</td>
                        <td className="p-3.5">
                          <div className="text-[11px] font-bold text-slate-700">{b.contact_person}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{b.contact_number}</div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => setEditBarangay(b)}
                            className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit manpower inventory"
                          >
                            <Edit3 size={13} className="text-slate-500" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 3: MUTUAL AID TRANSFERS ── */}
        {subTab === "transfers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Cross-Barangay Mutual Aid Deployments</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Personnel reinforcement transfers between barangays during disaster events</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setMutualAidDefaultTo(""); setShowMutualAid(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                  <Plus size={13} /> New Transfer
                </button>
                <button onClick={fetchTransfers} disabled={loadingTransfers}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                  <RefreshCw size={12} className={loadingTransfers ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {transfers.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <ArrowRightLeft size={36} className="mx-auto text-slate-300" />
                <div className="font-bold text-slate-500">No mutual aid transfers recorded</div>
                <p className="text-xs">Initiate cross-barangay reinforcement deployments using the New Transfer button.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transfers.map((t) => {
                  const statusColor = t.status === "On-Scene" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : t.status === "En-Route" ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200";
                  return (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400">TRANSFER-{String(t.id).padStart(4,"0")}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}>{t.status}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">From</div>
                          <div className="font-black text-slate-900 text-sm">{t.from_barangay}</div>
                        </div>
                        <ArrowRightLeft size={18} className="text-sky-600 flex-shrink-0" />
                        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
                          <div className="text-[10px] text-red-500 font-bold uppercase">To</div>
                          <div className="font-black text-red-800 text-sm">{t.to_barangay}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="bg-slate-50 rounded-lg p-2"><div className="font-black font-mono text-slate-900 text-base">{t.sar_count}</div><div className="text-slate-500 font-bold">SAR</div></div>
                        <div className="bg-slate-50 rounded-lg p-2"><div className="font-black font-mono text-slate-900 text-base">{t.tanod_count}</div><div className="text-slate-500 font-bold">Tanods</div></div>
                        <div className="bg-slate-50 rounded-lg p-2"><div className="font-black font-mono text-slate-900 text-base">{t.medic_count}</div><div className="text-slate-500 font-bold">Medics</div></div>
                        <div className="bg-sky-50 rounded-lg p-2 border border-sky-200"><div className="font-black font-mono text-sky-900 text-base">{t.total_personnel}</div><div className="text-sky-600 font-bold">Total</div></div>
                      </div>

                      {t.notes && (
                        <div className="text-[11px] text-slate-500 italic bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                          "{t.notes}"
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                        <span>{t.disaster_type}</span>
                        <span>{t.created_at ? new Date(t.created_at).toLocaleDateString("en-PH") : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SUB-TAB 4: AGENCY ESCALATIONS ── */}
        {subTab === "escalations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">External Agency Escalation Log</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Reinforcement requests transmitted to PCG, AFP, BFP, Red Cross, and NDRRMC</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEscalateDefaultTargets([]); setShowEscalate(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                  <Plus size={13} /> New Escalation
                </button>
                <button onClick={fetchEscalations} disabled={loadingEscalations}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                  <RefreshCw size={12} className={loadingEscalations ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {escalations.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <ShieldAlert size={36} className="mx-auto text-slate-300" />
                <div className="font-bold text-slate-500">No agency escalations recorded</div>
                <p className="text-xs">Request external reinforcements from government agencies via the New Escalation button.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {escalations.map((e) => {
                  const priorityColor = e.priority?.includes("Critical") ? "bg-red-50 text-red-700 border-red-200"
                    : e.priority?.includes("High") ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-amber-50 text-amber-700 border-amber-200";
                  return (
                    <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                          {e.reference_no}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${priorityColor}`}>{e.priority}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Shield size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{e.requested_agency}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{e.requested_units}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Target Barangays</span>
                          <span className="font-bold text-slate-800 text-right max-w-[60%]">{e.target_barangays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Total Reinforcements</span>
                          <span className="font-black text-slate-900 font-mono text-base">{e.total_reinforcements}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Status</span>
                          <span className="font-bold text-emerald-700">{e.status}</span>
                        </div>
                      </div>

                      {e.notes && (
                        <div className="text-[11px] text-slate-500 italic bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                          "{e.notes}"
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                        <span>{e.disaster_type} · {e.scenario_level}</span>
                        <span>{e.created_at ? new Date(e.created_at).toLocaleDateString("en-PH") : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {triggerAlert && (
        <TriggerAlertModal
          barangay={triggerAlert}
          onClose={() => setTriggerAlert(null)}
          onTriggered={() => fetchAlerts()}
        />
      )}
      {showMutualAid && (
        <MutualAidModal
          barangays={barangays}
          defaultTo={mutualAidDefaultTo}
          onClose={() => { setShowMutualAid(false); setMutualAidDefaultTo(""); }}
          onTransferred={() => fetchTransfers()}
        />
      )}
      {showEscalate && (
        <EscalateAgencyModal
          barangays={barangays}
          defaultTargets={escalateDefaultTargets}
          onClose={() => { setShowEscalate(false); setEscalateDefaultTargets([]); }}
          onEscalated={() => fetchEscalations()}
        />
      )}
      {editBarangay && (
        <EditBarangayModal
          barangay={editBarangay}
          onClose={() => setEditBarangay(null)}
          onSaved={() => fetchBarangays()}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle,
  PhoneCall,
  PhoneForwarded,
  PhoneOutgoing,
  Play,
  Send,
  Square,
  UserCheck,
  Volume2,
  VolumeX,
  X,
  Navigation,
} from "lucide-react";

export function BroadcastModal({ onClose }) {
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
                      priority === p ? "bg-white text-red-700 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
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

export function DispatchModal({ alert, rescuers, onDispatch, onClose }) {
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
              <div className="text-red-800 italic border-t border-red-100/60 pt-2 mt-2">“{alert.message}”</div>
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
                    chosen === r.id ? "border-red-500 bg-red-50/40 shadow-xs" : "border-slate-200/80 hover:border-slate-300 bg-white"
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

export function CallRescuerModal({ rescuers, casualties, alerts, onClose, onDispatch }) {
  const [selectedRescuerId, setSelectedRescuerId] = useState("");
  const [targetType, setTargetType] = useState("victim");
  const [targetId, setTargetId] = useState("");

  const availableRescuers = rescuers.filter((r) => r.isVerified !== false && r.status === "available");

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
      const victim = casualties.find((c) => String(c.id) === String(targetId));
      targetName = victim ? victim.victim_name : `Victim #${targetId}`;
    } else if (targetType === "alert") {
      const alertItem = alerts.find((a) => String(a.id) === String(targetId));
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
                {availableRescuers.map((r) => (
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
              {targetType === "victim" &&
                casualties.filter((c) => c.status !== "Rescued").map((c) => (
                  <option key={c.id} value={c.id}>
                    VIC-{c.id}: {c.victim_name} ({c.status} - {c.location})
                  </option>
                ))}
              {targetType === "alert" &&
                alerts.filter((a) => a.status === "unassigned").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id}: {a.name} ({a.zone})
                  </option>
                ))}
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

export function AutoCallZcdrrmoModal({ alerts, onClose }) {
  const [selectedDesk, setSelectedDesk] = useState("zcdrrmo_main");
  const [selectedAlertId, setSelectedAlertId] = useState(alerts?.[0]?.id || "ALL");
  const [priorityLevel, setPriorityLevel] = useState("Level 3 - Critical SOS Escalation");
  const [scriptText, setScriptText] = useState("");
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
      badge: "Central HQ",
    },
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
        setCallDuration((prev) => prev + 1);
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

        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
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
                <h4 className="text-sm font-bold text-emerald-950 font-mono">DISPATCH CONFIRMATION LOGGED</h4>
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
                        selectedDesk === key ? "bg-red-50/80 border-red-300 ring-1 ring-red-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
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
                    {alerts?.map((a) => (
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
          )}
        </div>

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

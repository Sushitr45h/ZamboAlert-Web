import { Plus, RefreshCw, Shield, ShieldAlert } from "lucide-react";

export default function AgencyEscalationsTab({
  escalations,
  loadingEscalations,
  fetchEscalations,
  setEscalateDefaultTargets,
  setShowEscalate,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">External Agency Escalation Log</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Reinforcement requests transmitted to PCG, AFP, BFP, Red Cross, and NDRRMC</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEscalateDefaultTargets([]);
              setShowEscalate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            <Plus size={13} /> New Escalation
          </button>
          <button
            onClick={fetchEscalations}
            disabled={loadingEscalations}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
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
            const priorityColor = e.priority?.includes("Critical")
              ? "bg-red-50 text-red-700 border-red-200"
              : e.priority?.includes("High")
                ? "bg-orange-50 text-orange-700 border-orange-200"
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
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
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
  );
}

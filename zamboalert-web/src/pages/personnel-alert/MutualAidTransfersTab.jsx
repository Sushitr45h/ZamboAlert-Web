import { ArrowRightLeft, Plus, RefreshCw } from "lucide-react";

export default function MutualAidTransfersTab({
  transfers,
  loadingTransfers,
  fetchTransfers,
  setMutualAidDefaultTo,
  setShowMutualAid,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Cross-Barangay Mutual Aid Deployments</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Personnel reinforcement transfers between barangays during disaster events</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMutualAidDefaultTo("");
              setShowMutualAid(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            <Plus size={13} /> New Transfer
          </button>
          <button
            onClick={fetchTransfers}
            disabled={loadingTransfers}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
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
            const statusColor =
              t.status === "On-Scene"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : t.status === "En-Route"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200";

            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">TRANSFER-{String(t.id).padStart(4, "0")}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}>{t.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">From</div>
                    <div className="font-black text-slate-900 text-sm">{t.from_barangay}</div>
                  </div>
                  <ArrowRightLeft size={18} className="text-sky-600 shrink-0" />
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
  );
}

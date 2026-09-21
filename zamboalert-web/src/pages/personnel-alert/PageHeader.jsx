import { AlertTriangle, Activity, ArrowRightLeft, Download, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { StatCard } from "./personnelAlertUtils";

export default function PageHeader({
  criticalCount,
  severeCount,
  moderateCount,
  sufficientCount,
  totalDeficit,
  subTab,
  subTabs,
  setSubTab,
  onMutualAid,
  onEscalate,
  onExport,
}) {
  return (
    <div className="shrink-0 border-b border-slate-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shadow-sm text-white shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Personnel Status</h2>
            <p className="text-[11px] text-slate-500 mt-0.5"></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMutualAid}
            className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ArrowRightLeft size={13} /> Mutual Aid
          </button>
          <button
            onClick={onEscalate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ShieldAlert size={13} /> Escalate
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            title="Export CSV Report"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mt-4">
        <StatCard label="Critical Red" value={criticalCount} sub="Emergency deficit" color="red" icon={AlertTriangle} />
        <StatCard label="Severe Orange" value={severeCount} sub="Major gap" color="orange" icon={ShieldAlert} />
        <StatCard label="Moderate Yellow" value={moderateCount} sub="Moderate gap" color="amber" icon={Activity} />
        <StatCard label="Sufficient" value={sufficientCount} sub="Adequate coverage" color="emerald" icon={ShieldCheck} />
        <StatCard label="Total Deficit" value={totalDeficit.toLocaleString()} sub="Personnel shortage" color="slate" icon={Users} />
      </div>

      <div className="flex items-center gap-1 mt-4 bg-slate-100/80 p-1 rounded-xl border border-slate-200 w-fit">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                isActive ? "bg-white text-red-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
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
  );
}

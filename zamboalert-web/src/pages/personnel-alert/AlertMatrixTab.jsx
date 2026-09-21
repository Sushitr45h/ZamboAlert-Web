import React from "react";
import { Activity, ArrowRightLeft, ChevronDown, ChevronUp, Heart, Package, Radio, RefreshCw, Shield, ShieldAlert, Users } from "lucide-react";
import { alertLevelStyle, DeficitBar } from "./personnelAlertUtils";

const ALERT_FILTER_OPTIONS = ["ALL", "CRITICAL RED", "SEVERE ORANGE", "MODERATE YELLOW", "SUFFICIENT GREEN"];

export default function AlertMatrixTab({
  alerts,
  loadingAlerts,
  alertSearch,
  setAlertSearch,
  alertFilter,
  setAlertFilter,
  fetchAlerts,
  expandedAlerts,
  setExpandedAlerts,
  setTriggerAlert,
  setMutualAidDefaultTo,
  setShowMutualAid,
  setEscalateDefaultTargets,
  setShowEscalate,
}) {
  const filteredAlerts = alerts.filter((a) => {
    const matchSearch = !alertSearch || a.barangay_name?.toLowerCase().includes(alertSearch.toLowerCase());
    const matchFilter = alertFilter === "ALL" || a.alert_level === alertFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
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
          {ALERT_FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              onClick={() => setAlertFilter(filter)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                alertFilter === filter
                  ? filter === "ALL"
                    ? "bg-slate-800 text-white border-slate-800"
                    : filter.includes("CRITICAL")
                      ? "bg-red-600 text-white border-red-700"
                      : filter.includes("SEVERE")
                        ? "bg-orange-500 text-white border-orange-600"
                        : filter.includes("MODERATE")
                          ? "bg-amber-500 text-white border-amber-600"
                          : "bg-emerald-600 text-white border-emerald-700"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {filter === "ALL" ? "All" : filter.split(" ")[0]}
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
                          onClick={() => setExpandedAlerts((p) => ({ ...p, [a.id]: !p[a.id] }))}
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
                          {a.alert_level?.split(" ").slice(0, 1).join(" ")} {a.alert_level?.split(" ")[1]}
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
                            onClick={() => {
                              setMutualAidDefaultTo(a.barangay_name);
                              setShowMutualAid(true);
                            }}
                            className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                            title="Deploy Mutual Aid"
                          >
                            <ArrowRightLeft size={10} /> Aid
                          </button>
                        </div>
                      </td>
                    </tr>

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
                                onClick={() => {
                                  setEscalateDefaultTargets([a.barangay_name]);
                                  setShowEscalate(true);
                                }}
                                className="w-full py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                              >
                                <ShieldAlert size={11} /> Escalate to Agency
                              </button>
                              <button
                                onClick={() => {
                                  setMutualAidDefaultTo(a.barangay_name);
                                  setShowMutualAid(true);
                                }}
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
  );
}

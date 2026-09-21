import { RefreshCw, Search } from "lucide-react";

export default function ActivityTab({ activitySearch, setActivitySearch, filteredActivities, mockActivityLogs, showToast }) {
  return (
    <div className="space-y-5 animate-in fade-in-30 duration-200 flex-grow flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Admin Activity Logs
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            History of administrative system settings, security changes, and dispatch operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast("Refreshing admin activity database... (Mock)")}
          className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-bold tracking-wider uppercase rounded transition-colors shadow-xs cursor-pointer font-mono"
        >
          <RefreshCw size={10} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Search logs by operator, ID, or action..."
            value={activitySearch}
            onChange={(e) => setActivitySearch(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200/80 rounded pl-8.5 pr-3 py-1.8 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="border border-slate-200/70 rounded-xl overflow-hidden flex-grow bg-white min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-[10.5px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-250 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                <th className="p-3 pl-4">Log ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                    No admin activity logs found.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 pl-4 font-bold text-red-900">{log.id}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-slate-800">{log.operator}</td>
                    <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{log.action}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={log.detail}>{log.detail}</td>
                    <td className="p-3 text-slate-400">{log.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono px-1">
        <span>Showing {filteredActivities.length} logs of {mockActivityLogs.length} entries</span>
        <span>Database Engine: SQLite (Local Offline Cache)</span>
      </div>
    </div>
  );
}

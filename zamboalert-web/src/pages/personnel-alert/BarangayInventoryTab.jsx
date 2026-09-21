import { Building, Edit3, RefreshCw, Shield } from "lucide-react";
import { riskStyle } from "./personnelAlertUtils";

export default function BarangayInventoryTab({
  barangays,
  loadingBarangays,
  barangaySearch,
  setBarangaySearch,
  fetchBarangays,
  setEditBarangay,
}) {
  const filteredBarangays = barangays.filter(
    (b) =>
      !barangaySearch ||
      b.name?.toLowerCase().includes(barangaySearch.toLowerCase()) ||
      b.district?.toLowerCase().includes(barangaySearch.toLowerCase())
  );

  return (
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
        <button
          onClick={fetchBarangays}
          disabled={loadingBarangays}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
        >
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
  );
}

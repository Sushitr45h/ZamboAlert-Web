import { Activity, LogOut, MapPin, Settings, Shield, Sliders, User } from "lucide-react";
import { SETTINGS_TABS, getInitials } from "./settingsUtils";

export default function SettingsSidebar({ profile, activeTab, setActiveTab, handleLogout }) {
  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-xs uppercase font-mono shadow-xs">
            {getInitials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">{profile.name}</h3>
            <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wide block truncate">
              {profile.role.split(" - ")[0]}
            </span>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 mt-4 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {SETTINGS_TABS.map((tab) => {
            const iconMap = {
              account: User,
              activity: Activity,
              rescuers: Shield,
              location: MapPin,
            };
            const Icon = iconMap[tab.id] || User;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap md:w-full border ${
                  isActive
                    ? "bg-red-50 text-red-800 border-red-100/70 shadow-xs"
                    : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                }`}
              >
                <Icon size={14} className={isActive ? "text-red-600" : "text-slate-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap md:w-full border bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-xs md:mt-2"
          >
            <LogOut size={14} className="text-white" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <div className="hidden md:flex bg-gradient-to-br from-red-900 to-red-950 rounded-xl p-4 text-white border border-red-800/20 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
          <Settings size={180} />
        </div>
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-red-300 font-mono flex items-center gap-1.5">
          <Sliders size={10} /> System Mode
        </h4>
        <p className="text-xs font-medium mt-2 leading-relaxed text-slate-200">
          Mesh nodes and LoRa sensors are operating normally. Dispatches are tracked locally.
        </p>
        <div className="flex items-center gap-2 mt-4 text-[9px] font-mono text-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Local LoRa Gateway Active
        </div>
      </div>
    </aside>
  );
}

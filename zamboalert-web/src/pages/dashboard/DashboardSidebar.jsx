import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function DashboardSidebar({
  navGroups,
  activeTab,
  isSidebarCollapsed,
  isMobileSidebarOpen,
  setIsSidebarCollapsed,
  setIsMobileSidebarOpen,
  setActiveTab,
}) {
  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300 z-50 border-r border-slate-800/80 overflow-hidden select-none ${
        isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      } ${isSidebarCollapsed ? "w-20" : "w-64"}`}
    >
      <div className="h-16 px-3 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <img
            src="/zamboalert.png"
            alt="ZamboAlert Logo"
            className="w-9 h-9 object-contain rounded-lg bg-white/5 ring-1 ring-white/10 flex-shrink-0"
          />

          <div
            className={`transition-all duration-300 min-w-0 ${
              isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden pointer-events-none hidden" : "w-auto opacity-100"
            }`}
          >
            <div className="text-sm font-extrabold text-white tracking-tight leading-none font-mono truncate">
              ZamboAlert
            </div>
            <div className="text-[10px] text-red-400 font-mono font-bold tracking-wider uppercase block mt-1 whitespace-nowrap">
              Barangay Tumaga
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            {!isSidebarCollapsed ? (
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap transition-opacity duration-200">
                {group.title}
              </div>
            ) : (
              idx > 0 && <div className="h-px bg-slate-800/60 my-2 mx-1" />
            )}

            <div className="space-y-1">
              {group.items.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const badgeCount = Number(tab.badge ?? 0);
                const itemCount = Number(tab.count ?? 0);

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-950/60 font-extrabold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    } ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
                  >
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      <Icon
                        size={18}
                        className={`transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />

                      {isSidebarCollapsed && badgeCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-mono font-black bg-red-600 text-white flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                          {badgeCount}
                        </span>
                      )}
                    </div>

                    {!isSidebarCollapsed && (
                      <span className="truncate flex-1 text-left whitespace-nowrap">{tab.label}</span>
                    )}

                    {!isSidebarCollapsed && badgeCount > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black whitespace-nowrap ${
                          isActive ? "bg-white text-red-700" : "bg-red-600 text-white animate-pulse"
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}

                    {!isSidebarCollapsed && itemCount > 0 && !badgeCount && (
                      <span className={`text-[10px] font-mono whitespace-nowrap ${isActive ? "text-red-100" : "text-slate-500"}`}>
                        ({itemCount})
                      </span>
                    )}

                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 flex items-center gap-2">
                        <span>{tab.label}</span>
                        {badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-600 text-white font-bold">
                            {badgeCount}
                          </span>
                        )}
                        {itemCount > 0 && !badgeCount && (
                          <span className="text-[10px] font-mono text-slate-400">({itemCount})</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

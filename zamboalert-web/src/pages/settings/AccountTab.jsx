import { Lock, Save, Sliders, User } from "lucide-react";
import { NOTIFICATION_ITEMS } from "./settingsUtils";

export default function AccountTab({
  profile,
  setProfile,
  rules,
  handleToggleRule,
  passwords,
  setPasswords,
  handleProfileSave,
  handleSecuritySave,
  notificationSettings,
  handleToggleNotif,
}) {
  return (
    <div className="space-y-6 animate-in fade-in-30 duration-200 flex-grow">
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          Account & System Administration
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          Manage administrator profiles, system behavior settings, password security, and alerts dispatch rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
              Administrator Profile
            </span>
            <User size={13} className="text-slate-400" />
          </div>
          <form onSubmit={handleProfileSave} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Administrator Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Government Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                placeholder="Email address"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Role / Title</label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                placeholder="Role or Office title"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Base / Station</label>
              <input
                type="text"
                value={profile.station}
                onChange={(e) => setProfile({ ...profile, station: e.target.value })}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                placeholder="Command center details"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>Joined: {profile.joinedDate}</span>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save size={12} />
              Save Profile Changes
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                Rescuer Onboarding Rules
              </span>
              <Sliders size={13} className="text-slate-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="require-approval-settings"
                  checked={rules.requireRescuerApproval}
                  onChange={() => handleToggleRule("requireRescuerApproval")}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="require-approval-settings" className="flex-1 text-[10px] text-slate-600 leading-tight cursor-pointer font-sans">
                  <span className="font-bold text-slate-900 block uppercase mb-0.5">Require Admin Approval</span>
                  When enabled, rescuers signing up via the mobile application require manual admin review and approval before they can be dispatched.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="auto-dispatch-settings"
                  checked={rules.autoDispatchOnSOS}
                  onChange={() => handleToggleRule("autoDispatchOnSOS")}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="auto-dispatch-settings" className="flex-1 text-[10px] text-slate-600 leading-tight cursor-pointer font-sans">
                  <span className="font-bold text-slate-900 block uppercase mb-0.5">Auto-Route & Dispatch SOS</span>
                  When enabled, the nearest available verified rescuer unit will automatically receive dispatch orders immediately upon SOS detection.
                </label>
              </div>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                Security Settings
              </span>
              <Lock size={13} className="text-slate-400" />
            </div>
            <form onSubmit={handleSecuritySave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Current Password</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock size={12} />
                Change Admin Password
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono block">
            Sound & Alert Notifications
          </span>
          <div className="space-y-3.5 bg-slate-50/20 p-4 border border-slate-100 rounded-xl">
            {NOTIFICATION_ITEMS.map((notif) => (
              <div key={notif.id} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-[10.5px] font-bold text-slate-900 block">{notif.label}</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">{notif.desc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif(notif.id)}
                  className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationSettings[notif.id] ? "bg-red-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notificationSettings[notif.id] ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

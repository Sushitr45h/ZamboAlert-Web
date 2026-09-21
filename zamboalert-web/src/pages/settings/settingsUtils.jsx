export const SETTINGS_TABS = [
  { id: "account", label: "Account & System" },
  { id: "activity", label: "Admin Activity Logs" },
  { id: "rescuers", label: "Rescuer Logs" },
  { id: "location", label: "Location & Geofence" },
];

export const NOTIFICATION_ITEMS = [
  { id: "emailAlerts", label: "Incident Email Alerts", desc: "Receive email reports for every unresolved critical incident." },
  { id: "browserSound", label: "Browser Alert Alarm", desc: "Play critical sirens/beeps on tactical dashboard during SOS triggers." },
  { id: "highPrioritySMS", label: "Urgent SMS Announcements", desc: "Mirror SOS notifications to community council mobile phones." },
  { id: "autoCallZcdrrmo", label: "Auto-Call Main ZCDRRMO Office", desc: "Automate voice hotline calls to ZCDRRMO Command Center on Level 3 critical SOS triggers." },
  { id: "weeklyReport", label: "Weekly Dispatch Report", desc: "Email automated weekly stats logs to Barangay Captain." },
];

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const getGeofenceAreaKm2 = (radius) => {
  const value = Number(radius) || 1200;
  return ((Math.PI * value * value) / 1000000).toFixed(2);
};

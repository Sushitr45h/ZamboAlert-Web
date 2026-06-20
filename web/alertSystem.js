/**
 * Core alert system logic for ZamboAlert.
 * Extracted for testability — all pure/business logic lives here.
 */

const defaultLat = 8.476;
const defaultLng = 123.610;

const barangayLocations = [
  { name: "Zone 1", lat: 8.4782, lng: 123.6095 },
  { name: "Zone 2", lat: 8.475, lng: 123.613 },
  { name: "Zone 3", lat: 8.4771, lng: 123.607 },
  { name: "Brgy. San Roque", lat: 8.474, lng: 123.608 },
  { name: "Highway 7", lat: 8.4728, lng: 123.6124 },
];

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getAlertLocation(alert) {
  return (
    barangayLocations.find((loc) => loc.name === alert.location) || {
      lat: defaultLat,
      lng: defaultLng,
    }
  );
}

function getLocationOptions() {
  return barangayLocations
    .map((loc) => `<option value="${loc.name}">${loc.name}</option>`)
    .join("");
}

function createAlertSystem(initialUsers, initialAlerts) {
  const system = {
    users: initialUsers || [
      { id: "U01", name: "Admin", role: "Coordinator", online: true, location: "Zone 2" },
      { id: "U02", name: "Maria Dela Cruz", role: "Responder", online: true, location: "Zone 3" },
      { id: "U03", name: "Juan Ramos", role: "Responder", online: false, location: "Brgy. San Roque" },
      { id: "U04", name: "Supervisor", role: "Supervisor", online: true, location: "Zone 1" },
    ],
    alerts: initialAlerts || [],

    addAlert(type, location, reportedBy) {
      const respondent = this.users.find((u) => u.online && u.location === location) || {
        name: "Nearby responder",
        role: "Responder",
        location,
      };
      const newAlert = {
        id: "#A" + Math.floor(100 + Math.random() * 900),
        type,
        location,
        status: "Active",
        timestamp: new Date(),
        reportedBy,
        respondent,
      };
      this.alerts.unshift(newAlert);
      return newAlert;
    },

    resolveAlert(alertId) {
      const alert = this.alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.status = "Resolved";
        return true;
      }
      return false;
    },

    getActiveAlerts() {
      return this.alerts.filter((alert) => alert.status === "Active");
    },

    getResolvedAlerts() {
      return this.alerts.filter((alert) => alert.status === "Resolved");
    },

    computeSummary() {
      const activeCount = this.getActiveAlerts().length;
      const resolvedCount = this.getResolvedAlerts().length;
      const totalAlerts = this.alerts.length;
      const avgMs = this.alerts.reduce((sum, alert) => {
        const delta = alert.status === "Resolved" ? Date.now() - alert.timestamp.getTime() : 0;
        return sum + delta;
      }, 0);
      const avgMinutes = resolvedCount ? Math.round(avgMs / resolvedCount / 60000) : 0;
      return { activeCount, resolvedCount, totalAlerts, avgMinutes };
    },
  };

  return system;
}

// Export for testing (CommonJS for Node compatibility with vanilla JS tests)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    defaultLat,
    defaultLng,
    barangayLocations,
    formatTime,
    getAlertLocation,
    getLocationOptions,
    createAlertSystem,
  };
}

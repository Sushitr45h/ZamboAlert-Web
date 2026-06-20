const {
  defaultLat,
  defaultLng,
  barangayLocations,
  formatTime,
  getAlertLocation,
  getLocationOptions,
  createAlertSystem,
} = require("./alertSystem.js");

describe("Constants", () => {
  it("has default coordinates for Barangay Tumaga", () => {
    expect(defaultLat).toBe(8.476);
    expect(defaultLng).toBe(123.610);
  });

  it("has 5 barangay locations", () => {
    expect(barangayLocations).toHaveLength(5);
  });

  it("each barangay location has name, lat, lng", () => {
    barangayLocations.forEach((loc) => {
      expect(loc.name).toBeDefined();
      expect(typeof loc.lat).toBe("number");
      expect(typeof loc.lng).toBe("number");
    });
  });

  it("includes expected zone names", () => {
    const names = barangayLocations.map((l) => l.name);
    expect(names).toContain("Zone 1");
    expect(names).toContain("Zone 2");
    expect(names).toContain("Zone 3");
    expect(names).toContain("Brgy. San Roque");
    expect(names).toContain("Highway 7");
  });
});

describe("formatTime", () => {
  it("formats a date to HH:MM string", () => {
    const date = new Date(2024, 5, 15, 14, 30);
    expect(formatTime(date)).toBe("14:30");
  });

  it("pads hours with leading zero", () => {
    const date = new Date(2024, 0, 1, 8, 5);
    expect(formatTime(date)).toBe("08:05");
  });

  it("pads minutes with leading zero", () => {
    const date = new Date(2024, 0, 1, 12, 3);
    expect(formatTime(date)).toBe("12:03");
  });

  it("handles midnight", () => {
    const date = new Date(2024, 0, 1, 0, 0);
    expect(formatTime(date)).toBe("00:00");
  });

  it("handles 23:59", () => {
    const date = new Date(2024, 0, 1, 23, 59);
    expect(formatTime(date)).toBe("23:59");
  });
});

describe("getAlertLocation", () => {
  it("returns location for known barangay", () => {
    const alert = { location: "Zone 1" };
    const loc = getAlertLocation(alert);
    expect(loc.name).toBe("Zone 1");
    expect(loc.lat).toBe(8.4782);
    expect(loc.lng).toBe(123.6095);
  });

  it("returns location for Brgy. San Roque", () => {
    const alert = { location: "Brgy. San Roque" };
    const loc = getAlertLocation(alert);
    expect(loc.name).toBe("Brgy. San Roque");
    expect(loc.lat).toBe(8.474);
  });

  it("returns default coordinates for unknown location", () => {
    const alert = { location: "Unknown Place" };
    const loc = getAlertLocation(alert);
    expect(loc.lat).toBe(defaultLat);
    expect(loc.lng).toBe(defaultLng);
  });

  it("returns default coordinates for empty location", () => {
    const alert = { location: "" };
    const loc = getAlertLocation(alert);
    expect(loc.lat).toBe(defaultLat);
    expect(loc.lng).toBe(defaultLng);
  });
});

describe("getLocationOptions", () => {
  it("returns an HTML string with option elements", () => {
    const html = getLocationOptions();
    expect(html).toContain("<option");
    expect(html).toContain("</option>");
  });

  it("includes all 5 barangay names", () => {
    const html = getLocationOptions();
    expect(html).toContain("Zone 1");
    expect(html).toContain("Zone 2");
    expect(html).toContain("Zone 3");
    expect(html).toContain("Brgy. San Roque");
    expect(html).toContain("Highway 7");
  });

  it("uses name as both value and display text", () => {
    const html = getLocationOptions();
    expect(html).toContain('value="Zone 1"');
    expect(html).toContain(">Zone 1<");
  });
});

describe("createAlertSystem", () => {
  let system;

  beforeEach(() => {
    system = createAlertSystem();
  });

  describe("initialization", () => {
    it("creates system with default users", () => {
      expect(system.users).toHaveLength(4);
    });

    it("creates system with empty alerts by default", () => {
      expect(system.alerts).toHaveLength(0);
    });

    it("creates system with custom users", () => {
      const customUsers = [{ id: "U01", name: "Test", role: "Admin", online: true, location: "Zone 1" }];
      const customSystem = createAlertSystem(customUsers);
      expect(customSystem.users).toHaveLength(1);
      expect(customSystem.users[0].name).toBe("Test");
    });

    it("creates system with custom alerts", () => {
      const customAlerts = [{ id: "#A100", type: "Flood", location: "Zone 1", status: "Active", timestamp: new Date(), reportedBy: "Test", respondent: { name: "Test", role: "Responder" } }];
      const customSystem = createAlertSystem(null, customAlerts);
      expect(customSystem.alerts).toHaveLength(1);
    });
  });

  describe("addAlert", () => {
    it("adds a new alert to the system", () => {
      const newAlert = system.addAlert("Flood", "Zone 3", "Community Member");
      expect(system.alerts).toHaveLength(1);
      expect(newAlert.type).toBe("Flood");
    });

    it("generates an alert ID starting with #A", () => {
      const newAlert = system.addAlert("Fire", "Zone 1", "Witness");
      expect(newAlert.id).toMatch(/^#A\d{3}$/);
    });

    it("sets status to Active", () => {
      const newAlert = system.addAlert("Accident", "Highway 7", "Traffic Watch");
      expect(newAlert.status).toBe("Active");
    });

    it("sets a timestamp", () => {
      const before = Date.now();
      const newAlert = system.addAlert("Flood", "Zone 2", "Reporter");
      const after = Date.now();
      expect(newAlert.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(newAlert.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it("assigns an online responder from the same location", () => {
      const newAlert = system.addAlert("Flood", "Zone 3", "Reporter");
      expect(newAlert.respondent.name).toBe("Maria Dela Cruz");
    });

    it("uses fallback responder when no online user matches location", () => {
      const newAlert = system.addAlert("Flood", "Highway 7", "Reporter");
      expect(newAlert.respondent.name).toBe("Nearby responder");
    });

    it("prepends alert to the front of the array", () => {
      system.addAlert("Flood", "Zone 1", "First");
      system.addAlert("Fire", "Zone 2", "Second");
      expect(system.alerts[0].type).toBe("Fire");
      expect(system.alerts[1].type).toBe("Flood");
    });

    it("preserves reported-by information", () => {
      const newAlert = system.addAlert("Flood", "Zone 1", "John Doe");
      expect(newAlert.reportedBy).toBe("John Doe");
    });
  });

  describe("resolveAlert", () => {
    it("resolves an existing alert", () => {
      const alert = system.addAlert("Flood", "Zone 1", "Reporter");
      const result = system.resolveAlert(alert.id);
      expect(result).toBe(true);
      expect(alert.status).toBe("Resolved");
    });

    it("returns false for non-existent alert", () => {
      const result = system.resolveAlert("#A999");
      expect(result).toBe(false);
    });

    it("does not affect other alerts", () => {
      const alert1 = system.addAlert("Flood", "Zone 1", "R1");
      const alert2 = system.addAlert("Fire", "Zone 2", "R2");
      system.resolveAlert(alert1.id);
      expect(alert2.status).toBe("Active");
    });
  });

  describe("getActiveAlerts", () => {
    it("returns empty array when no alerts exist", () => {
      expect(system.getActiveAlerts()).toHaveLength(0);
    });

    it("returns only active alerts", () => {
      const alert1 = system.addAlert("Flood", "Zone 1", "R1");
      const alert2 = system.addAlert("Fire", "Zone 2", "R2");
      system.resolveAlert(alert1.id);
      const active = system.getActiveAlerts();
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(alert2.id);
    });
  });

  describe("getResolvedAlerts", () => {
    it("returns empty array when no alerts are resolved", () => {
      system.addAlert("Flood", "Zone 1", "R1");
      expect(system.getResolvedAlerts()).toHaveLength(0);
    });

    it("returns only resolved alerts", () => {
      const alert1 = system.addAlert("Flood", "Zone 1", "R1");
      system.addAlert("Fire", "Zone 2", "R2");
      system.resolveAlert(alert1.id);
      const resolved = system.getResolvedAlerts();
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe(alert1.id);
    });
  });

  describe("computeSummary", () => {
    it("returns zero counts when no alerts exist", () => {
      const summary = system.computeSummary();
      expect(summary.activeCount).toBe(0);
      expect(summary.resolvedCount).toBe(0);
      expect(summary.totalAlerts).toBe(0);
      expect(summary.avgMinutes).toBe(0);
    });

    it("counts active and resolved alerts correctly", () => {
      const alert1 = system.addAlert("Flood", "Zone 1", "R1");
      system.addAlert("Fire", "Zone 2", "R2");
      system.resolveAlert(alert1.id);
      const summary = system.computeSummary();
      expect(summary.activeCount).toBe(1);
      expect(summary.resolvedCount).toBe(1);
      expect(summary.totalAlerts).toBe(2);
    });

    it("computes average response time for resolved alerts", () => {
      const alert = system.addAlert("Flood", "Zone 1", "R1");
      // Simulate some time passing
      alert.timestamp = new Date(Date.now() - 120000); // 2 minutes ago
      system.resolveAlert(alert.id);
      const summary = system.computeSummary();
      expect(summary.avgMinutes).toBeGreaterThanOrEqual(1);
    });
  });
});

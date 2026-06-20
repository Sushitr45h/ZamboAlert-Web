import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDate,
  computeStats,
  dispatchAlert,
  resolveAlert,
  getUnassignedAlerts,
  INITIAL_ALERTS,
  RESCUERS,
  STATUS_COLOR,
  type SOSAlert,
} from "./utils";

describe("formatTime", () => {
  it("returns a time string in HH:MM:SS format", () => {
    const date = new Date("2024-06-15T14:30:45");
    const result = formatTime(date);
    expect(result).toContain("14");
    expect(result).toContain("30");
  });

  it("handles midnight correctly", () => {
    const date = new Date("2024-01-01T00:00:00");
    const result = formatTime(date);
    expect(result).toContain("00");
  });
});

describe("formatDate", () => {
  it("returns a formatted date string with weekday and date components", () => {
    const date = new Date("2024-06-15T14:30:00");
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });

  it("includes day of week abbreviation", () => {
    const date = new Date("2024-06-17T10:00:00"); // Monday
    const result = formatDate(date);
    expect(result).toContain("Mon");
  });
});

describe("computeStats", () => {
  it("computes active alerts as non-resolved count", () => {
    const stats = computeStats(INITIAL_ALERTS);
    expect(stats.active).toBe(2); // UNASSIGNED + ASSIGNED
  });

  it("computes unassigned count correctly", () => {
    const stats = computeStats(INITIAL_ALERTS);
    expect(stats.unassigned).toBe(1);
  });

  it("returns rescuers count from RESCUERS constant", () => {
    const stats = computeStats(INITIAL_ALERTS);
    expect(stats.rescuers).toBe(RESCUERS.length);
  });

  it("returns mesh nodes as 12", () => {
    const stats = computeStats(INITIAL_ALERTS);
    expect(stats.nodes).toBe(12);
  });

  it("handles empty alerts array", () => {
    const stats = computeStats([]);
    expect(stats.active).toBe(0);
    expect(stats.unassigned).toBe(0);
  });

  it("handles all resolved alerts", () => {
    const alerts: SOSAlert[] = [
      { id: "A-01", name: "Test", zone: "Z1", method: "GPS", status: "RESOLVED", battery: 100, time: "08:00" },
      { id: "A-02", name: "Test2", zone: "Z2", method: "BT-Mesh", status: "RESOLVED", battery: 80, time: "09:00" },
    ];
    const stats = computeStats(alerts);
    expect(stats.active).toBe(0);
    expect(stats.unassigned).toBe(0);
  });
});

describe("dispatchAlert", () => {
  it("assigns a rescuer to an unassigned alert", () => {
    const result = dispatchAlert(INITIAL_ALERTS, "A-03", "R-01");
    const updated = result.find((a) => a.id === "A-03");
    expect(updated?.status).toBe("ASSIGNED");
    expect(updated?.assignedTo).toBe("R-01");
  });

  it("does not modify other alerts", () => {
    const result = dispatchAlert(INITIAL_ALERTS, "A-03", "R-01");
    const other = result.find((a) => a.id === "A-07");
    expect(other?.status).toBe("ASSIGNED");
    expect(other?.assignedTo).toBe("R-02");
  });

  it("returns a new array (immutable)", () => {
    const result = dispatchAlert(INITIAL_ALERTS, "A-03", "R-01");
    expect(result).not.toBe(INITIAL_ALERTS);
  });

  it("handles non-existent alert ID gracefully", () => {
    const result = dispatchAlert(INITIAL_ALERTS, "NONEXISTENT", "R-01");
    expect(result).toEqual(INITIAL_ALERTS);
  });
});

describe("resolveAlert", () => {
  it("marks an alert as resolved", () => {
    const result = resolveAlert(INITIAL_ALERTS, "A-03");
    const updated = result.find((a) => a.id === "A-03");
    expect(updated?.status).toBe("RESOLVED");
  });

  it("does not modify other alerts", () => {
    const result = resolveAlert(INITIAL_ALERTS, "A-03");
    const other = result.find((a) => a.id === "A-12");
    expect(other?.status).toBe("RESOLVED");
  });

  it("returns a new array (immutable)", () => {
    const result = resolveAlert(INITIAL_ALERTS, "A-03");
    expect(result).not.toBe(INITIAL_ALERTS);
  });

  it("handles non-existent alert ID gracefully", () => {
    const result = resolveAlert(INITIAL_ALERTS, "NONEXISTENT");
    expect(result).toEqual(INITIAL_ALERTS);
  });

  it("can resolve an already assigned alert", () => {
    const result = resolveAlert(INITIAL_ALERTS, "A-07");
    const updated = result.find((a) => a.id === "A-07");
    expect(updated?.status).toBe("RESOLVED");
  });
});

describe("getUnassignedAlerts", () => {
  it("returns only unassigned alerts", () => {
    const result = getUnassignedAlerts(INITIAL_ALERTS);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("A-03");
  });

  it("returns empty array when no unassigned alerts exist", () => {
    const alerts: SOSAlert[] = [
      { id: "A-01", name: "Test", zone: "Z1", method: "GPS", status: "RESOLVED", battery: 100, time: "08:00" },
      { id: "A-02", name: "Test2", zone: "Z2", method: "BT-Mesh", status: "ASSIGNED", battery: 80, time: "09:00", assignedTo: "R-01" },
    ];
    const result = getUnassignedAlerts(alerts);
    expect(result).toHaveLength(0);
  });

  it("returns all alerts when all are unassigned", () => {
    const alerts: SOSAlert[] = [
      { id: "A-01", name: "Test", zone: "Z1", method: "GPS", status: "UNASSIGNED", battery: 100, time: "08:00" },
      { id: "A-02", name: "Test2", zone: "Z2", method: "BT-Mesh", status: "UNASSIGNED", battery: 80, time: "09:00" },
    ];
    const result = getUnassignedAlerts(alerts);
    expect(result).toHaveLength(2);
  });
});

describe("STATUS_COLOR", () => {
  it("has a color for all SOS statuses", () => {
    expect(STATUS_COLOR.UNASSIGNED).toBe("#dc2626");
    expect(STATUS_COLOR.ASSIGNED).toBe("#f97316");
    expect(STATUS_COLOR.RESOLVED).toBe("#38bdf8");
  });

  it("has a color for all rescuer statuses", () => {
    expect(STATUS_COLOR.AVAILABLE).toBe("#22c55e");
    expect(STATUS_COLOR["EN ROUTE"]).toBe("#f97316");
    expect(STATUS_COLOR["ON SCENE"]).toBe("#ef4444");
  });
});

describe("INITIAL_ALERTS data integrity", () => {
  it("contains 3 initial alerts", () => {
    expect(INITIAL_ALERTS).toHaveLength(3);
  });

  it("each alert has required fields", () => {
    INITIAL_ALERTS.forEach((alert) => {
      expect(alert.id).toBeDefined();
      expect(alert.name).toBeDefined();
      expect(alert.zone).toBeDefined();
      expect(alert.method).toBeDefined();
      expect(alert.status).toBeDefined();
      expect(alert.battery).toBeGreaterThanOrEqual(0);
      expect(alert.battery).toBeLessThanOrEqual(100);
      expect(alert.time).toBeDefined();
    });
  });

  it("has valid statuses", () => {
    const validStatuses = ["UNASSIGNED", "ASSIGNED", "RESOLVED"];
    INITIAL_ALERTS.forEach((alert) => {
      expect(validStatuses).toContain(alert.status);
    });
  });
});

describe("RESCUERS data integrity", () => {
  it("contains 3 rescuers", () => {
    expect(RESCUERS).toHaveLength(3);
  });

  it("each rescuer has required fields", () => {
    RESCUERS.forEach((rescuer) => {
      expect(rescuer.id).toBeDefined();
      expect(rescuer.name).toBeDefined();
      expect(rescuer.status).toBeDefined();
      expect(rescuer.unit).toBeDefined();
      expect(rescuer.lastPing).toBeDefined();
      expect(rescuer.battery).toBeGreaterThanOrEqual(0);
      expect(rescuer.battery).toBeLessThanOrEqual(100);
    });
  });

  it("has valid rescuer statuses", () => {
    const validStatuses = ["AVAILABLE", "EN ROUTE", "ON SCENE"];
    RESCUERS.forEach((rescuer) => {
      expect(validStatuses).toContain(rescuer.status);
    });
  });
});

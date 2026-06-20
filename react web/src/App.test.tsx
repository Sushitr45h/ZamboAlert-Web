import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

describe("App component", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText("ZamboAlert")).toBeDefined();
  });

  it("displays the brand subtitle", () => {
    render(<App />);
    expect(screen.getByText("Barangay SOS Monitoring")).toBeDefined();
  });

  it("shows GATEWAY ONLINE status", () => {
    render(<App />);
    expect(screen.getByText("GATEWAY ONLINE")).toBeDefined();
  });

  it("displays current time in the top bar", () => {
    render(<App />);
    const timeElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays stat cards with labels", () => {
    render(<App />);
    expect(screen.getAllByText("Active SOS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rescuers").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mesh Nodes").length).toBeGreaterThanOrEqual(1);
  });

  it("shows initial active SOS count of 2", () => {
    render(<App />);
    const twoElements = screen.getAllByText("2");
    expect(twoElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Tab navigation", () => {
  it("renders SOS Alerts tab content by default", () => {
    render(<App />);
    expect(screen.getAllByText("A-03").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Barangay San Roque").length).toBeGreaterThanOrEqual(1);
  });

  it("switches to Rescuers tab on click", async () => {
    render(<App />);
    // The tab is a TouchableOpacity which renders as a div with tabIndex
    // "Rescuers" appears both in stat cards and tab bar; target the tab (last one)
    const rescuersTexts = screen.getAllByText("Rescuers");
    const tabElement = rescuersTexts[rescuersTexts.length - 1].closest('[tabindex="0"]');
    if (tabElement) fireEvent.click(tabElement);
    await waitFor(() => {
      expect(screen.getByText("Alpha Team")).toBeDefined();
      expect(screen.getByText("Bravo Unit")).toBeDefined();
      expect(screen.getByText("Charlie")).toBeDefined();
    });
  });

  it("switches to Network tab on click", async () => {
    render(<App />);
    const networkText = screen.getByText("Network");
    const tabElement = networkText.closest('[tabindex="0"]');
    if (tabElement) fireEvent.click(tabElement);
    await waitFor(() => {
      expect(screen.getByText("Wi-Fi AP")).toBeDefined();
      expect(screen.getByText("BT Mesh")).toBeDefined();
      expect(screen.getByText("Internet")).toBeDefined();
    });
  });

  it("shows network status values after switching", async () => {
    render(<App />);
    const networkText = screen.getByText("Network");
    const tabElement = networkText.closest('[tabindex="0"]');
    if (tabElement) fireEvent.click(tabElement);
    await waitFor(() => {
      expect(screen.getByText("ACTIVE")).toBeDefined();
      expect(screen.getByText("12 NODES")).toBeDefined();
      expect(screen.getByText("BLACKOUT")).toBeDefined();
    });
  });
});

describe("Alerts display", () => {
  it("shows alert IDs in the list", () => {
    render(<App />);
    expect(screen.getAllByText("A-03").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("A-07").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("A-12").length).toBeGreaterThanOrEqual(1);
  });

  it("shows alert zones", () => {
    render(<App />);
    expect(screen.getAllByText(/Zone \d/).length).toBeGreaterThan(0);
  });

  it("shows status badges for alerts", () => {
    render(<App />);
    expect(screen.getAllByText("UNASSIGNED").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ASSIGNED").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("RESOLVED").length).toBeGreaterThanOrEqual(1);
  });
});

describe("Quick Actions", () => {
  it("renders quick action buttons", () => {
    render(<App />);
    expect(screen.getAllByText("Broadcast Alert").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Dispatch Next SOS")).toBeDefined();
    expect(screen.getByText("Call Rescuer")).toBeDefined();
  });

  it("shows initial activity text", () => {
    render(<App />);
    expect(screen.getByText("Awaiting operator action.")).toBeDefined();
  });
});

describe("Unassigned SOS section", () => {
  it("shows unassigned alerts in the right pane", () => {
    render(<App />);
    expect(screen.getByText("Unassigned SOS")).toBeDefined();
  });

  it("renders dispatch button for unassigned alerts", () => {
    render(<App />);
    expect(screen.getAllByText("Dispatch").length).toBeGreaterThan(0);
  });
});

describe("Tactical Map section", () => {
  it("renders the map section header", () => {
    render(<App />);
    expect(screen.getByText("Tactical Map")).toBeDefined();
    expect(screen.getByText("LIVE")).toBeDefined();
  });

  it("shows map placeholder text", () => {
    render(<App />);
    expect(screen.getByText("Map overlay placeholder")).toBeDefined();
  });
});

describe("Status bar", () => {
  it("renders system status indicators", () => {
    render(<App />);
    expect(screen.getByText("SYSTEM NOMINAL")).toBeDefined();
    expect(screen.getByText("LOCAL AP MODE")).toBeDefined();
    expect(screen.getByText("BATTERY BACKUP ACTIVE")).toBeDefined();
  });
});

describe("Broadcast modal", () => {
  it("opens broadcast modal on button click", async () => {
    render(<App />);
    const broadcastBtns = screen.getAllByText("Broadcast Alert");
    fireEvent.click(broadcastBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Broadcast Announcement")).toBeDefined();
    });
  });

  it("has a Transmit button in the broadcast modal", async () => {
    render(<App />);
    const broadcastBtns = screen.getAllByText("Broadcast Alert");
    fireEvent.click(broadcastBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Transmit")).toBeDefined();
    });
  });

  it("has a Cancel button in the broadcast modal", async () => {
    render(<App />);
    const broadcastBtns = screen.getAllByText("Broadcast Alert");
    fireEvent.click(broadcastBtns[0]);
    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeDefined();
    });
  });
});

describe("Dispatch modal", () => {
  it("opens dispatch modal when Dispatch Next SOS is clicked", async () => {
    render(<App />);
    const dispatchNextBtn = screen.getByText("Dispatch Next SOS");
    fireEvent.click(dispatchNextBtn);
    await waitFor(() => {
      expect(screen.getByText("Dispatch Rescue Unit")).toBeDefined();
    });
  });

  it("shows rescue unit options in dispatch modal", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Dispatch Next SOS"));
    await waitFor(() => {
      expect(screen.getByText("Alpha Team")).toBeDefined();
      expect(screen.getByText("Bravo Unit")).toBeDefined();
      expect(screen.getByText("Charlie")).toBeDefined();
    });
  });

  it("shows Mark Resolved button in dispatch modal", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Dispatch Next SOS"));
    await waitFor(() => {
      expect(screen.getByText("Mark Resolved")).toBeDefined();
    });
  });

  it("shows Close button to dismiss dispatch modal", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Dispatch Next SOS"));
    await waitFor(() => {
      expect(screen.getByText("Close")).toBeDefined();
    });
  });
});

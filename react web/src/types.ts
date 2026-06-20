export type SOSStatus = "UNASSIGNED" | "ASSIGNED" | "RESOLVED";

export type SOSAlert = {
  id: string;
  name: string;
  zone: string;
  method: string;
  status: SOSStatus;
  battery: number;
  time: string;
  message?: string;
  assignedTo?: string;
};

export type Rescuer = {
  id: string;
  name: string;
  status: "AVAILABLE" | "EN ROUTE" | "ON SCENE";
  unit: string;
  lastPing: string;
  battery: number;
};

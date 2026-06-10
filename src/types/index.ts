export enum DeviceType {
  LIGHTING = "lighting",
  FAN = "fan",
  PUMP = "pump",
  FIRE = "fire",
  SENSOR = "sensor",
  CAMERA = "camera",
}

export enum DeviceStatus {
  RUNNING = "running",
  OFFLINE = "offline",
  FAULT = "fault",
  MAINTENANCE = "maintenance",
}

export enum AlertLevel {
  URGENT = "urgent",
  IMPORTANT = "important",
  NORMAL = "normal",
  INFO = "info",
}

export enum AlertStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DISPATCHED = "dispatched",
  PROCESSING = "processing",
  CLOSED = "closed",
}

export interface Tunnel {
  id: string;
  name: string;
  length: number;
  lanes: number;
  direction: string;
  district: string;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  type: DeviceType;
  tunnelId: string;
  tunnelName?: string;
  location: string;
  status: DeviceStatus;
  lastMaintenanceDate: string;
  params?: Record<string, number | string>;
  installedAt: string;
  position?: { x: number; y: number };
}

export interface DeviceMaintenanceRecord {
  id: string;
  deviceId: string;
  type: string;
  date: string;
  operator: string;
  description: string;
  result: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  tunnelId: string;
  tunnelName?: string;
  level: AlertLevel;
  title: string;
  content: string;
  status: AlertStatus;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
  confirmRemark?: string;
  dispatchedTo?: string;
  dispatchedAt?: string;
  closedAt?: string;
  relatedIncidentId?: string;
}

export interface Incident {
  id: string;
  code: string;
  alertId?: string;
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  status: "pending" | "in_progress" | "feedback" | "closed";
  phase: number;
  priority: AlertLevel;
  createdAt: string;
  timeline: IncidentTimelineItem[];
  feedbacks: IncidentFeedback[];
}

export interface IncidentTimelineItem {
  time: string;
  status: string;
  operator: string;
  remark?: string;
}

export interface IncidentFeedback {
  id: string;
  time: string;
  reporter: string;
  content: string;
  images?: string[];
}

export interface EnvironmentData {
  timestamp: string;
  tunnelId: string;
  co: number;
  visibility: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
}

export interface TrafficData {
  timestamp: string;
  tunnelId: string;
  flow: number;
  avgSpeed: number;
  occupancy: number;
  lane1Flow: number;
  lane2Flow: number;
  lane3Flow?: number;
}

export interface InspectionRoute {
  id: string;
  name: string;
  tunnelId: string;
  tunnelName?: string;
  checkPoints: { name: string; items: string[] }[];
}

export interface InspectionTask {
  id: string;
  code: string;
  routeId: string;
  routeName: string;
  inspector: string;
  scheduledDate: string;
  timeSlot: string;
  status: "pending" | "in_progress" | "completed" | "abnormal";
  progress: number;
  checkPoints: InspectionCheckPoint[];
  abnormalCount?: number;
}

export interface InspectionCheckPoint {
  name: string;
  items: { name: string; result: "normal" | "abnormal" | "na"; remark?: string }[];
}

export interface Camera {
  id: string;
  code: string;
  name: string;
  tunnelId: string;
  tunnelName?: string;
  location: string;
  group: string;
  online: boolean;
  previewUrl?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: "duty" | "maintenance" | "inspector";
  phone: string;
  team: string;
}

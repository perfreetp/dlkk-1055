import { create } from "zustand";
import {
  MOCK_ALERTS,
  MOCK_DEVICES,
  MOCK_TRAFFIC,
  MOCK_ENVIRONMENT,
  MOCK_INCIDENTS,
  MOCK_INSPECTION_TASKS,
  generateAlerts,
  getLatestTraffic,
  getLatestEnvironment,
} from "@/data/mockData";
import {
  Alert,
  AlertStatus,
  Device,
  DeviceStatus,
  EnvironmentData,
  Incident,
  InspectionTask,
  TrafficData,
} from "@/types";
import { randomBetween, pickRandom, formatDateTime } from "@/utils/format";
import { addSeconds } from "date-fns";

interface MonitorState {
  alerts: Alert[];
  devices: Device[];
  incidents: Incident[];
  inspectionTasks: InspectionTask[];
  latestTraffic: Record<string, TrafficData>;
  latestEnvironment: Record<string, EnvironmentData>;
  selectedTunnelId: string;
  alertTick: number;

  confirmAlert: (id: string, by: string, remark: string) => void;
  dispatchAlert: (id: string, to: string) => void;
  closeAlert: (id: string) => void;
  batchConfirmAlerts: (ids: string[], by: string) => void;
  setSelectedTunnel: (tunnelId: string) => void;
  createIncident: (data: Partial<Incident>) => void;
  updateIncidentPhase: (id: string) => void;
  addFeedback: (incidentId: string, reporter: string, content: string) => void;
  updateRandomData: () => void;
  maybeGenerateNewAlert: () => void;
}

export const useMonitorStore = create<MonitorState>((set, get) => {
  const initTraffic: Record<string, TrafficData> = {};
  const initEnv: Record<string, EnvironmentData> = {};
  Object.keys(MOCK_TRAFFIC).forEach((tid) => {
    initTraffic[tid] = getLatestTraffic(tid);
  });
  Object.keys(MOCK_ENVIRONMENT).forEach((tid) => {
    initEnv[tid] = getLatestEnvironment(tid);
  });
  initTraffic["all"] = getLatestTraffic();
  initEnv["all"] = getLatestEnvironment();

  return {
    alerts: MOCK_ALERTS,
    devices: MOCK_DEVICES,
    incidents: MOCK_INCIDENTS,
    inspectionTasks: MOCK_INSPECTION_TASKS,
    latestTraffic: initTraffic,
    latestEnvironment: initEnv,
    selectedTunnelId: "all",
    alertTick: 0,

    confirmAlert: (id, by, remark) =>
      set((s) => ({
        alerts: s.alerts.map((a) =>
          a.id === id
            ? {
                ...a,
                status: AlertStatus.CONFIRMED,
                confirmedAt: formatDateTime(new Date()),
                confirmedBy: by,
                confirmRemark: remark,
              }
            : a
        ),
      })),

    dispatchAlert: (id, to) =>
      set((s) => ({
        alerts: s.alerts.map((a) =>
          a.id === id
            ? {
                ...a,
                status: AlertStatus.DISPATCHED,
                dispatchedTo: to,
                dispatchedAt: formatDateTime(new Date()),
              }
            : a
        ),
      })),

    closeAlert: (id) =>
      set((s) => ({
        alerts: s.alerts.map((a) =>
          a.id === id
            ? { ...a, status: AlertStatus.CLOSED, closedAt: formatDateTime(new Date()) }
            : a
        ),
      })),

    batchConfirmAlerts: (ids, by) =>
      set((s) => ({
        alerts: s.alerts.map((a) =>
          ids.includes(a.id)
            ? {
                ...a,
                status: AlertStatus.CONFIRMED,
                confirmedAt: formatDateTime(new Date()),
                confirmedBy: by,
              }
            : a
        ),
      })),

    setSelectedTunnel: (tunnelId) => set({ selectedTunnelId: tunnelId }),

    createIncident: (data) =>
      set((s) => ({
        incidents: [
          {
            id: `inc-${Date.now()}`,
            code: data.code || `CZ-${Date.now()}`,
            title: data.title || "未命名处置单",
            description: data.description || "",
            assignee: data.assignee || "",
            deadline: data.deadline || formatDateTime(addSeconds(new Date(), 3600 * 4)),
            status: "pending",
            phase: 1,
            priority: data.priority || "normal",
            createdAt: formatDateTime(new Date()),
            timeline: [
              {
                time: formatDateTime(new Date()),
                status: "任务创建",
                operator: "系统",
              },
            ],
            feedbacks: [],
            ...data,
          } as Incident,
          ...s.incidents,
        ],
      })),

    updateIncidentPhase: (id) =>
      set((s) => ({
        incidents: s.incidents.map((inc) => {
          if (inc.id !== id) return inc;
          const nextPhase = Math.min(4, inc.phase + 1);
          const phases = ["任务创建", "现场到场", "问题处置", "验收闭环"];
          const nextStatus: Incident["status"] =
            nextPhase === 2
              ? "in_progress"
              : nextPhase === 3
              ? "feedback"
              : nextPhase === 4
              ? "closed"
              : "pending";
          return {
            ...inc,
            phase: nextPhase,
            status: nextStatus,
            timeline: [
              ...inc.timeline,
              {
                time: formatDateTime(new Date()),
                status: phases[nextPhase - 1],
                operator: inc.assignee,
              },
            ],
          };
        }),
      })),

    addFeedback: (incidentId, reporter, content) =>
      set((s) => ({
        incidents: s.incidents.map((inc) =>
          inc.id === incidentId
            ? {
                ...inc,
                feedbacks: [
                  ...inc.feedbacks,
                  {
                    id: `fb-${Date.now()}`,
                    time: formatDateTime(new Date()),
                    reporter,
                    content,
                  },
                ],
              }
            : inc
        ),
      })),

    updateRandomData: () =>
      set((s) => {
        const newTraffic = { ...s.latestTraffic };
        const newEnv = { ...s.latestEnvironment };
        const newDevices = s.devices.map((d) => ({ ...d }));

        Object.keys(newTraffic).forEach((tid) => {
          const prev = newTraffic[tid];
          const deltaF = tid === "all" ? randomBetween(-200, 200) : randomBetween(-60, 60);
          newTraffic[tid] = {
            ...prev,
            timestamp: formatDateTime(new Date()),
            flow: Math.max(20, prev.flow + deltaF),
            avgSpeed: Math.max(30, Math.min(110, prev.avgSpeed + randomBetween(-3, 3))),
            occupancy: Math.max(2, Math.min(98, prev.occupancy + randomBetween(-3, 3))),
            lane1Flow: Math.max(10, prev.lane1Flow + Math.round(deltaF / 3)),
            lane2Flow: Math.max(10, prev.lane2Flow + Math.round(deltaF / 3)),
            lane3Flow: prev.lane3Flow ? Math.max(5, prev.lane3Flow + Math.round(deltaF / 3)) : undefined,
          };
        });

        Object.keys(newEnv).forEach((tid) => {
          const prev = newEnv[tid];
          newEnv[tid] = {
            ...prev,
            timestamp: formatDateTime(new Date()),
            co: Math.max(5, Math.min(200, prev.co + randomBetween(-4, 4, 1))),
            visibility: Math.max(30, Math.min(800, prev.visibility + randomBetween(-20, 20))),
            temperature: Math.max(5, Math.min(45, prev.temperature + randomBetween(-0.5, 0.5, 1))),
            humidity: Math.max(15, Math.min(95, prev.humidity + randomBetween(-2, 2, 1))),
            windSpeed: Math.max(0, prev.windSpeed + randomBetween(-0.1, 0.1, 2)),
          };
        });

        if (Math.random() < 0.15) {
          const idx = Math.floor(Math.random() * newDevices.length);
          const d = newDevices[idx];
          if (d.status === DeviceStatus.RUNNING && Math.random() < 0.1) {
            d.status = Math.random() < 0.5 ? DeviceStatus.FAULT : DeviceStatus.OFFLINE;
          } else if ((d.status === DeviceStatus.FAULT || d.status === DeviceStatus.OFFLINE) && Math.random() < 0.3) {
            d.status = DeviceStatus.RUNNING;
          }
        }

        return {
          latestTraffic: newTraffic,
          latestEnvironment: newEnv,
          devices: newDevices,
        };
      }),

    maybeGenerateNewAlert: () =>
      set((s) => {
        if (Math.random() > 0.4) return { alertTick: s.alertTick + 1 };
        const newOnes = generateAlerts(1);
        const na = newOnes.map((a) => ({
          ...a,
          createdAt: formatDateTime(new Date()),
        }));
        return {
          alerts: [...na, ...s.alerts].slice(0, 200),
          alertTick: s.alertTick + 1,
        };
      }),
  };
});

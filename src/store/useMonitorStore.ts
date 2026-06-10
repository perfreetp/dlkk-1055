import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MOCK_ALERTS,
  MOCK_DEVICES,
  MOCK_TRAFFIC,
  MOCK_ENVIRONMENT,
  MOCK_INCIDENTS,
  MOCK_INSPECTION_TASKS,
  MOCK_MAINTENANCE_RECORDS,
  generateAlerts,
  getLatestTraffic,
  getLatestEnvironment,
} from "@/data/mockData";
import {
  Alert,
  AlertProcessRecord,
  AlertStatus,
  Device,
  DeviceMaintenanceRecord,
  DeviceStatus,
  EnvironmentData,
  Incident,
  IncidentTimelineItem,
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
  maintenanceRecords: DeviceMaintenanceRecord[];
  latestTraffic: Record<string, TrafficData>;
  latestEnvironment: Record<string, EnvironmentData>;
  selectedTunnelId: string;
  alertTick: number;

  confirmAlert: (id: string, by: string, remark: string) => void;
  dispatchAlert: (id: string, to: string) => void;
  closeAlert: (id: string) => void;
  batchConfirmAlerts: (ids: string[], by: string) => void;
  setSelectedTunnel: (tunnelId: string) => void;
  createIncident: (data: Partial<Incident> & { alertId?: string }) => Incident | undefined;
  updateIncidentPhase: (id: string) => void;
  addFeedback: (incidentId: string, reporter: string, content: string) => void;
  createMaintenanceRecord: (record: Omit<DeviceMaintenanceRecord, "id">) => void;
  addInspectionTask: (task: Omit<InspectionTask, "id" | "code">) => void;
  updateInspectionTask: (id: string, patch: Partial<InspectionTask>) => void;
  updateRandomData: () => void;
  maybeGenerateNewAlert: () => void;
}

function initializeStoreData() {
  const initAlerts = [...MOCK_ALERTS];
  const initIncidents = MOCK_INCIDENTS.map((inc) => {
    const updatedTimeline = [...inc.timeline];
    if (updatedTimeline.length > 0 && !updatedTimeline[0].remark) {
      updatedTimeline[0] = {
        ...updatedTimeline[0],
        remark: inc.sourceType === "alert" ? "由告警自动生成处置单" : "手工登记处置单",
      };
    }
    return { ...inc, timeline: updatedTimeline };
  });

  initIncidents.forEach((inc) => {
    if (inc.sourceType === "alert" && inc.alertId) {
      const alertIndex = initAlerts.findIndex((a) => a.id === inc.alertId);
      if (alertIndex !== -1) {
        const alert = initAlerts[alertIndex];
        const updatedAlert = {
          ...alert,
          relatedIncidentId: inc.id,
        };
        if (inc.status === "closed" && alert.status !== AlertStatus.CLOSED) {
          updatedAlert.status = AlertStatus.CLOSED;
          updatedAlert.closedAt = inc.timeline[inc.timeline.length - 1]?.time || formatDateTime(new Date());
        }
        initAlerts[alertIndex] = updatedAlert;
      }
    }
  });

  return { alerts: initAlerts, incidents: initIncidents };
}

export const useMonitorStore = create<MonitorState>()(
  persist(
    (set, get) => {
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

      const { alerts: initAlerts, incidents: initIncidents } = initializeStoreData();

      return {
        alerts: initAlerts,
        devices: MOCK_DEVICES,
        incidents: initIncidents,
        inspectionTasks: MOCK_INSPECTION_TASKS,
        maintenanceRecords: MOCK_MAINTENANCE_RECORDS,
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
          set((s) => {
            const targetAlert = s.alerts.find((a) => a.id === id);
            const now = formatDateTime(new Date());
            const alertProcessRecord: AlertProcessRecord = {
              time: now,
              operator: "系统",
              content: "告警已闭环",
              type: "system",
            };
            const updatedAlerts = s.alerts.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: AlertStatus.CLOSED,
                    closedAt: now,
                    processRecords: [...(a.processRecords || []), alertProcessRecord],
                  }
                : a
            );
            let updatedIncidents = s.incidents;
            if (targetAlert?.relatedIncidentId) {
              const incidentTimelineItem: IncidentTimelineItem = {
                time: now,
                status: "验收闭环",
                operator: "系统",
                remark: "关联告警已闭环，自动同步关闭处置单",
              };
              updatedIncidents = s.incidents.map((inc) =>
                inc.id === targetAlert.relatedIncidentId
                  ? {
                      ...inc,
                      status: "closed" as const,
                      phase: 4,
                      timeline: [...inc.timeline, incidentTimelineItem],
                    }
                  : inc
              );
            }
            return {
              alerts: updatedAlerts,
              incidents: updatedIncidents,
            };
          }),

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

        createIncident: (data) => {
          const relatedAlert = data.alertId
            ? get().alerts.find((a) => a.id === data.alertId)
            : undefined;
          const sourceType: Incident["sourceType"] = data.alertId ? "alert" : "manual";

          const newIncident: Incident = {
            id: `inc-${Date.now()}`,
            code: data.code || `CZ-${Date.now()}`,
            alertId: data.alertId,
            tunnelId: data.tunnelId || relatedAlert?.tunnelId,
            tunnelName: data.tunnelName || relatedAlert?.tunnelName,
            deviceId: data.deviceId || relatedAlert?.deviceId,
            deviceName: data.deviceName || relatedAlert?.deviceName,
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
                remark: data.alertId ? "由告警自动生成处置单" : "手工登记处置单",
              },
            ],
            feedbacks: [],
            ...data,
            sourceType,
          } as Incident;

          set((s) => {
            const updatedAlerts = data.alertId
              ? s.alerts.map((a) =>
                  a.id === data.alertId
                    ? {
                        ...a,
                        status: AlertStatus.PROCESSING,
                        relatedIncidentId: newIncident.id,
                        dispatchedTo: newIncident.assignee,
                        dispatchedAt: formatDateTime(new Date()),
                      }
                    : a
                )
              : s.alerts;

            return {
              incidents: [newIncident, ...s.incidents],
              alerts: updatedAlerts,
            };
          });

          return newIncident;
        },

        updateIncidentPhase: (id) =>
          set((s) => {
            const target = s.incidents.find((i) => i.id === id);
            const nextPhase = target ? Math.min(4, target.phase + 1) : 4;
            const phases = ["任务创建", "现场到场", "问题处置", "验收闭环"];
            const nextStatus: Incident["status"] =
              nextPhase === 2
                ? "in_progress"
                : nextPhase === 3
                ? "feedback"
                : nextPhase === 4
                ? "closed"
                : "pending";
            const now = formatDateTime(new Date());

            const updatedIncidents = s.incidents.map((inc) => {
              if (inc.id !== id) return inc;
              return {
                ...inc,
                phase: nextPhase,
                status: nextStatus,
                timeline: [
                  ...inc.timeline,
                  {
                    time: now,
                    status: phases[nextPhase - 1],
                    operator: inc.assignee,
                  },
                ],
              };
            });

            let updatedAlerts = s.alerts;
            if (nextPhase === 4 && target?.alertId) {
              const alertProcessRecord: AlertProcessRecord = {
                time: now,
                operator: "系统",
                content: "关联处置单已闭环，自动同步关闭告警",
                type: "system",
              };
              updatedAlerts = s.alerts.map((a) =>
                a.id === target.alertId
                  ? {
                      ...a,
                      status: AlertStatus.CLOSED,
                      closedAt: now,
                      processRecords: [...(a.processRecords || []), alertProcessRecord],
                    }
                  : a
              );
            }

            return {
              incidents: updatedIncidents,
              alerts: updatedAlerts,
            };
          }),

        addFeedback: (incidentId, reporter, content) =>
          set((s) => {
            const now = formatDateTime(new Date());
            const targetIncident = s.incidents.find((i) => i.id === incidentId);
            const updatedIncidents = s.incidents.map((inc) =>
              inc.id === incidentId
                ? {
                    ...inc,
                    feedbacks: [
                      ...inc.feedbacks,
                      {
                        id: `fb-${Date.now()}`,
                        time: now,
                        reporter,
                        content,
                      },
                    ],
                  }
                : inc
            );

            let updatedAlerts = s.alerts;
            if (targetIncident?.alertId) {
              const alertProcessRecord: AlertProcessRecord = {
                time: now,
                operator: reporter,
                content: content,
                type: "feedback",
              };
              updatedAlerts = s.alerts.map((a) =>
                a.id === targetIncident.alertId
                  ? {
                      ...a,
                      processRecords: [...(a.processRecords || []), alertProcessRecord],
                    }
                  : a
              );
            }

            return {
              incidents: updatedIncidents,
              alerts: updatedAlerts,
            };
          }),

        createMaintenanceRecord: (record) =>
          set((s) => ({
            maintenanceRecords: [
              {
                ...record,
                id: `mr-${Date.now()}`,
              },
              ...s.maintenanceRecords,
            ],
          })),

        addInspectionTask: (task) =>
          set((s) => ({
            inspectionTasks: [
              {
                ...task,
                id: `ins-${Date.now()}`,
                code: `XJ-${Date.now()}`,
              },
              ...s.inspectionTasks,
            ],
          })),

        updateInspectionTask: (id, patch) =>
          set((s) => ({
            inspectionTasks: s.inspectionTasks.map((t) =>
              t.id === id ? { ...t, ...patch } : t
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
    },
    {
      name: "tunnel-monitor-store",
      partialize: (state) => ({
        incidents: state.incidents,
        alerts: state.alerts,
        maintenanceRecords: state.maintenanceRecords,
        inspectionTasks: state.inspectionTasks,
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<MonitorState>;
        return {
          ...currentState,
          incidents: p.incidents && p.incidents.length > 0 ? p.incidents : currentState.incidents,
          alerts: p.alerts && p.alerts.length > 0 ? p.alerts : currentState.alerts,
          maintenanceRecords:
            p.maintenanceRecords && p.maintenanceRecords.length > 0
              ? p.maintenanceRecords
              : currentState.maintenanceRecords,
          inspectionTasks:
            p.inspectionTasks && p.inspectionTasks.length > 0
              ? p.inspectionTasks
              : currentState.inspectionTasks,
        };
      },
    }
  )
);

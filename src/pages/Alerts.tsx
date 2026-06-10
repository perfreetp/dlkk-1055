import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCheck,
  Send,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  User,
  MapPin,
  Tag,
  History,
  MessageSquare,
  CheckCircle,
  CircleDot,
  FileText,
  Trash2,
  Eye,
  Bell,
  BellOff,
  RefreshCw,
  Download,
  Settings,
  FileWarning,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_TUNNELS, MOCK_STAFF, MOCK_DEVICES } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import StatusBadge from "@/components/common/StatusBadge";
import { DonutChart, BarChart } from "@/components/charts/Charts";
import {
  Alert,
  AlertLevel,
  AlertStatus,
  DeviceType,
  IncidentTimelineItem,
} from "@/types";
import {
  cn,
  AlertLevelConfig,
  AlertStatusConfig,
  DeviceTypeConfig,
  formatDateTime,
  timeAgo,
} from "@/utils/format";

const Alerts: React.FC = () => {
  const {
    alerts,
    selectedTunnelId,
    setSelectedTunnel,
    confirmAlert,
    dispatchAlert,
    closeAlert,
    batchConfirmAlerts,
    createIncident,
    incidents,
  } = useMonitorStore();

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    level: "all" as AlertLevel | "all",
    status: "all" as AlertStatus | "all",
    deviceType: "all" as DeviceType | "all",
    keyword: "",
    dateRange: "all" as "all" | "today" | "yesterday" | "week" | "month",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [confirmRemark, setConfirmRemark] = useState("");
  const [dispatchTarget, setDispatchTarget] = useState("");
  const [currentUser] = useState("周监控");
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: AlertLevel.NORMAL as AlertLevel,
    deadline: "",
  });

  const deviceTypeMap = useMemo(() => {
    const map: Record<string, DeviceType> = {};
    MOCK_DEVICES.forEach((d) => {
      map[d.id] = d.type;
    });
    return map;
  }, []);

  const deviceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    MOCK_DEVICES.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, []);

  const getDeviceType = (deviceId: string): DeviceType => {
    return deviceTypeMap[deviceId] || DeviceType.SENSOR;
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedTunnelId !== "all" && a.tunnelId !== selectedTunnelId) return false;
      if (filters.level !== "all" && a.level !== filters.level) return false;
      if (filters.status !== "all" && a.status !== filters.status) return false;
      if (filters.deviceType !== "all") {
        if (getDeviceType(a.deviceId) !== filters.deviceType) return false;
      }
      if (filters.keyword) {
        const q = filters.keyword.toLowerCase();
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.content.toLowerCase().includes(q) &&
          !a.deviceName.toLowerCase().includes(q) &&
          !(a.tunnelName || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filters.dateRange !== "all") {
        const now = new Date();
        const created = new Date(a.createdAt);
        const diffDays =
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.dateRange === "today" && diffDays > 1) return false;
        if (filters.dateRange === "yesterday" && (diffDays <= 1 || diffDays > 2))
          return false;
        if (filters.dateRange === "week" && diffDays > 7) return false;
        if (filters.dateRange === "month" && diffDays > 30) return false;
      }
      return true;
    });
  }, [alerts, selectedTunnelId, filters, deviceTypeMap]);

  const stats = useMemo(() => {
    const counts = {
      urgent: 0,
      important: 0,
      normal: 0,
      info: 0,
      pending: 0,
      confirmed: 0,
      dispatched: 0,
      processing: 0,
      closed: 0,
      today: 0,
    };
    const today = new Date().toDateString();
    filteredAlerts.forEach((a) => {
      if (new Date(a.createdAt).toDateString() === today) counts.today++;
      if (a.level === AlertLevel.URGENT) counts.urgent++;
      else if (a.level === AlertLevel.IMPORTANT) counts.important++;
      else if (a.level === AlertLevel.NORMAL) counts.normal++;
      else counts.info++;

      if (a.status === AlertStatus.PENDING) counts.pending++;
      else if (a.status === AlertStatus.CONFIRMED) counts.confirmed++;
      else if (a.status === AlertStatus.DISPATCHED) counts.dispatched++;
      else if (a.status === AlertStatus.PROCESSING) counts.processing++;
      else counts.closed++;
    });
    return counts;
  }, [filteredAlerts]);

  const trendData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const h = new Date();
      h.setHours(h.getHours() - (23 - i));
      return `${h.getHours().toString().padStart(2, "0")}:00`;
    });
    const urgents = new Array(24).fill(0);
    const importants = new Array(24).fill(0);
    const normals = new Array(24).fill(0);
    alerts.forEach((a) => {
      const h = new Date(a.createdAt).getHours();
      const now = new Date().getHours();
      const idx = (h - now + 24) % 24;
      if (idx >= 0 && idx < 24) {
        if (a.level === AlertLevel.URGENT) urgents[idx]++;
        else if (a.level === AlertLevel.IMPORTANT) importants[idx]++;
        else if (a.level === AlertLevel.NORMAL) normals[idx]++;
      }
    });
    return { hours, urgents, importants, normals };
  }, [alerts]);

  const similarAlerts = useMemo(() => {
    if (!selectedAlert) return [];
    return alerts
      .filter(
        (a) =>
          a.id !== selectedAlert.id &&
          a.title === selectedAlert.title &&
          a.deviceId === selectedAlert.deviceId
      )
      .slice(0, 5);
  }, [selectedAlert, alerts]);

  const timelineItems = useMemo((): IncidentTimelineItem[] => {
    if (!selectedAlert) return [];
    const items: IncidentTimelineItem[] = [];
    items.push({
      time: selectedAlert.createdAt,
      status: "告警产生",
      operator: "系统自动检测",
      remark: selectedAlert.content,
    });
    if (selectedAlert.confirmedAt && selectedAlert.confirmedBy) {
      items.push({
        time: selectedAlert.confirmedAt,
        status: "告警确认",
        operator: selectedAlert.confirmedBy,
        remark: selectedAlert.confirmRemark,
      });
    }
    if (selectedAlert.dispatchedAt && selectedAlert.dispatchedTo) {
      items.push({
        time: selectedAlert.dispatchedAt,
        status: "任务转派",
        operator: selectedAlert.confirmedBy || currentUser,
        remark: `已转派给 ${selectedAlert.dispatchedTo} 进行现场处置`,
      });
    }
    if (selectedAlert.closedAt) {
      items.push({
        time: selectedAlert.closedAt,
        status: "告警闭环",
        operator: selectedAlert.dispatchedTo || "系统",
        remark: "问题已解决，告警已关闭",
      });
    }
    return items;
  }, [selectedAlert, currentUser]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAlerts.map((a) => a.id)));
    }
  };

  const handleConfirm = () => {
    if (!selectedAlert) return;
    confirmAlert(selectedAlert.id, currentUser, confirmRemark || "已确认告警");
    setShowConfirmModal(false);
    setConfirmRemark("");
    setSelectedAlert((prev) =>
      prev
        ? {
            ...prev,
            status: AlertStatus.CONFIRMED,
            confirmedAt: formatDateTime(new Date()),
            confirmedBy: currentUser,
            confirmRemark: confirmRemark || "已确认告警",
          }
        : null
    );
  };

  const handleBatchConfirm = () => {
    if (selectedIds.size === 0) return;
    batchConfirmAlerts(Array.from(selectedIds), currentUser);
    setSelectedIds(new Set());
  };

  const handleDispatch = () => {
    if (!selectedAlert || !dispatchTarget) return;
    dispatchAlert(selectedAlert.id, dispatchTarget);
    setShowDispatchModal(false);
    setDispatchTarget("");
    setSelectedAlert((prev) =>
      prev
        ? {
            ...prev,
            status: AlertStatus.DISPATCHED,
            dispatchedTo: dispatchTarget,
            dispatchedAt: formatDateTime(new Date()),
          }
        : null
    );
  };

  const handleClose = () => {
    if (!selectedAlert) return;
    closeAlert(selectedAlert.id);
    setSelectedAlert((prev) =>
      prev
        ? {
            ...prev,
            status: AlertStatus.CLOSED,
            closedAt: formatDateTime(new Date()),
          }
        : null
    );
  };

  const handleRowClose = (id: string) => {
    closeAlert(id);
    setSelectedAlert((prev) =>
      prev && prev.id === id
        ? { ...prev, status: AlertStatus.CLOSED, closedAt: formatDateTime(new Date()) }
        : prev
    );
  };

  const handleOpenIncidentModal = () => {
    if (!selectedAlert) return;
    setIncidentForm({
      title: selectedAlert.title,
      description: `【告警来源】${selectedAlert.content}\n【设备】${selectedAlert.deviceName}\n【隧道】${selectedAlert.tunnelName}`,
      assignee: "",
      priority: selectedAlert.level,
      deadline: "",
    });
    setShowIncidentModal(true);
  };

  const handleCreateIncident = () => {
    if (!selectedAlert || !incidentForm.title || !incidentForm.assignee) return;
    const newInc = createIncident({
      title: incidentForm.title,
      description: incidentForm.description,
      assignee: incidentForm.assignee,
      priority: incidentForm.priority,
      deadline: incidentForm.deadline || undefined,
      alertId: selectedAlert.id,
    });
    setShowIncidentModal(false);
    setIncidentForm({
      title: "",
      description: "",
      assignee: "",
      priority: AlertLevel.NORMAL,
      deadline: "",
    });
    if (newInc) {
      setSelectedAlert((prev) =>
        prev
          ? {
              ...prev,
              status: AlertStatus.PROCESSING,
              relatedIncidentId: newInc.id,
              dispatchedTo: newInc.assignee,
              dispatchedAt: formatDateTime(new Date()),
            }
          : null
      );
    }
  };

  const relatedIncident = useMemo(() => {
    if (!selectedAlert?.relatedIncidentId) return null;
    return incidents.find((i) => i.id === selectedAlert.relatedIncidentId);
  }, [selectedAlert, incidents]);

  const resetFilters = () => {
    setFilters({
      level: "all",
      status: "all",
      deviceType: "all",
      keyword: "",
      dateRange: "all",
    });
  };

  const maintenanceStaff = MOCK_STAFF.filter((s) => s.role !== "duty");

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-wider">
                告警中心
              </h1>
              <span className="text-xs text-text-muted px-2 py-0.5 border border-border rounded">
                ALERT CENTER
              </span>
            </div>
          </div>
          {stats.pending > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/15 border border-danger/40 text-danger text-xs alert-pulse">
              <Bell className="w-3.5 h-3.5" />
              待处理 {stats.pending} 条
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {MOCK_TUNNELS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTunnel(t.id)}
              className={cn(
                "px-3 py-1.5 text-xs rounded border transition-all",
                selectedTunnelId === t.id
                  ? "bg-accent/15 border-accent/50 text-accent shadow-glow-sm"
                  : "bg-bg-card border-border text-text-secondary hover:border-border-light hover:text-text-primary"
              )}
            >
              {t.name.slice(0, 6)}
            </button>
          ))}
          <button
            onClick={() => setSelectedTunnel("all")}
            className={cn(
              "px-3 py-1.5 text-xs rounded border transition-all font-semibold",
              selectedTunnelId === "all"
                ? "bg-accent text-bg-primary border-accent shadow-glow-sm"
                : "bg-bg-card border-border text-text-secondary hover:border-border-light hover:text-text-primary"
            )}
          >
            全部隧道
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            导出
          </button>
          <button className="btn btn-secondary">
            <Settings className="w-4 h-4" />
            规则配置
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-9 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-6 gap-3 shrink-0">
            <Card corner className="col-span-2" accent>
              <div className="flex items-center justify-between h-full">
                <div>
                  <div className="text-xs text-text-secondary mb-1">今日告警</div>
                  <div className="font-display text-3xl font-bold text-accent">
                    {stats.today}
                    <span className="text-sm font-normal text-text-muted ml-1">条</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-1">
                    较昨日 +{Math.round(stats.today * 0.12)} 条
                  </div>
                </div>
                <div className="w-24 h-24">
                  <DonutChart
                    data={[
                      { name: "紧急", value: stats.urgent, color: "#FF3B3B" },
                      { name: "重要", value: stats.important, color: "#FF7A00" },
                      { name: "一般", value: stats.normal, color: "#FFD600" },
                      { name: "提示", value: stats.info, color: "#8FA4C7" },
                    ]}
                    height={96}
                    centerValue={filteredAlerts.length}
                    centerLabel="告警总数"
                  />
                </div>
              </div>
            </Card>

            {[
              {
                l: AlertLevel.URGENT,
                v: stats.urgent,
                sub: "待处理",
                subV: filteredAlerts.filter(
                  (a) => a.level === AlertLevel.URGENT && a.status === AlertStatus.PENDING
                ).length,
              },
              {
                l: AlertLevel.IMPORTANT,
                v: stats.important,
                sub: "待处理",
                subV: filteredAlerts.filter(
                  (a) => a.level === AlertLevel.IMPORTANT && a.status === AlertStatus.PENDING
                ).length,
              },
              {
                l: AlertLevel.NORMAL,
                v: stats.normal,
                sub: "待处理",
                subV: filteredAlerts.filter(
                  (a) => a.level === AlertLevel.NORMAL && a.status === AlertStatus.PENDING
                ).length,
              },
              {
                l: AlertLevel.INFO,
                v: stats.info,
                sub: "待处理",
                subV: filteredAlerts.filter(
                  (a) => a.level === AlertLevel.INFO && a.status === AlertStatus.PENDING
                ).length,
              },
            ].map(({ l, v, sub, subV }) => {
              const cfg = AlertLevelConfig[l];
              return (
                <div
                  key={l}
                  className="card p-3 rounded-lg relative overflow-hidden"
                  style={{ borderColor: cfg.color + "50" }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: cfg.color }}
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: cfg.color + "20" }}
                    >
                      <AlertTriangle
                        className="w-3.5 h-3.5"
                        style={{ color: cfg.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}告警
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <DataNumber
                      value={v}
                      size="lg"
                      color={
                        l === AlertLevel.URGENT
                          ? "danger"
                          : l === AlertLevel.IMPORTANT
                          ? "warning"
                          : l === AlertLevel.NORMAL
                          ? "default"
                          : "default"
                      }
                    />
                    <div className="text-right">
                      <div className="text-[10px] text-text-muted">{sub}</div>
                      <div
                        className="font-number font-semibold text-sm"
                        style={{ color: subV > 0 ? cfg.color : "#5A7298" }}
                      >
                        {subV}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Card corner title="告警趋势（近24小时）" className="shrink-0 h-[200px]">
            <BarChart
              categories={trendData.hours.filter((_, i) => i % 2 === 0)}
              data={[
                {
                  name: "紧急",
                  values: trendData.urgents.filter((_, i) => i % 2 === 0),
                  color: "#FF3B3B",
                },
                {
                  name: "重要",
                  values: trendData.importants.filter((_, i) => i % 2 === 0),
                  color: "#FF7A00",
                },
                {
                  name: "一般",
                  values: trendData.normals.filter((_, i) => i % 2 === 0),
                  color: "#FFD600",
                },
              ]}
              height={150}
              yUnit="条"
            />
          </Card>

          <Card
            title={
              <div className="flex items-center gap-3">
                <span>告警列表</span>
                <span className="text-xs text-text-muted font-normal">
                  共 {filteredAlerts.length} 条
                </span>
                {selectedIds.size > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">
                    已选 {selectedIds.size} 条
                  </span>
                )}
              </div>
            }
            accent
            corner
            className="flex-1 min-h-0 flex flex-col"
            actions={
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <button
                      onClick={handleBatchConfirm}
                      className="btn btn-primary !py-1 text-xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      批量确认
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="btn btn-secondary !py-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      清除选择
                    </button>
                  </>
                )}
              </div>
            }
          >
            <div className="shrink-0 mb-3 p-3 rounded-lg bg-bg-elevated/40 border border-border/40">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="搜索告警标题、内容、设备..."
                    value={filters.keyword}
                    onChange={(e) =>
                      setFilters({ ...filters, keyword: e.target.value })
                    }
                    className="input pl-8 w-full text-sm"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-text-muted" />
                  <select
                    value={filters.level}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        level: e.target.value as AlertLevel | "all",
                      })
                    }
                    className="select text-sm w-24"
                  >
                    <option value="all">全部等级</option>
                    {Object.values(AlertLevel).map((l) => (
                      <option key={l} value={l}>
                        {AlertLevelConfig[l].label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        status: e.target.value as AlertStatus | "all",
                      })
                    }
                    className="select text-sm w-28"
                  >
                    <option value="all">全部状态</option>
                    {Object.values(AlertStatus).map((s) => (
                      <option key={s} value={s}>
                        {AlertStatusConfig[s].label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.deviceType}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        deviceType: e.target.value as DeviceType | "all",
                      })
                    }
                    className="select text-sm w-32"
                  >
                    <option value="all">设备类型</option>
                    {Object.values(DeviceType).map((t) => (
                      <option key={t} value={t}>
                        {DeviceTypeConfig[t].label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: e.target.value as any,
                      })
                    }
                    className="select text-sm w-28"
                  >
                    <option value="all">全部时间</option>
                    <option value="today">今天</option>
                    <option value="yesterday">昨天</option>
                    <option value="week">近一周</option>
                    <option value="month">近一月</option>
                  </select>
                  <button
                    onClick={resetFilters}
                    className="btn btn-secondary !py-1 text-xs"
                  >
                    重置
                  </button>
                </div>
              </div>
            </div>

            <div className="shrink-0 grid grid-cols-[40px_1fr_120px_100px_100px_110px_120px_160px_200px] gap-2 px-3 py-2 rounded-t bg-bg-elevated/50 border-b border-border/40 text-[11px] text-text-secondary font-medium">
              <div className="flex items-center justify-center">
                <button
                  onClick={selectAll}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    selectedIds.size === filteredAlerts.length && filteredAlerts.length > 0
                      ? "bg-accent border-accent"
                      : "border-border hover:border-accent"
                  )}
                >
                  {selectedIds.size === filteredAlerts.length &&
                    filteredAlerts.length > 0 && (
                      <CheckCheck className="w-3 h-3 text-bg-primary" />
                    )}
                </button>
              </div>
              <div>告警信息</div>
              <div>所属隧道</div>
              <div>设备类型</div>
              <div>告警等级</div>
              <div>处理状态</div>
              <div>责任人</div>
              <div>产生时间</div>
              <div className="text-center">操作</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredAlerts.map((a, idx) => {
                const levelCfg = AlertLevelConfig[a.level];
                const devType = getDeviceType(a.deviceId);
                const isSelected = selectedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className={cn(
                      "grid grid-cols-[40px_1fr_120px_100px_100px_110px_120px_160px_200px] gap-2 px-3 py-3 border-b border-border/20 items-center cursor-pointer transition-colors",
                      idx === 0 && "animate-slide-in-right",
                      isSelected
                        ? "bg-accent/8"
                        : "hover:bg-bg-elevated/50",
                      a.status === AlertStatus.PENDING && a.level === AlertLevel.URGENT &&
                        "bg-danger/5"
                    )}
                  >
                    <div
                      className="flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(a.id);
                      }}
                    >
                      <button
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-accent border-accent"
                            : "border-border hover:border-accent"
                        )}
                      >
                        {isSelected && (
                          <CheckCheck className="w-3 h-3 text-bg-primary" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg shrink-0 mt-0.5 flex items-center justify-center",
                          a.level === AlertLevel.URGENT && "alert-pulse"
                        )}
                        style={{ backgroundColor: levelCfg.color + "20" }}
                      >
                        <AlertTriangle
                          className="w-4 h-4"
                          style={{ color: levelCfg.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {a.title}
                          </span>
                          {a.status === AlertStatus.PENDING &&
                            a.level === AlertLevel.URGENT && (
                              <span className="text-[9px] px-1.5 py-px rounded bg-danger/20 text-danger animate-pulse">
                                紧急待处理
                              </span>
                            )}
                        </div>
                        <div className="text-[11px] text-text-muted truncate">
                          <Tag className="w-3 h-3 inline-block mr-1 -mt-0.5 opacity-60" />
                          {a.deviceName}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-text-secondary truncate">
                      {a.tunnelName}
                    </div>

                    <div className="text-xs text-text-secondary">
                      {DeviceTypeConfig[devType].label}
                    </div>

                    <div>
                      <StatusBadge type="alert" status={a.level} pulse />
                    </div>

                    <div>
                      <StatusBadge type="alert" status={a.status} />
                    </div>

                    <div className="text-xs">
                      {a.dispatchedTo ? (
                        <div className="flex items-center gap-1 text-text-secondary">
                          <User className="w-3 h-3 opacity-60" />
                          {a.dispatchedTo}
                        </div>
                      ) : a.confirmedBy ? (
                        <div className="flex items-center gap-1 text-text-muted/70">
                          <User className="w-3 h-3 opacity-60" />
                          {a.confirmedBy}
                        </div>
                      ) : (
                        <span className="text-text-muted/50">未分配</span>
                      )}
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center gap-1 text-text-secondary font-mono">
                        <Clock className="w-3 h-3 opacity-60" />
                        {timeAgo(a.createdAt)}
                      </div>
                      <div className="text-[10px] text-text-muted/70 mt-0.5 font-mono">
                        {a.createdAt.slice(5, 16)}
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedAlert(a)}
                        className="btn btn-secondary !py-1 !px-2 text-[11px]"
                        title="查看详情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {a.status === AlertStatus.PENDING && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAlert(a);
                              setShowConfirmModal(true);
                            }}
                            className="btn btn-primary !py-1 !px-2 text-[11px]"
                            title="确认告警"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAlert(a);
                              setShowDispatchModal(true);
                            }}
                            className="btn btn-secondary !py-1 !px-2 text-[11px]"
                            title="转派处置"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {a.status === AlertStatus.PROCESSING && (
                        <button
                          onClick={() => handleRowClose(a.id)}
                          className="btn btn-secondary !py-1 !px-2 text-[11px] text-success hover:text-success"
                          title="闭环告警"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredAlerts.length === 0 && (
                <div className="py-20 text-center text-text-muted">
                  <BellOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <div className="text-sm">暂无符合条件的告警</div>
                  <button
                    onClick={resetFilters}
                    className="mt-3 text-xs text-accent hover:text-accent-dark"
                  >
                    清除筛选条件
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          <Card title="状态统计" corner className="shrink-0">
            <div className="space-y-2.5">
              {Object.values(AlertStatus).map((s) => {
                const cfg = AlertStatusConfig[s];
                const count = (stats as any)[s] || 0;
                const total = filteredAlerts.length || 1;
                const pct = ((count / total) * 100).toFixed(1);
                return (
                  <div key={s} className="group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-number text-text-primary font-semibold">
                          {count}
                        </span>
                        <span className="font-number text-text-muted text-[10px]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cfg.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-accent" />
                <span>最近动态</span>
              </div>
            }
            corner
            className="flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {alerts.slice(0, 10).map((a, idx) => {
                const cfg = AlertLevelConfig[a.level];
                return (
                  <div
                    key={a.id}
                    className="flex gap-2.5 group cursor-pointer"
                    onClick={() => setSelectedAlert(a)}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cfg.color + "20" }}
                      >
                        <CircleDot
                          className="w-3 h-3"
                          style={{ color: cfg.color }}
                        />
                      </div>
                      {idx < 9 && (
                        <div className="w-px flex-1 min-h-[24px] bg-border/40 group-last:hidden" />
                      )}
                    </div>
                    <div className="flex-1 pb-3 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1.5 py-px rounded"
                              style={{ backgroundColor: cfg.color + "20", color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {timeAgo(a.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-text-primary font-medium truncate group-hover:text-accent transition-colors">
                        {a.title}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 truncate">
                        {a.tunnelName} · {a.deviceName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {selectedAlert && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSelectedAlert(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-[560px] bg-bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
            <div className="p-4 border-b border-border/50 flex items-start justify-between shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge type="alert" status={selectedAlert.level} pulse />
                  <StatusBadge type="alert" status={selectedAlert.status} />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {selectedAlert.title}
                </h2>
                <div className="text-xs text-text-muted mt-1 font-mono">
                  告警编号: ALT-{selectedAlert.id.slice(2, 10).toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:bg-danger/20 hover:text-danger transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-border/30">
                <div className="text-xs text-text-secondary mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  告警详情
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {selectedAlert.content}
                </p>
              </div>

              <div className="p-4 border-b border-border/30 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-text-muted mb-1">所属隧道</div>
                  <div className="text-xs text-text-primary flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-accent" />
                    {selectedAlert.tunnelName}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted mb-1">设备类型</div>
                  <div className="text-xs text-text-primary">
                    {DeviceTypeConfig[getDeviceType(selectedAlert.deviceId)].label}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted mb-1">关联设备</div>
                  <div className="text-xs text-text-primary flex items-center gap-1">
                    <Tag className="w-3 h-3 text-accent" />
                    {selectedAlert.deviceName}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted mb-1">产生时间</div>
                  <div className="text-xs text-text-primary font-mono">
                    {selectedAlert.createdAt}
                  </div>
                </div>
                {selectedAlert.confirmedBy && (
                  <div>
                    <div className="text-[10px] text-text-muted mb-1">确认人</div>
                    <div className="text-xs text-text-primary flex items-center gap-1">
                      <User className="w-3 h-3 text-accent" />
                      {selectedAlert.confirmedBy}
                    </div>
                  </div>
                )}
                {selectedAlert.confirmedAt && (
                  <div>
                    <div className="text-[10px] text-text-muted mb-1">确认时间</div>
                    <div className="text-xs text-text-primary font-mono">
                      {selectedAlert.confirmedAt}
                    </div>
                  </div>
                )}
                {selectedAlert.dispatchedTo && (
                  <div>
                    <div className="text-[10px] text-text-muted mb-1">处置人员</div>
                    <div className="text-xs text-text-primary flex items-center gap-1">
                      <User className="w-3 h-3 text-accent" />
                      {selectedAlert.dispatchedTo}
                    </div>
                  </div>
                )}
                {selectedAlert.closedAt && (
                  <div>
                    <div className="text-[10px] text-text-muted mb-1">闭环时间</div>
                    <div className="text-xs text-text-primary font-mono">
                      {selectedAlert.closedAt}
                    </div>
                  </div>
                )}
                {selectedAlert.confirmRemark && (
                  <div className="col-span-2">
                    <div className="text-[10px] text-text-muted mb-1">确认备注</div>
                    <div className="text-xs text-text-primary p-2 rounded bg-bg-elevated/50 border border-border/30">
                      {selectedAlert.confirmRemark}
                    </div>
                  </div>
                )}
              </div>

              {relatedIncident && (
                <div className="p-4 border-b border-border/30">
                  <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    关联处置单
                  </div>
                  <div className="p-3 rounded-lg bg-accent/8 border border-accent/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-number text-xs text-accent font-semibold">
                            {relatedIncident.code}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded border"
                            style={{
                              backgroundColor:
                                relatedIncident.status === "pending"
                                  ? "rgba(143,164,199,0.15)"
                                  : relatedIncident.status === "in_progress"
                                  ? "rgba(0,212,255,0.15)"
                                  : relatedIncident.status === "feedback"
                                  ? "rgba(255,122,0,0.15)"
                                  : "rgba(0,200,83,0.15)",
                              borderColor:
                                relatedIncident.status === "pending"
                                  ? "rgba(143,164,199,0.4)"
                                  : relatedIncident.status === "in_progress"
                                  ? "rgba(0,212,255,0.4)"
                                  : relatedIncident.status === "feedback"
                                  ? "rgba(255,122,0,0.4)"
                                  : "rgba(0,200,83,0.4)",
                              color:
                                relatedIncident.status === "pending"
                                  ? "#8FA4C7"
                                  : relatedIncident.status === "in_progress"
                                  ? "#00D4FF"
                                  : relatedIncident.status === "feedback"
                                  ? "#FF7A00"
                                  : "#00C853",
                            }}
                          >
                            {relatedIncident.status === "pending"
                              ? "待处理"
                              : relatedIncident.status === "in_progress"
                              ? "处置中"
                              : relatedIncident.status === "feedback"
                              ? "反馈中"
                              : "已闭环"}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-text-primary mb-1">
                          {relatedIncident.title}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-text-muted">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {relatedIncident.assignee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(relatedIncident.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <FileWarning className="w-5 h-5 text-accent mt-0.5" />
                        <button
                          onClick={() => {
                            console.log("打开处置单:", relatedIncident.id);
                            window.location.hash = "#/incidents";
                          }}
                          className="btn btn-secondary !py-1 !px-2.5 text-[11px] flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          打开处置单
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 border-b border-border/30">
                <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                  处置记录时间线
                  <span className="ml-auto text-[10px] text-text-muted">
                    共 {timelineItems.length} 条记录
                  </span>
                </div>
                <div className="space-y-0">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 relative">
                      <div className="flex flex-col items-center pt-1">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2",
                            idx === 0
                              ? "bg-danger/20 border-danger/40"
                              : idx === timelineItems.length - 1
                              ? "bg-success/20 border-success/40"
                              : "bg-accent/20 border-accent/40"
                          )}
                        >
                          {idx === 0 ? (
                            <Bell
                              className="w-3.5 h-3.5"
                              style={{ color: AlertLevelConfig[selectedAlert.level].color }}
                            />
                          ) : idx === timelineItems.length - 1 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <CircleDot
                              className="w-3.5 h-3.5"
                              style={{
                                color:
                                  idx === 1
                                    ? "#FFD600"
                                    : "#FF7A00",
                              }}
                            />
                          )}
                        </div>
                        {idx < timelineItems.length - 1 && (
                          <div className="w-px flex-1 min-h-[40px] bg-border/50 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-text-primary">
                            {item.status}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">
                            {item.time}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary flex items-center gap-1 mb-1">
                          <User className="w-3 h-3 opacity-60" />
                          {item.operator}
                        </div>
                        {item.remark && (
                          <div className="text-xs text-text-muted/90 p-2 rounded bg-bg-elevated/40 border border-border/30 mt-1.5">
                            {item.remark}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {similarAlerts.length > 0 && (
                <div className="p-4">
                  <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-accent" />
                    历史同类告警
                    <span className="ml-auto text-[10px] text-text-muted">
                      共 {similarAlerts.length} 条
                    </span>
                  </div>
                  <div className="space-y-2">
                    {similarAlerts.map((sa) => (
                      <div
                        key={sa.id}
                        onClick={() => setSelectedAlert(sa)}
                        className="p-2.5 rounded-md bg-bg-elevated/40 border border-border/30 hover:border-accent/40 hover:bg-accent/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge type="alert" status={sa.level} showDot={false} />
                          <StatusBadge type="alert" status={sa.status} showDot={false} />
                          <span className="ml-auto text-[10px] text-text-muted font-mono">
                            {timeAgo(sa.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary truncate">
                          {sa.tunnelName} · {sa.deviceName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/50 bg-bg-elevated/30 shrink-0">
              <div className="flex items-center gap-2">
                {(selectedAlert.status === AlertStatus.PENDING ||
                  selectedAlert.status === AlertStatus.CONFIRMED) &&
                  !selectedAlert.relatedIncidentId && (
                    <button
                      onClick={handleOpenIncidentModal}
                      className="btn btn-secondary flex-1"
                    >
                      <FileWarning className="w-4 h-4" />
                      生成处置单
                    </button>
                  )}
                {selectedAlert.status === AlertStatus.PENDING && (
                  <>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="btn btn-primary flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      确认告警
                    </button>
                    <button
                      onClick={() => setShowDispatchModal(true)}
                      className="btn btn-secondary flex-1"
                    >
                      <Send className="w-4 h-4" />
                      转派处置
                    </button>
                  </>
                )}
                {(selectedAlert.status === AlertStatus.CONFIRMED ||
                  selectedAlert.status === AlertStatus.DISPATCHED) && (
                  <>
                    <button
                      onClick={() => setShowDispatchModal(true)}
                      className="btn btn-secondary flex-1"
                    >
                      <Send className="w-4 h-4" />
                      转派
                    </button>
                    <button
                      onClick={handleClose}
                      className="btn btn-primary flex-1"
                    >
                      <CheckCheck className="w-4 h-4" />
                      闭环告警
                    </button>
                  </>
                )}
                {selectedAlert.status === AlertStatus.PROCESSING && (
                  <button
                    onClick={handleClose}
                    className="btn btn-primary flex-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    确认闭环
                  </button>
                )}
                {selectedAlert.status === AlertStatus.CLOSED && (
                  <div className="flex-1 text-center py-2 text-sm text-success flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    此告警已闭环
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showConfirmModal && selectedAlert && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-info" />
              </div>
              <div>
                <div className="text-base font-semibold text-text-primary">确认告警</div>
                <div className="text-[11px] text-text-muted">
                  确认人: {currentUser}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="p-3 rounded-md bg-bg-elevated/50 border border-border/30 mb-4">
                <div className="text-xs font-medium text-text-primary mb-1">
                  {selectedAlert.title}
                </div>
                <div className="text-[11px] text-text-muted">
                  {selectedAlert.tunnelName} · {selectedAlert.deviceName}
                </div>
              </div>
              <div className="mb-1 text-xs text-text-secondary">确认备注</div>
              <textarea
                value={confirmRemark}
                onChange={(e) => setConfirmRemark(e.target.value)}
                placeholder="请输入确认备注（可选）"
                rows={3}
                className="input w-full resize-none"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["已联系现场", "需现场检查", "持续观察", "转养护处理"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setConfirmRemark(r)}
                    className="px-2 py-1 text-[10px] rounded border border-border/50 text-text-secondary hover:border-accent/50 hover:text-accent transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border/50 flex items-center justify-end gap-2 bg-bg-elevated/30">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary"
              >
                <CheckCheck className="w-4 h-4" />
                确认提交
              </button>
            </div>
          </div>
        </>
      )}

      {showDispatchModal && selectedAlert && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowDispatchModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-warning" />
              </div>
              <div>
                <div className="text-base font-semibold text-text-primary">转派处置</div>
                <div className="text-[11px] text-text-muted">
                  选择现场处置人员
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="p-3 rounded-md bg-bg-elevated/50 border border-border/30 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge type="alert" status={selectedAlert.level} showDot={false} />
                  <span className="text-xs font-medium text-text-primary">
                    {selectedAlert.title}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted">
                  {selectedAlert.tunnelName} · {selectedAlert.deviceName}
                </div>
              </div>

              <div className="mb-2 text-xs text-text-secondary">选择处置人员</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {maintenanceStaff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setDispatchTarget(s.name)}
                    className={cn(
                      "p-3 rounded-md border text-left transition-all",
                      dispatchTarget === s.name
                        ? "bg-accent/10 border-accent/50"
                        : "bg-bg-elevated/30 border-border/40 hover:border-border-light"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium truncate",
                            dispatchTarget === s.name
                              ? "text-accent"
                              : "text-text-primary"
                          )}
                        >
                          {s.name}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {s.team} · {s.phone}
                        </div>
                      </div>
                      {dispatchTarget === s.name && (
                        <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px]">
                      <span className="px-1.5 py-px rounded bg-bg-elevated/80 text-text-secondary">
                        {s.role === "maintenance" ? "养护人员" : "巡检人员"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border/50 flex items-center justify-end gap-2 bg-bg-elevated/30">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleDispatch}
                disabled={!dispatchTarget}
                className={cn(
                  "btn",
                  dispatchTarget ? "btn-primary" : "opacity-50 cursor-not-allowed bg-bg-elevated text-text-muted border-border"
                )}
              >
                <Send className="w-4 h-4" />
                确认转派
              </button>
            </div>
          </div>
        </>
      )}

      {showIncidentModal && selectedAlert && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowIncidentModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <FileWarning className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-base font-semibold text-text-primary">
                    生成处置单
                  </div>
                  <div className="text-[11px] text-text-muted">
                    由告警自动创建，关联告警编号: ALT-{selectedAlert.id.slice(2, 10).toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:bg-danger/20 hover:text-danger transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-md bg-bg-elevated/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge type="alert" status={selectedAlert.level} showDot={false} />
                  <span className="text-xs font-medium text-text-primary">
                    {selectedAlert.title}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted">
                  {selectedAlert.tunnelName} · {selectedAlert.deviceName}
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  事件标题 <span className="text-danger">*</span>
                </label>
                <input
                  value={incidentForm.title}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, title: e.target.value })
                  }
                  placeholder="请输入事件标题"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  事件描述
                </label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, description: e.target.value })
                  }
                  placeholder="请详细描述事件情况、影响范围等"
                  rows={4}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    负责人 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={incidentForm.assignee}
                    onChange={(e) =>
                      setIncidentForm({ ...incidentForm, assignee: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  >
                    <option value="">请选择负责人</option>
                    {maintenanceStaff.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} - {s.team}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    优先级
                  </label>
                  <select
                    value={incidentForm.priority}
                    onChange={(e) =>
                      setIncidentForm({
                        ...incidentForm,
                        priority: e.target.value as AlertLevel,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  >
                    {Object.values(AlertLevel).map((l) => (
                      <option key={l} value={l}>
                        {AlertLevelConfig[l].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  处置期限
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={incidentForm.deadline}
                    onChange={(e) =>
                      setIncidentForm({ ...incidentForm, deadline: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-md bg-accent/8 border border-accent/30">
                <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                <div className="text-[11px] text-text-secondary">
                  创建处置单后，该告警将自动转为"处理中"状态，处置单将自动关联此告警。
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border/50 flex items-center justify-end gap-2 bg-bg-elevated/30 shrink-0">
              <button
                onClick={() => setShowIncidentModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreateIncident}
                disabled={!incidentForm.title || !incidentForm.assignee}
                className={cn(
                  "btn",
                  incidentForm.title && incidentForm.assignee
                    ? "btn-primary"
                    : "opacity-50 cursor-not-allowed bg-bg-elevated text-text-muted border-border"
                )}
              >
                <Plus className="w-4 h-4" />
                创建并关联处置单
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Alerts;

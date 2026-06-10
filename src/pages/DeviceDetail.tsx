import React, { useMemo, useState } from "react";
import {
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  Lightbulb,
  Fan,
  Droplets,
  Flame,
  Gauge,
  Camera,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  Plus,
  X,
  Send,
  Activity,
  Cpu,
  Layers,
  Hash,
  Info,
  Zap,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_MAINTENANCE_RECORDS } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import StatusBadge from "@/components/common/StatusBadge";
import { MiniTrend, TrendChart, GaugeChart } from "@/components/charts/Charts";
import {
  DeviceTypeConfig,
  cn,
  formatDate,
  formatDateTime,
  formatTime,
  timeAgo,
} from "@/utils/format";
import { DeviceStatus, DeviceType, DeviceMaintenanceRecord } from "@/types";

const TYPE_ICON: Record<DeviceType, React.ComponentType<any>> = {
  [DeviceType.LIGHTING]: Lightbulb,
  [DeviceType.FAN]: Fan,
  [DeviceType.PUMP]: Droplets,
  [DeviceType.FIRE]: Flame,
  [DeviceType.SENSOR]: Gauge,
  [DeviceType.CAMERA]: Camera,
};

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { devices, alerts } = useMonitorStore();

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    type: "定期巡检",
    operator: "",
    description: "",
    result: "",
  });
  const [localRecords, setLocalRecords] = useState<DeviceMaintenanceRecord[]>([]);

  const device = useMemo(() => devices.find((d) => d.id === id), [devices, id]);

  const deviceAlerts = useMemo(
    () => alerts.filter((a) => a.deviceId === id).slice(0, 5),
    [alerts, id]
  );

  const maintenanceRecords = useMemo(() => {
    const fromMock = MOCK_MAINTENANCE_RECORDS.filter((r) => r.deviceId === id);
    return [...localRecords, ...fromMock].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [id, localRecords]);

  const statusHistory = useMemo(() => {
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = 23; i >= 0; i--) {
      const t = new Date(Date.now() - i * 60 * 60 * 1000);
      arr.push({
        time: formatTime(t).slice(0, 5),
        values: {
          status:
            device?.status === DeviceStatus.RUNNING
              ? 100
              : device?.status === DeviceStatus.MAINTENANCE
              ? 60
              : device?.status === DeviceStatus.FAULT
              ? 20
              : 0,
        },
      });
    }
    return arr;
  }, [device?.status]);

  const paramTrends = useMemo(() => {
    if (!device?.params) return {};
    const trends: Record<string, number[]> = {};
    Object.keys(device.params).forEach((key) => {
      const base =
        typeof device.params![key] === "number"
          ? (device.params![key] as number)
          : parseFloat(String(device.params![key])) || 50;
      const arr: number[] = [];
      for (let i = 0; i < 12; i++) {
        arr.push(Number((base + (Math.random() - 0.5) * base * 0.1).toFixed(1)));
      }
      trends[key] = arr;
    });
    return trends;
  }, [device?.params]);

  if (!device) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-text-secondary mb-4">设备不存在或已被删除</div>
        <button onClick={() => nav("/devices")} className="btn btn-primary">
          <ArrowLeft className="w-4 h-4" />
          返回设备列表
        </button>
      </div>
    );
  }

  const cfg = DeviceTypeConfig[device.type];
  const Icon = TYPE_ICON[device.type];

  const handleSubmitMaintenance = () => {
    if (!newMaintenance.operator || !newMaintenance.description) return;
    const record: DeviceMaintenanceRecord = {
      id: `mr-local-${Date.now()}`,
      deviceId: device.id,
      type: newMaintenance.type,
      date: formatDateTime(new Date()),
      operator: newMaintenance.operator,
      description: newMaintenance.description,
      result: newMaintenance.result || "待进一步观察",
    };
    setLocalRecords([record, ...localRecords]);
    setNewMaintenance({ type: "定期巡检", operator: "", description: "", result: "" });
    setShowMaintenanceModal(false);
  };

  const paramGauges = useMemo(() => {
    if (!device.params) return [];
    const entries = Object.entries(device.params);
    return entries.slice(0, 4).map(([key, value]) => {
      const numVal =
        typeof value === "number" ? value : parseFloat(String(value)) || 0;
      const unitMatch = String(value).match(/[^\d.]+$/)?.[0] || "";
      const max =
        key.toLowerCase().includes("brightness") ||
        key.toLowerCase().includes("level")
          ? 100
          : key.toLowerCase().includes("speed") && !unitMatch.includes("rpm")
          ? 10
          : key.toLowerCase().includes("rpm")
          ? 2000
          : key.toLowerCase().includes("pressure")
          ? 2
          : key.toLowerCase().includes("current")
          ? 60
          : key.toLowerCase().includes("temperature")
          ? 50
          : key.toLowerCase().includes("power")
          ? 300
          : 100;
      return {
        key,
        label: key,
        value: numVal,
        max,
        unit: unitMatch,
        displayValue: value,
      };
    });
  }, [device.params]);

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav("/devices")}
            className="p-2 rounded border border-border bg-bg-card text-text-secondary hover:border-border-light hover:text-text-primary transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-accent/15 border border-accent/40 flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-xl text-text-primary tracking-wide">
                    {device.name}
                  </h1>
                  <StatusBadge
                    type="device"
                    status={device.status}
                    pulse={device.status === DeviceStatus.FAULT}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {device.code}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="btn btn-secondary"
          >
            <Wrench className="w-4 h-4" />
            发起维修
          </button>
          <button
            onClick={() => nav("/alerts")}
            className={cn(
              "btn",
              deviceAlerts.length > 0 ? "btn-danger alert-pulse" : "btn-secondary"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            查看告警 ({deviceAlerts.length})
          </button>
          <button
            onClick={() => nav("/devices")}
            className="btn btn-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        <div className="col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          <Card title="设备基本信息" corner>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                    <MapPin className="w-3 h-3" />
                    所属隧道
                  </div>
                  <div className="text-sm text-text-primary font-medium">
                    {device.tunnelName}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                    <Layers className="w-3 h-3" />
                    安装位置
                  </div>
                  <div className="text-sm text-text-primary font-medium">
                    {device.location}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                    <Calendar className="w-3 h-3" />
                    投运日期
                  </div>
                  <div className="text-sm text-text-primary font-medium">
                    {formatDate(device.installedAt)}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    {timeAgo(device.installedAt)}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                    <Wrench className="w-3 h-3" />
                    最近检修
                  </div>
                  <div className="text-sm text-text-primary font-medium">
                    {formatDate(device.lastMaintenanceDate)}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    {timeAgo(device.lastMaintenanceDate)}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded border border-border/40"
                   style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(18,31,56,1))" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    运行状态近24小时
                  </div>
                  <StatusBadge type="device" status={device.status} showDot={false} />
                </div>
                <MiniTrend
                  data={statusHistory.map((d) => d.values.status)}
                  color={
                    device.status === DeviceStatus.RUNNING
                      ? "#00C853"
                      : device.status === DeviceStatus.FAULT
                      ? "#FF3B3B"
                      : device.status === DeviceStatus.OFFLINE
                      ? "#5A7298"
                      : "#00D4FF"
                  }
                  height={36}
                />
              </div>
            </div>
          </Card>

          <Card
            title="实时参数面板"
            accent
            corner
            actions={
              <span className="flex items-center gap-1.5 text-[11px] text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
            }
          >
            {device.params && Object.keys(device.params).length > 0 ? (
              <div className="space-y-3">
                {paramGauges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {paramGauges.map((p) => (
                      <div
                        key={p.key}
                        className="p-2 rounded border border-border/40 bg-bg-elevated/50"
                      >
                        <div className="text-[10px] text-text-muted text-center mb-1">
                          {p.label}
                        </div>
                        <GaugeChart
                          value={p.value}
                          max={p.max}
                          unit=""
                          height={80}
                          thresholds={[
                            { value: 0, color: "#00C853" },
                            { value: p.max * 0.7, color: "#FFD600" },
                            { value: p.max * 0.85, color: "#FF3B3B" },
                          ]}
                        />
                        <div className="text-center font-number text-xs text-accent mt-1">
                          {p.displayValue}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="pt-2 border-t border-border/40 space-y-2">
                  {Object.entries(device.params).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-bg-elevated/50"
                    >
                      <span className="text-xs text-text-secondary">{key}</span>
                      <span className="font-number text-sm text-text-primary">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>

                {Object.keys(paramTrends).length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="text-[11px] text-text-muted mb-2">参数变化趋势</div>
                    <div className="space-y-2">
                      {Object.entries(paramTrends)
                        .slice(0, 2)
                        .map(([key, data]) => (
                          <div
                            key={key}
                            className="p-2 rounded bg-bg-elevated/40 border border-border/30"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-text-secondary">
                                {key}
                              </span>
                              <span className="font-number text-[10px] text-accent">
                                {String(device.params![key])}
                              </span>
                            </div>
                            <MiniTrend data={data as number[]} color="#00D4FF" height={28} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted text-sm">
                <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
                当前状态下无实时参数
              </div>
            )}
          </Card>

          <Card
            title="关联告警"
            corner
            actions={
              deviceAlerts.length > 0 ? (
                <button
                  onClick={() => nav("/alerts")}
                  className="text-xs text-danger hover:text-danger/80"
                >
                  查看全部
                </button>
              ) : null
            }
          >
            {deviceAlerts.length > 0 ? (
              <div className="space-y-2">
                {deviceAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-2 rounded border border-border/40 bg-bg-elevated/50 hover:border-border-light transition-colors cursor-pointer"
                    onClick={() => nav("/alerts")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0" />
                      <span className="text-xs font-medium text-text-primary truncate">
                        {a.title}
                      </span>
                      <span className="ml-auto text-[10px] text-text-muted whitespace-nowrap">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-secondary line-clamp-1 pl-5">
                      {a.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-text-muted text-xs">
                <CheckCircle className="w-6 h-6 mx-auto mb-1 opacity-40 text-success" />
                暂无关联告警记录
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-8 flex flex-col gap-4 min-h-0 overflow-hidden">
          <Card
            title="运行状态历史"
            accent
            corner
            className="shrink-0"
            actions={
              <div className="flex items-center gap-2">
                {[
                  { k: "24h", label: "24小时" },
                  { k: "7d", label: "7天" },
                  { k: "30d", label: "30天" },
                ].map((t, i) => (
                  <button
                    key={t.k}
                    className={cn(
                      "px-2 py-0.5 text-[10px] rounded border transition-all",
                      i === 0
                        ? "bg-accent/15 border-accent/40 text-accent"
                        : "border-border text-text-muted hover:border-border-light hover:text-text-secondary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-[180px]">
              <TrendChart
                data={statusHistory}
                series={[
                  { key: "status", name: "运行状态", color: "#00D4FF" },
                ]}
                height={180}
                yUnit="%"
              />
            </div>
          </Card>

          <Card
            title="检修记录时间线"
            corner
            className="flex-1 min-h-0 flex flex-col"
            actions={
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="text-xs text-accent hover:text-accent-dark flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                新增记录
              </button>
            }
          >
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {maintenanceRecords.length > 0 ? (
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/50 via-border to-transparent" />
                  {maintenanceRecords.map((r, idx) => (
                    <div
                      key={r.id}
                      className="relative pb-5 last:pb-0"
                    >
                      <div
                        className={cn(
                          "absolute -left-[1px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          idx === 0
                            ? "bg-bg-primary border-accent shadow-glow-sm"
                            : "bg-bg-primary border-border"
                        )}
                      >
                        {idx === 0 ? (
                          <Zap className="w-2 h-2 text-accent" />
                        ) : (
                          <CheckCircle
                            className={cn(
                              "w-2 h-2",
                              r.result.includes("正常") || r.result.includes("完成")
                                ? "text-success"
                                : "text-text-muted"
                            )}
                          />
                        )}
                      </div>

                      <div
                        className={cn(
                          "ml-2 p-3 rounded border transition-all",
                          idx === 0
                            ? "bg-accent/5 border-accent/30"
                            : "bg-bg-elevated/40 border-border/40 hover:border-border-light"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded font-medium",
                                r.type.includes("故障")
                                  ? "bg-danger/15 text-danger border border-danger/30"
                                  : r.type.includes("保养")
                                  ? "bg-success/15 text-success border border-success/30"
                                  : r.type.includes("更换")
                                  ? "bg-warning/15 text-warning border border-warning/30"
                                  : "bg-accent/15 text-accent border border-accent/30"
                              )}
                            >
                              {r.type}
                            </span>
                            <span className="text-xs font-medium text-text-primary">
                              {r.result}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-text-muted">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(r.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {timeAgo(r.date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-text-secondary mb-2 leading-relaxed">
                          {r.description}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                            <User className="w-2.5 h-2.5" />
                            <span>操作人：</span>
                            <span className="text-text-secondary font-medium">
                              {r.operator}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-muted">
                              记录编号：{r.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-muted py-12">
                  <Wrench className="w-10 h-10 mb-3 opacity-30" />
                  <div className="text-sm mb-1">暂无检修记录</div>
                  <div className="text-xs text-text-muted mb-4">
                    点击右上角"新增记录"添加第一条检修记录
                  </div>
                  <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增检修记录
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMaintenanceModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-lg bg-bg-card border border-border shadow-card animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-accent/15 border border-accent/40 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    新增检修记录
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    设备：{device.name} ({device.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="p-1.5 rounded text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">
                    检修类型 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={newMaintenance.type}
                    onChange={(e) =>
                      setNewMaintenance({
                        ...newMaintenance,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                  >
                    <option>定期巡检</option>
                    <option>故障维修</option>
                    <option>保养维护</option>
                    <option>更换配件</option>
                    <option>固件升级</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">
                    操作人 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMaintenance.operator}
                    onChange={(e) =>
                      setNewMaintenance({
                        ...newMaintenance,
                        operator: e.target.value,
                      })
                    }
                    placeholder="请输入操作人姓名"
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">
                  检修描述 <span className="text-danger">*</span>
                </label>
                <textarea
                  value={newMaintenance.description}
                  onChange={(e) =>
                    setNewMaintenance({
                      ...newMaintenance,
                      description: e.target.value,
                    })
                  }
                  placeholder="请详细描述检修内容、发现的问题、处理过程等..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">
                  处理结果
                </label>
                <select
                  value={newMaintenance.result}
                  onChange={(e) =>
                    setNewMaintenance({
                      ...newMaintenance,
                      result: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                >
                  <option value="">请选择处理结果</option>
                  <option>修复完成，恢复运行</option>
                  <option>运行正常，无异常</option>
                  <option>待进一步观察</option>
                  <option>配件待采购</option>
                  <option>需上级协调处理</option>
                </select>
              </div>

              <div className="p-3 rounded bg-bg-elevated/50 border border-border/40">
                <div className="flex items-start gap-2 text-[11px] text-text-muted">
                  <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <div>
                    提交后将自动记录当前时间，可在检修记录时间线中查看。
                    检修类型和描述将作为该设备的历史档案保存。
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-bg-elevated/30 rounded-b-lg">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 text-sm rounded border border-border text-text-secondary hover:border-border-light hover:text-text-primary transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSubmitMaintenance}
                disabled={!newMaintenance.operator || !newMaintenance.description}
                className={cn(
                  "px-4 py-2 text-sm rounded flex items-center gap-1.5 font-medium transition-all",
                  newMaintenance.operator && newMaintenance.description
                    ? "bg-accent text-bg-primary hover:bg-accent-dark shadow-glow-sm"
                    : "bg-bg-secondary text-text-muted cursor-not-allowed"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                提交记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;

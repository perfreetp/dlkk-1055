import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  Lightbulb,
  Fan,
  Droplets,
  Flame,
  Gauge,
  Camera,
  Cpu,
  RefreshCw,
  Eye,
  Wrench,
  AlertTriangle,
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  Plus,
  Send,
  Activity,
  Layers,
  Hash,
  Info,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_TUNNELS, MOCK_STAFF } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import StatusBadge from "@/components/common/StatusBadge";
import { DonutChart, MiniTrend, TrendChart, GaugeChart } from "@/components/charts/Charts";
import {
  DeviceTypeConfig,
  cn,
  formatDate,
  formatDateTime,
  formatTime,
  timeAgo,
} from "@/utils/format";
import { DeviceStatus, DeviceType, Device } from "@/types";
import { navigateToAlert } from "@/utils/navigate";

const TYPE_ICON: Record<DeviceType, React.ComponentType<any>> = {
  [DeviceType.LIGHTING]: Lightbulb,
  [DeviceType.FAN]: Fan,
  [DeviceType.PUMP]: Droplets,
  [DeviceType.FIRE]: Flame,
  [DeviceType.SENSOR]: Gauge,
  [DeviceType.CAMERA]: Camera,
};

const Devices: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices, alerts, maintenanceRecords, createMaintenanceRecord } = useMonitorStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterType, setFilterType] = useState<DeviceType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | "all">("all");
  const [filterTunnel, setFilterTunnel] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    type: "定期巡检",
    operator: "",
    description: "",
    result: "",
  });

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      const device = devices.find((d) => d.id === id);
      if (device) {
        setSelectedDevice(device);
      }
    } else {
      setSelectedDevice(null);
    }
  }, [searchParams, devices]);

  const handleSelectDevice = (device: Device | null) => {
    setSelectedDevice(device);
    if (device) {
      setSearchParams({ id: device.id });
    } else {
      setSearchParams({});
    }
  };

  const deviceAlerts = useMemo(
    () => (selectedDevice ? alerts.filter((a) => a.deviceId === selectedDevice.id).slice(0, 5) : []),
    [alerts, selectedDevice]
  );

  const deviceMaintenanceRecords = useMemo(() => {
    if (!selectedDevice) return [];
    return maintenanceRecords
      .filter((r) => r.deviceId === selectedDevice.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedDevice, maintenanceRecords]);

  const statusHistory = useMemo(() => {
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = 23; i >= 0; i--) {
      const t = new Date(Date.now() - i * 60 * 60 * 1000);
      arr.push({
        time: formatTime(t).slice(0, 5),
        values: {
          status:
            selectedDevice?.status === DeviceStatus.RUNNING
              ? 100
              : selectedDevice?.status === DeviceStatus.MAINTENANCE
              ? 60
              : selectedDevice?.status === DeviceStatus.FAULT
              ? 20
              : 0,
        },
      });
    }
    return arr;
  }, [selectedDevice?.status]);

  const paramTrends = useMemo(() => {
    if (!selectedDevice?.params) return {};
    const trends: Record<string, number[]> = {};
    Object.keys(selectedDevice.params).forEach((key) => {
      const base =
        typeof selectedDevice.params![key] === "number"
          ? (selectedDevice.params![key] as number)
          : parseFloat(String(selectedDevice.params![key])) || 50;
      const arr: number[] = [];
      for (let i = 0; i < 12; i++) {
        arr.push(Number((base + (Math.random() - 0.5) * base * 0.1).toFixed(1)));
      }
      trends[key] = arr;
    });
    return trends;
  }, [selectedDevice?.params]);

  const paramGauges = useMemo(() => {
    if (!selectedDevice?.params) return [];
    const entries = Object.entries(selectedDevice.params);
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
  }, [selectedDevice?.params]);

  const handleSubmitMaintenance = () => {
    if (!selectedDevice || !newMaintenance.operator || !newMaintenance.description) return;
    createMaintenanceRecord({
      deviceId: selectedDevice.id,
      type: newMaintenance.type,
      date: formatDateTime(new Date()),
      operator: newMaintenance.operator,
      description: newMaintenance.description,
      result: newMaintenance.result || "待进一步观察",
    });
    setNewMaintenance({ type: "定期巡检", operator: "", description: "", result: "" });
    setShowMaintenanceModal(false);
  };

  const deviceStats = useMemo(() => {
    const byType: Record<
      DeviceType,
      { total: number; running: number; fault: number; offline: number; maint: number }
    > = {} as any;
    (Object.values(DeviceType) as DeviceType[]).forEach((t) => {
      byType[t] = { total: 0, running: 0, fault: 0, offline: 0, maint: 0 };
    });
    devices.forEach((d) => {
      const s = byType[d.type];
      s.total++;
      if (d.status === DeviceStatus.RUNNING) s.running++;
      else if (d.status === DeviceStatus.FAULT) s.fault++;
      else if (d.status === DeviceStatus.OFFLINE) s.offline++;
      else if (d.status === DeviceStatus.MAINTENANCE) s.maint++;
    });
    const totals = Object.values(byType).reduce(
      (a, s) => ({
        total: a.total + s.total,
        running: a.running + s.running,
        fault: a.fault + s.fault,
        offline: a.offline + s.offline,
        maint: a.maint + s.maint,
      }),
      { total: 0, running: 0, fault: 0, offline: 0, maint: 0 }
    );
    const onlineRate = totals.total
      ? (((totals.running + totals.maint) / totals.total) * 100).toFixed(1)
      : "0";
    return { byType, totals, onlineRate };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (filterType !== "all" && d.type !== filterType) return false;
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      if (filterTunnel !== "all" && d.tunnelId !== filterTunnel) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        if (
          !d.code.toLowerCase().includes(kw) &&
          !d.name.toLowerCase().includes(kw) &&
          !d.location.toLowerCase().includes(kw)
        )
          return false;
      }
      return true;
    });
  }, [devices, filterType, filterStatus, filterTunnel, searchKeyword]);

  const deviceAlertCounts = useMemo(() => {
    const map: Record<string, number> = {};
    alerts.forEach((a) => {
      if (a.deviceId) {
        map[a.deviceId] = (map[a.deviceId] || 0) + 1;
      }
    });
    return map;
  }, [alerts]);

  const statusTrendData = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 24; i++) {
      const base = deviceStats.totals.running;
      arr.push(Math.round(base + (Math.random() - 0.5) * base * 0.05));
    }
    return arr;
  }, [deviceStats.totals.running]);

  const handleExport = () => {
    const headers = [
      "设备编号",
      "设备名称",
      "设备类型",
      "所属隧道",
      "安装位置",
      "运行状态",
      "最近检修",
      "投运时间",
    ];
    const rows = filteredDevices.map((d) => [
      d.code,
      d.name,
      DeviceTypeConfig[d.type].label,
      d.tunnelName || "",
      d.location,
      d.status === DeviceStatus.RUNNING
        ? "运行中"
        : d.status === DeviceStatus.FAULT
        ? "故障"
        : d.status === DeviceStatus.OFFLINE
        ? "离线"
        : "维保中",
      d.lastMaintenanceDate,
      d.installedAt,
    ]);
    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `设备台账_${formatDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchKeyword("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterTunnel("all");
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-accent" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-wider">
                设备台账管理
              </h1>
              <span className="text-xs text-text-muted px-2 py-0.5 border border-border rounded">
                共 {devices.length} 台设备
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4" />
            导出台账
          </button>
          <button className="btn btn-primary">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 shrink-0">
        <Card className="col-span-3" corner>
          <div className="flex items-end justify-between">
            <div>
              <DataNumber
                label="设备总数"
                value={deviceStats.totals.total}
                suffix=" 台"
                size="xl"
                color="accent"
                glow
              />
            </div>
            <div className="w-24">
              <MiniTrend data={statusTrendData} color="#00D4FF" height={40} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-text-secondary">在线设备</span>
            <span className="font-number text-success font-semibold">
              {deviceStats.totals.running} 台
            </span>
          </div>
        </Card>

        <Card className="col-span-3" corner>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-xs text-text-secondary mb-1">设备在线率</div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-success">
                  {deviceStats.onlineRate}
                </span>
                <span className="text-lg text-text-secondary">%</span>
              </div>
            </div>
            <DonutChart
              data={[
                { name: "在线", value: deviceStats.totals.running + deviceStats.totals.maint, color: "#00C853" },
                { name: "离线", value: deviceStats.totals.offline, color: "#5A7298" },
                { name: "故障", value: deviceStats.totals.fault, color: "#FF3B3B" },
              ]}
              height={80}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-text-secondary">运行</span>
              <span className="ml-auto font-number text-text-primary">
                {deviceStats.totals.running}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger" />
              <span className="text-text-secondary">故障</span>
              <span className="ml-auto font-number text-text-primary">
                {deviceStats.totals.fault}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-text-muted" />
              <span className="text-text-secondary">离线</span>
              <span className="ml-auto font-number text-text-primary">
                {deviceStats.totals.offline}
              </span>
            </div>
          </div>
        </Card>

        {(Object.values(DeviceType) as DeviceType[]).map((t) => {
          const s = deviceStats.byType[t];
          const cfg = DeviceTypeConfig[t];
          const Icon = TYPE_ICON[t];
          const rate = s.total ? ((s.running / s.total) * 100).toFixed(0) : "0";
          return (
            <div
              key={t}
              onClick={() => setFilterType(t === filterType ? "all" : t)}
              className={cn(
                "rounded border p-3 cursor-pointer transition-all",
                filterType === t
                  ? "bg-accent/10 border-accent/50 shadow-glow-sm"
                  : "bg-bg-card border-border hover:border-border-light"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center",
                    filterType === t ? "bg-accent/20" : "bg-accent/10"
                  )}
                >
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {cfg.label}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    在线率 {rate}%
                  </div>
                </div>
                <div className="ml-auto">
                  <DataNumber
                    value={s.total}
                    size="md"
                    color="accent"
                    suffix=" 台"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-success">运行{s.running}</span>
                <span className={s.fault > 0 ? "text-danger" : "text-text-muted"}>
                  故障{s.fault}
                </span>
                <span className={s.offline > 0 ? "text-warning" : "text-text-muted"}>
                  离线{s.offline}
                </span>
                <div className="ml-auto flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.fault > 0
                        ? "bg-gradient-to-r from-danger to-warning"
                        : "bg-gradient-to-r from-success to-accent"
                    )}
                    style={{ width: `${(s.running / Math.max(1, s.total)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card
        className="flex-1 min-h-0 flex flex-col"
        title={
          <div className="flex items-center gap-2">
            <span>设备列表</span>
            <span className="text-xs text-text-muted font-normal px-2 py-0.5 bg-bg-elevated rounded">
              共 {filteredDevices.length} 条
            </span>
          </div>
        }
        corner
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-xs flex items-center gap-1 px-2 py-1 rounded border transition-all",
              showFilters
                ? "text-accent border-accent/50 bg-accent/10"
                : "text-text-secondary border-border hover:border-border-light"
            )}
          >
            <Filter className="w-3 h-3" />
            筛选
          </button>
        }
      >
        {showFilters && (
          <div className="mb-4 p-3 rounded-lg bg-bg-elevated/60 border border-border/40">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <div className="text-xs text-text-secondary mb-1.5">关键字搜索</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="输入设备编号/名称/位置..."
                    className="w-full pl-9 pr-9 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                  />
                  {searchKeyword && (
                    <button
                      onClick={() => setSearchKeyword("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-xs text-text-secondary mb-1.5">设备类型</div>
                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as DeviceType | "all")
                  }
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">全部类型</option>
                  {(Object.values(DeviceType) as DeviceType[]).map((t) => (
                    <option key={t} value={t}>
                      {DeviceTypeConfig[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <div className="text-xs text-text-secondary mb-1.5">运行状态</div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as DeviceStatus | "all")
                  }
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">全部状态</option>
                  <option value={DeviceStatus.RUNNING}>运行中</option>
                  <option value={DeviceStatus.FAULT}>故障</option>
                  <option value={DeviceStatus.OFFLINE}>离线</option>
                  <option value={DeviceStatus.MAINTENANCE}>维保中</option>
                </select>
              </div>

              <div className="col-span-2">
                <div className="text-xs text-text-secondary mb-1.5">所属隧道</div>
                <select
                  value={filterTunnel}
                  onChange={(e) => setFilterTunnel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">全部隧道</option>
                  {MOCK_TUNNELS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-3 py-2 text-xs rounded border border-border text-text-secondary hover:border-border-light hover:text-text-primary transition-all"
                >
                  重置
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-3 py-2 text-xs rounded bg-accent text-bg-primary hover:bg-accent-dark transition-all font-medium"
                >
                  应用
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto rounded border border-border/60 min-h-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-bg-secondary text-text-secondary text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">设备编号</th>
                <th className="text-left px-4 py-3 font-medium">设备名称</th>
                <th className="text-left px-4 py-3 font-medium">类型</th>
                <th className="text-left px-4 py-3 font-medium">所属隧道</th>
                <th className="text-left px-4 py-3 font-medium">安装位置</th>
                <th className="text-left px-4 py-3 font-medium">运行状态</th>
                <th className="text-left px-4 py-3 font-medium">最近检修</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredDevices.map((d) => {
                const cfg = DeviceTypeConfig[d.type];
                const Icon = TYPE_ICON[d.type];
                const alertCount = deviceAlertCounts[d.id] || 0;
                return (
                  <tr
                    key={d.id}
                    onClick={() => handleSelectDevice(d)}
                    className="hover:bg-accent/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-number text-xs text-accent">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-bg-elevated border border-border/50 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div>
                          <div className="text-text-primary font-medium">
                            {d.name}
                          </div>
                          <div className="text-[10px] text-text-muted">
                            投运 {timeAgo(d.installedAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary">{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-primary">{d.tunnelName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary">{d.location}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge type="device" status={d.status} pulse={d.status === DeviceStatus.FAULT} />
                        {alertCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/30">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {alertCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-xs text-text-primary">
                          {formatDate(d.lastMaintenanceDate)}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {timeAgo(d.lastMaintenanceDate)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDevice(d);
                          }}
                          className="p-1.5 rounded hover:bg-accent/15 text-text-muted hover:text-accent transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDevice(d);
                            setShowMaintenanceModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-warning/15 text-text-muted hover:text-warning transition-colors"
                          title="维修"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToAlert(navigate);
                          }}
                          className="p-1.5 rounded hover:bg-accent/15 text-text-muted hover:text-accent transition-colors"
                          title="查看告警"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    暂无符合条件的设备数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedDevice && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => handleSelectDevice(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-[720px] bg-bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-start justify-between shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge
                    type="device"
                    status={selectedDevice.status}
                    pulse={selectedDevice.status === DeviceStatus.FAULT}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-accent/15 border border-accent/40 flex items-center justify-center">
                    {(() => {
                      const Icon = TYPE_ICON[selectedDevice.type];
                      return <Icon className="w-5 h-5 text-accent" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {selectedDevice.name}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {selectedDevice.code}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {DeviceTypeConfig[selectedDevice.type].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSelectDevice(null)}
                className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:bg-danger/20 hover:text-danger transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-border/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                      <MapPin className="w-3 h-3" />
                      所属隧道
                    </div>
                    <div className="text-sm text-text-primary font-medium">
                      {selectedDevice.tunnelName}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                      <Layers className="w-3 h-3" />
                      安装位置
                    </div>
                    <div className="text-sm text-text-primary font-medium">
                      {selectedDevice.location}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                      <Calendar className="w-3 h-3" />
                      投运日期
                    </div>
                    <div className="text-sm text-text-primary font-medium">
                      {formatDate(selectedDevice.installedAt)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {timeAgo(selectedDevice.installedAt)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-bg-elevated/60 border border-border/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
                      <Wrench className="w-3 h-3" />
                      最近检修
                    </div>
                    <div className="text-sm text-text-primary font-medium">
                      {formatDate(selectedDevice.lastMaintenanceDate)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {timeAgo(selectedDevice.lastMaintenanceDate)}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded border border-border/40 mt-3"
                     style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(18,31,56,1))" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Activity className="w-3.5 h-3.5 text-accent" />
                      运行状态近24小时
                    </div>
                    <StatusBadge type="device" status={selectedDevice.status} showDot={false} />
                  </div>
                  <MiniTrend
                    data={statusHistory.map((d) => d.values.status)}
                    color={
                      selectedDevice.status === DeviceStatus.RUNNING
                        ? "#00C853"
                        : selectedDevice.status === DeviceStatus.FAULT
                        ? "#FF3B3B"
                        : selectedDevice.status === DeviceStatus.OFFLINE
                        ? "#5A7298"
                        : "#00D4FF"
                    }
                    height={36}
                  />
                </div>
              </div>

              <div className="p-4 border-b border-border/30">
                <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  实时参数面板
                  <span className="ml-auto flex items-center gap-1.5 text-[11px] text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    LIVE
                  </span>
                </div>
                {selectedDevice.params && Object.keys(selectedDevice.params).length > 0 ? (
                  <div className="space-y-3">
                    {paramGauges.length > 0 && (
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
                    )}

                    <div className="pt-2 border-t border-border/40 space-y-2">
                      {Object.entries(selectedDevice.params).map(([key, value]) => (
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
                                    {String(selectedDevice.params![key])}
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
              </div>

              <div className="p-4 border-b border-border/30">
                <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent" />
                  关联告警
                  {deviceAlerts.length > 0 && (
                    <button
                      onClick={() => navigateToAlert(navigate)}
                      className="ml-auto text-xs text-danger hover:text-danger/80"
                    >
                      查看全部
                    </button>
                  )}
                </div>
                {deviceAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {deviceAlerts.map((a) => (
                      <div
                        key={a.id}
                        className="p-2 rounded border border-border/40 bg-bg-elevated/50 hover:border-border-light transition-colors cursor-pointer"
                        onClick={() => navigateToAlert(navigate, a.id)}
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
              </div>

              <div className="p-4">
                <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  检修记录时间线
                  <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className="ml-auto text-xs text-accent hover:text-accent-dark flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    新增记录
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 min-h-0 max-h-[300px]">
                  {deviceMaintenanceRecords.length > 0 ? (
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/50 via-border to-transparent" />
                      {deviceMaintenanceRecords.map((r, idx) => (
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
              </div>
            </div>

            <div className="p-4 border-t border-border/50 bg-bg-elevated/30 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMaintenanceModal(true)}
                  className="btn btn-secondary flex-1"
                >
                  <Wrench className="w-4 h-4" />
                  发起维修
                </button>
                <button
                  onClick={() => navigateToAlert(navigate)}
                  className={cn(
                    "btn flex-1",
                    deviceAlerts.length > 0 ? "btn-danger alert-pulse" : "btn-secondary"
                  )}
                >
                  <AlertTriangle className="w-4 h-4" />
                  查看告警 ({deviceAlerts.length})
                </button>
                <button
                  onClick={() => handleSelectDevice(null)}
                  className="btn btn-primary flex-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  关闭
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showMaintenanceModal && selectedDevice && (
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
                    设备：{selectedDevice.name} ({selectedDevice.code})
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
                  <select
                    value={newMaintenance.operator}
                    onChange={(e) =>
                      setNewMaintenance({
                        ...newMaintenance,
                        operator: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-bg-secondary text-text-primary focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                  >
                    <option value="">请选择操作人</option>
                    {MOCK_STAFF.filter((s) => s.role !== "duty").map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} - {s.team}
                      </option>
                    ))}
                  </select>
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

export default Devices;

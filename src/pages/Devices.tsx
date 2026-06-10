import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_TUNNELS } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import StatusBadge from "@/components/common/StatusBadge";
import { DonutChart, MiniTrend } from "@/components/charts/Charts";
import {
  DeviceTypeConfig,
  cn,
  formatDate,
  timeAgo,
} from "@/utils/format";
import { DeviceStatus, DeviceType } from "@/types";
import { Device } from "@/types";

const TYPE_ICON: Record<DeviceType, React.ComponentType<any>> = {
  [DeviceType.LIGHTING]: Lightbulb,
  [DeviceType.FAN]: Fan,
  [DeviceType.PUMP]: Droplets,
  [DeviceType.FIRE]: Flame,
  [DeviceType.SENSOR]: Gauge,
  [DeviceType.CAMERA]: Camera,
};

const Devices: React.FC = () => {
  const nav = useNavigate();
  const { devices, alerts } = useMonitorStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterType, setFilterType] = useState<DeviceType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | "all">("all");
  const [filterTunnel, setFilterTunnel] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);

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
                    onClick={() => nav(`/devices/${d.id}`)}
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
                            nav(`/devices/${d.id}`);
                          }}
                          className="p-1.5 rounded hover:bg-accent/15 text-text-muted hover:text-accent transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nav(`/devices/${d.id}`);
                          }}
                          className="p-1.5 rounded hover:bg-warning/15 text-text-muted hover:text-warning transition-colors"
                          title="维修"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
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
    </div>
  );
};

export default Devices;

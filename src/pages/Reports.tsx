import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Filter,
  ChevronDown,
  Download,
  Car,
  AlertTriangle,
  Wind,
  Eye,
  Thermometer,
  Cpu,
  Trophy,
  FileText,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import {
  MOCK_TUNNELS,
  MOCK_TRAFFIC,
  MOCK_ALERTS,
  MOCK_ENVIRONMENT,
  MOCK_DEVICES,
} from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import {
  TrendChart,
  DonutChart,
  BarChart,
  GaugeChart,
  MiniTrend,
} from "@/components/charts/Charts";
import {
  cn,
  AlertLevelConfig,
  formatDate,
  formatTime,
  formatNumber,
  randomBetween,
} from "@/utils/format";
import { AlertLevel, DeviceStatus } from "@/types";

type MetricKey = "traffic" | "alerts" | "environment";

const Reports: React.FC = () => {
  const { alerts, devices } = useMonitorStore();
  const [selectedTunnels, setSelectedTunnels] = useState<string[]>(MOCK_TUNNELS.map((t) => t.id));
  const [showTunnelDropdown, setShowTunnelDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    end: formatDate(new Date()),
  });
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
    "traffic",
    "alerts",
    "environment",
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const toggleTunnel = (id: string) => {
    setSelectedTunnels((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const trafficTrend = useMemo(() => {
    const days = 7;
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const tunnelFactor = selectedTunnels.length / MOCK_TUNNELS.length;
      const flowBase = 12000 * tunnelFactor;
      const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.8 : 1;
      arr.push({
        time: `${d.getMonth() + 1}/${d.getDate()}`,
        values: {
          flow: Math.round(flowBase * weekend + randomBetween(-800, 800)),
          avgSpeed: Math.round(55 + randomBetween(-8, 15)),
        },
      });
    }
    return arr;
  }, [selectedTunnels]);

  const alertTrend = useMemo(() => {
    const days = 7;
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const tunnelFactor = selectedTunnels.length / MOCK_TUNNELS.length;
      arr.push({
        time: `${d.getMonth() + 1}/${d.getDate()}`,
        values: {
          urgent: Math.round(2 * tunnelFactor + randomBetween(0, 3)),
          important: Math.round(5 * tunnelFactor + randomBetween(0, 5)),
          normal: Math.round(12 * tunnelFactor + randomBetween(-3, 5)),
          info: Math.round(8 * tunnelFactor + randomBetween(-2, 4)),
        },
      });
    }
    return arr;
  }, [selectedTunnels]);

  const envTrend = useMemo(() => {
    const hours = 24;
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = hours - 1; i >= 0; i--) {
      const t = new Date(Date.now() - i * 60 * 60 * 1000);
      const hourFactor = Math.sin(((t.getHours() - 6) / 24) * Math.PI * 2);
      arr.push({
        time: `${String(t.getHours()).padStart(2, "0")}:00`,
        values: {
          co: +(35 + hourFactor * 20 + randomBetween(-8, 8, 1)).toFixed(1),
          visibility: Math.round(350 - hourFactor * 120 + randomBetween(-40, 40)),
          temperature: +(18 + hourFactor * 8 + randomBetween(-2, 2, 1)).toFixed(1),
          humidity: Math.round(65 - hourFactor * 15 + randomBetween(-5, 5)),
        },
      });
    }
    return arr;
  }, []);

  const alertLevelStats = useMemo(() => {
    const filteredAlerts = alerts.filter(
      (a) => selectedTunnels.includes(a.tunnelId) || selectedTunnels.length === MOCK_TUNNELS.length
    );
    const counts = { urgent: 0, important: 0, normal: 0, info: 0 };
    filteredAlerts.forEach((a) => {
      if (a.level === AlertLevel.URGENT) counts.urgent++;
      else if (a.level === AlertLevel.IMPORTANT) counts.important++;
      else if (a.level === AlertLevel.NORMAL) counts.normal++;
      else counts.info++;
    });
    const total = counts.urgent + counts.important + counts.normal + counts.info;
    return {
      total,
      data: [
        { name: "紧急", value: counts.urgent, color: "#FF3B3B" },
        { name: "重要", value: counts.important, color: "#FF7A00" },
        { name: "一般", value: counts.normal, color: "#FFD600" },
        { name: "提示", value: counts.info, color: "#8FA4C7" },
      ],
    };
  }, [alerts, selectedTunnels]);

  const deviceOnlineStats = useMemo(() => {
    const filteredDevices = devices.filter(
      (d) => selectedTunnels.includes(d.tunnelId) || selectedTunnels.length === MOCK_TUNNELS.length
    );
    const byTunnel: Record<string, { total: number; running: number; fault: number; offline: number; maint: number }> = {};
    MOCK_TUNNELS.forEach((t) => {
      byTunnel[t.id] = { total: 0, running: 0, fault: 0, offline: 0, maint: 0 };
    });
    filteredDevices.forEach((d) => {
      const s = byTunnel[d.tunnelId];
      if (!s) return;
      s.total++;
      if (d.status === DeviceStatus.RUNNING) s.running++;
      else if (d.status === DeviceStatus.FAULT) s.fault++;
      else if (d.status === DeviceStatus.OFFLINE) s.offline++;
      else if (d.status === DeviceStatus.MAINTENANCE) s.maint++;
    });
    return byTunnel;
  }, [devices, selectedTunnels]);

  const topAlertDevices = useMemo(() => {
    const filteredAlerts = alerts.filter(
      (a) => selectedTunnels.includes(a.tunnelId) || selectedTunnels.length === MOCK_TUNNELS.length
    );
    const counts: Record<string, { name: string; count: number; tunnel: string; urgent: number }> = {};
    filteredAlerts.forEach((a) => {
      if (!counts[a.deviceId]) {
        counts[a.deviceId] = { name: a.deviceName, count: 0, tunnel: a.tunnelName || "", urgent: 0 };
      }
      counts[a.deviceId].count++;
      if (a.level === AlertLevel.URGENT || a.level === AlertLevel.IMPORTANT) {
        counts[a.deviceId].urgent++;
      }
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [alerts, selectedTunnels]);

  const summaryStats = useMemo(() => {
    const filteredDevices = devices.filter(
      (d) => selectedTunnels.includes(d.tunnelId) || selectedTunnels.length === MOCK_TUNNELS.length
    );
    const filteredAlerts = alerts.filter(
      (a) => selectedTunnels.includes(a.tunnelId) || selectedTunnels.length === MOCK_TUNNELS.length
    );
    const totalTraffic = trafficTrend.reduce((a, b) => a + b.values.flow, 0);
    const running = filteredDevices.filter((d) => d.status === DeviceStatus.RUNNING).length;
    const onlineRate = filteredDevices.length ? ((running / filteredDevices.length) * 100).toFixed(1) : "0";
    const avgCO = envTrend.reduce((a, b) => a + b.values.co, 0) / envTrend.length;
    return {
      totalTraffic,
      alertCount: filteredAlerts.length,
      urgentCount: filteredAlerts.filter((a) => a.level === AlertLevel.URGENT).length,
      deviceCount: filteredDevices.length,
      onlineRate: parseFloat(onlineRate),
      avgCO: +avgCO.toFixed(1),
    };
  }, [trafficTrend, alerts, devices, envTrend, selectedTunnels]);

  const handleExport = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-widest">统计报表中心</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            刷新数据
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn btn-primary disabled:opacity-70"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4" />
                导出成功
              </>
            ) : isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在导出...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出日报
              </>
            )}
          </button>
        </div>
      </div>

      <Card corner className="shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">筛选条件：</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowTunnelDropdown(!showTunnelDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-bg-elevated border border-border rounded text-sm hover:border-border-light transition-colors"
            >
              <span className="text-text-secondary">隧道：</span>
              <span className="text-text-primary font-medium">
                {selectedTunnels.length === MOCK_TUNNELS.length
                  ? "全部隧道"
                  : selectedTunnels.length === 0
                  ? "未选择"
                  : `已选 ${selectedTunnels.length} 座`}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", showTunnelDropdown && "rotate-180")} />
            </button>
            {showTunnelDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-lg bg-bg-card border border-border shadow-2xl z-20 overflow-hidden">
                <div className="p-2 border-b border-border/50">
                  <button
                    onClick={() => setSelectedTunnels(MOCK_TUNNELS.map((t) => t.id))}
                    className="w-full text-left text-xs px-2 py-1 text-accent hover:bg-accent/10 rounded"
                  >
                    全选
                  </button>
                  <button
                    onClick={() => setSelectedTunnels([])}
                    className="w-full text-left text-xs px-2 py-1 text-text-secondary hover:bg-bg-elevated rounded"
                  >
                    清空选择
                  </button>
                </div>
                <div className="p-1.5 max-h-64 overflow-y-auto">
                  {MOCK_TUNNELS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTunnel(t.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-bg-elevated transition-colors"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          selectedTunnels.includes(t.id)
                            ? "bg-accent border-accent"
                            : "border-border/60"
                        )}
                      >
                        {selectedTunnels.includes(t.id) && <Check className="w-3 h-3 text-bg-primary" />}
                      </div>
                      <span
                        className={cn(
                          selectedTunnels.includes(t.id) ? "text-text-primary" : "text-text-secondary"
                        )}
                      >
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
            />
            <span className="text-text-muted">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-text-secondary">指标：</span>
            {[
              { key: "traffic" as MetricKey, label: "车流", icon: Car, color: "#00D4FF" },
              { key: "alerts" as MetricKey, label: "告警", icon: AlertTriangle, color: "#FF7A00" },
              { key: "environment" as MetricKey, label: "环境", icon: Wind, color: "#00C853" },
            ].map((m) => {
              const Icon = m.icon;
              const active = selectedMetrics.includes(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => toggleMetric(m.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded border text-sm transition-all",
                    active
                      ? "border-transparent"
                      : "border-border text-text-secondary hover:border-border-light hover:text-text-primary"
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: m.color + "20",
                          borderColor: m.color + "50",
                          color: m.color,
                        }
                      : undefined
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-6 gap-3 shrink-0">
        <Card corner accent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">累计车流量</span>
            <Car className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-end justify-between">
            <DataNumber
              value={summaryStats.totalTraffic}
              suffix=" 辆"
              size="lg"
              color="accent"
              digits={0}
            />
          </div>
          <div className="mt-2">
            <MiniTrend
              data={trafficTrend.map((d) => d.values.flow)}
              color="#00D4FF"
              height={30}
            />
          </div>
        </Card>

        <Card corner accent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">告警总数</span>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-end justify-between">
            <DataNumber
              value={summaryStats.alertCount}
              suffix=" 条"
              size="lg"
              color="warning"
              digits={0}
            />
            <span className="text-[10px] text-danger px-1.5 py-0.5 rounded bg-danger/15 border border-danger/30">
              紧急 {summaryStats.urgentCount}
            </span>
          </div>
          <div className="mt-2">
            <MiniTrend
              data={alertTrend.map((d) => d.values.urgent + d.values.important + d.values.normal)}
              color="#FF7A00"
              height={30}
            />
          </div>
        </Card>

        <Card corner accent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">设备总数</span>
            <Cpu className="w-4 h-4 text-success" />
          </div>
          <div className="flex items-end justify-between">
            <DataNumber
              value={summaryStats.deviceCount}
              suffix=" 台"
              size="lg"
              color="success"
              digits={0}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-text-secondary">在线率</span>
            <span className="font-number text-success font-semibold">{summaryStats.onlineRate}%</span>
          </div>
        </Card>

        <Card corner accent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">平均CO浓度</span>
            <Wind className="w-4 h-4 text-info" />
          </div>
          <div className="flex items-end justify-between">
            <DataNumber
              value={summaryStats.avgCO}
              suffix=" ppm"
              size="lg"
              color={summaryStats.avgCO > 100 ? "danger" : summaryStats.avgCO > 60 ? "warning" : "default"}
              digits={1}
            />
          </div>
          <div className="mt-2">
            <GaugeChart
              value={summaryStats.avgCO}
              max={200}
              unit="ppm"
              height={50}
              thresholds={[
                { value: 0, color: "#00C853" },
                { value: 50, color: "#FFD600" },
                { value: 100, color: "#FF7A00" },
                { value: 150, color: "#FF3B3B" },
              ]}
            />
          </div>
        </Card>

        <Card corner accent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">平均能见度</span>
            <Eye className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-end justify-between">
            <DataNumber
              value={Math.round(envTrend.reduce((a, b) => a + b.values.visibility, 0) / envTrend.length)}
              suffix=" m"
              size="lg"
              color="accent"
              digits={0}
            />
          </div>
          <div className="mt-2">
            <MiniTrend
              data={envTrend.map((d) => d.values.visibility)}
              color="#00D4FF"
              height={30}
            />
          </div>
        </Card>

        <Card corner accent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">平均温度</span>
            <Thermometer className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-end justify-between">
            <DataNumber
              value={+(envTrend.reduce((a, b) => a + b.values.temperature, 0) / envTrend.length).toFixed(1)}
              suffix=" ℃"
              size="lg"
              color="warning"
              digits={1}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-text-secondary">湿度</span>
            <span className="font-number text-accent">
              {Math.round(envTrend.reduce((a, b) => a + b.values.humidity, 0) / envTrend.length)}%
            </span>
          </div>
        </Card>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
        <div className="grid grid-cols-12 gap-4">
          {selectedMetrics.includes("traffic") && (
            <Card
              title="车流趋势分析"
              corner
              accent
              className="col-span-8"
              actions={
                <div className="flex items-center gap-3 text-[11px] text-text-muted">
                  <span>统计周期：{dateRange.start} ~ {dateRange.end}</span>
                </div>
              }
            >
              <TrendChart
                data={trafficTrend}
                series={[
                  { key: "flow", name: "车流量(辆/日)", color: "#00D4FF" },
                  { key: "avgSpeed", name: "平均车速(km/h)", color: "#00C853" },
                ]}
                height={260}
              />
            </Card>
          )}

          {selectedMetrics.includes("alerts") && (
            <Card title="告警等级分布" corner accent className="col-span-4">
              <div className="flex flex-col h-[260px]">
                <DonutChart
                  data={alertLevelStats.data}
                  height={180}
                  centerValue={alertLevelStats.total}
                  centerLabel="告警总数"
                />
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {alertLevelStats.data.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between p-2 rounded bg-bg-elevated/40 border border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-text-secondary">{d.name}</span>
                      </div>
                      <span className="font-number text-sm font-semibold" style={{ color: d.color }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {selectedMetrics.includes("alerts") && (
            <Card title="告警趋势（按等级）" corner accent className="col-span-7">
              <BarChart
                categories={alertTrend.map((d) => d.time)}
                data={[
                  { name: "紧急", values: alertTrend.map((d) => d.values.urgent), color: "#FF3B3B" },
                  { name: "重要", values: alertTrend.map((d) => d.values.important), color: "#FF7A00" },
                  { name: "一般", values: alertTrend.map((d) => d.values.normal), color: "#FFD600" },
                  { name: "提示", values: alertTrend.map((d) => d.values.info), color: "#8FA4C7" },
                ]}
                height={260}
              />
            </Card>
          )}

          {selectedMetrics.includes("environment") && (
            <Card title="环境指标24h趋势" corner accent className="col-span-5">
              <TrendChart
                data={envTrend}
                series={[
                  { key: "co", name: "CO(ppm)", color: "#FF3B3B" },
                  { key: "temperature", name: "温度(℃)", color: "#FF7A00" },
                  { key: "humidity", name: "湿度(%)", color: "#00D4FF" },
                ]}
                height={260}
              />
            </Card>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Card title="各隧道设备在线率统计" corner accent className="col-span-7">
            <div className="space-y-3">
              {MOCK_TUNNELS.filter((t) => selectedTunnels.includes(t.id)).map((tunnel) => {
                const s = deviceOnlineStats[tunnel.id];
                if (!s || s.total === 0) return null;
                const onlineRate = ((s.running / s.total) * 100).toFixed(1);
                return (
                  <div
                    key={tunnel.id}
                    className="p-3 rounded-lg bg-bg-elevated/40 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-text-primary">{tunnel.name}</span>
                        <span className="text-xs text-text-muted ml-2">{tunnel.district}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-text-secondary">
                          共 <span className="font-number text-text-primary">{s.total}</span> 台
                        </span>
                        <span className="text-success">
                          运行 <span className="font-number">{s.running}</span>
                        </span>
                        <span className="text-danger">
                          故障 <span className="font-number">{s.fault}</span>
                        </span>
                        <span className="font-number text-accent font-semibold">{onlineRate}%</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-border/30 overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-danger to-danger"
                        style={{ width: `${(s.fault / s.total) * 100}%` }}
                      />
                      <div
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-warning to-warning"
                        style={{
                          left: `${(s.fault / s.total) * 100}%`,
                          width: `${(s.offline / s.total) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-info-light to-accent"
                        style={{
                          left: `${((s.fault + s.offline) / s.total) * 100}%`,
                          width: `${(s.maint / s.total) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-r from-success to-success-dark"
                        style={{ width: `${(s.running / s.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px]">
                      <div className="flex items-center gap-1 text-text-muted">
                        <span className="w-2 h-2 rounded-sm bg-danger" /> 故障
                      </div>
                      <div className="flex items-center gap-1 text-text-muted">
                        <span className="w-2 h-2 rounded-sm bg-warning" /> 离线
                      </div>
                      <div className="flex items-center gap-1 text-text-muted">
                        <span className="w-2 h-2 rounded-sm bg-accent" /> 维保
                      </div>
                      <div className="flex items-center gap-1 text-text-muted">
                        <span className="w-2 h-2 rounded-sm bg-success" /> 运行
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title="Top告警设备排行"
            corner
            accent
            className="col-span-5"
            actions={
              <span className="flex items-center gap-1 text-[11px] text-warning">
                <Trophy className="w-3.5 h-3.5" />
                告警次数
              </span>
            }
          >
            <div className="space-y-2">
              {topAlertDevices.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-elevated/40 border border-border/30 hover:border-border-light transition-colors"
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center font-number text-xs font-bold shrink-0",
                      idx === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg"
                        : idx === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                        : idx === 2
                        ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                        : "bg-bg-card border border-border/50 text-text-secondary"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{d.name}</div>
                    <div className="text-[11px] text-text-muted truncate">{d.tunnel}</div>
                  </div>
                  <div className="flex-1 max-w-[120px]">
                    <div className="h-2 rounded-full bg-border/30 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          idx === 0
                            ? "bg-gradient-to-r from-danger to-warning"
                            : idx < 3
                            ? "bg-gradient-to-r from-warning to-accent"
                            : "bg-gradient-to-r from-accent to-success"
                        )}
                        style={{
                          width: `${(d.count / (topAlertDevices[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.urgent > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/30">
                        {d.urgent}
                      </span>
                    )}
                    <span className="font-number text-sm font-semibold text-text-primary w-8 text-right">
                      {d.count}
                    </span>
                  </div>
                </div>
              ))}
              {topAlertDevices.length === 0 && (
                <div className="py-12 text-center text-text-muted text-sm">暂无告警数据</div>
              )}
            </div>
          </Card>
        </div>

        <Card
          title="日报导出预览"
          corner
          accent
          actions={
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dark disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              生成 PDF
            </button>
          }
        >
          <div className="rounded-lg bg-gradient-to-br from-bg-elevated/80 to-bg-card/60 border border-border/40 p-5">
            <div className="text-center mb-5">
              <h2 className="font-display font-bold text-xl text-text-primary mb-1">
                智慧隧道运营管理日报
              </h2>
              <p className="text-sm text-text-secondary">
                报表周期：{dateRange.start} 至 {dateRange.end}
                {selectedTunnels.length === MOCK_TUNNELS.length
                  ? " · 全部隧道"
                  : ` · 已选 ${selectedTunnels.length} 座隧道`}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-5">
              <PreviewItem label="累计车流量" value={`${formatNumber(summaryStats.totalTraffic)} 辆`} />
              <PreviewItem label="告警总数" value={`${summaryStats.alertCount} 条`} highlight={summaryStats.alertCount > 50} />
              <PreviewItem label="设备在线率" value={`${summaryStats.onlineRate}%`} />
              <PreviewItem label="平均CO浓度" value={`${summaryStats.avgCO} ppm`} highlight={summaryStats.avgCO > 80} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-3 rounded bg-bg-card/70 border border-border/30">
                <div className="text-xs text-text-secondary mb-2">近7日车流趋势</div>
                <MiniTrend data={trafficTrend.map((d) => d.values.flow)} color="#00D4FF" height={40} />
              </div>
              <div className="p-3 rounded bg-bg-card/70 border border-border/30">
                <div className="text-xs text-text-secondary mb-2">近7日告警趋势</div>
                <MiniTrend
                  data={alertTrend.map((d) => d.values.urgent + d.values.important + d.values.normal)}
                  color="#FF7A00"
                  height={40}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border/30">
              <span>生成时间：{formatDate(new Date())} {formatTime(new Date())}</span>
              <span>© 2026 智慧隧道运营管理平台</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const PreviewItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div
    className={cn(
      "p-3 rounded-lg border text-center transition-all",
      highlight
        ? "bg-danger/8 border-danger/30"
        : "bg-bg-card/70 border-border/30"
    )}
  >
    <div className={cn("text-xs mb-1", highlight ? "text-danger" : "text-text-secondary")}>
      {label}
    </div>
    <div
      className={cn(
        "font-display text-lg font-bold",
        highlight ? "text-danger" : "text-text-primary"
      )}
    >
      {value}
    </div>
  </div>
);

export default Reports;

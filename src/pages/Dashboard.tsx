import React, { useMemo } from "react";
import {
  Activity,
  Car,
  Wind,
  Gauge,
  Flame,
  Lightbulb,
  Droplets,
  Thermometer,
  Eye,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Camera,
  Fan,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMonitorStore } from "@/store/useMonitorStore";
import {
  MOCK_TUNNELS,
  MOCK_CAMERAS,
} from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import StatusBadge from "@/components/common/StatusBadge";
import { MiniTrend, GaugeChart, DonutChart, TrendChart } from "@/components/charts/Charts";
import {
  AlertLevel,
  AlertLevelConfig,
  AlertStatus,
  DeviceStatus,
  DeviceType,
  DeviceTypeConfig,
  cn,
  formatTime,
  timeAgo,
} from "@/utils/format";
import { Device } from "@/types";

const TYPE_ICON: Record<DeviceType, React.ComponentType<any>> = {
  [DeviceType.LIGHTING]: Lightbulb,
  [DeviceType.FAN]: Fan,
  [DeviceType.PUMP]: Droplets,
  [DeviceType.FIRE]: Flame,
  [DeviceType.SENSOR]: Gauge,
  [DeviceType.CAMERA]: Camera,
};

const Dashboard: React.FC = () => {
  const nav = useNavigate();
  const {
    devices,
    alerts,
    latestTraffic,
    latestEnvironment,
    selectedTunnelId,
    setSelectedTunnel,
  } = useMonitorStore();

  const filteredDevices = useMemo(
    () =>
      selectedTunnelId === "all"
        ? devices
        : devices.filter((d) => d.tunnelId === selectedTunnelId),
    [devices, selectedTunnelId]
  );

  const filteredAlerts = useMemo(
    () =>
      selectedTunnelId === "all"
        ? alerts
        : alerts.filter((a) => a.tunnelId === selectedTunnelId),
    [alerts, selectedTunnelId]
  );

  const traffic = latestTraffic[selectedTunnelId] || latestTraffic.all;
  const env = latestEnvironment[selectedTunnelId] || latestEnvironment.all;

  const deviceStats = useMemo(() => {
    const byType: Record<DeviceType, { total: number; running: number; fault: number; offline: number; maint: number }> =
      {} as any;
    Object.values(DeviceType).forEach((t: DeviceType) => {
      byType[t] = { total: 0, running: 0, fault: 0, offline: 0, maint: 0 };
    });
    filteredDevices.forEach((d) => {
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
    const onlineRate = totals.total ? ((totals.running / totals.total) * 100).toFixed(1) : "0";
    return { byType, totals, onlineRate };
  }, [filteredDevices]);

  const alertStats = useMemo(() => {
    const today = new Date().toDateString();
    const counts = { urgent: 0, important: 0, normal: 0, info: 0, pending: 0, today: 0 };
    filteredAlerts.forEach((a) => {
      if (new Date(a.createdAt).toDateString() === today) counts.today++;
      if (a.status === AlertStatus.PENDING) counts.pending++;
      if (a.level === AlertLevel.URGENT) counts.urgent++;
      else if (a.level === AlertLevel.IMPORTANT) counts.important++;
      else if (a.level === AlertLevel.NORMAL) counts.normal++;
      else counts.info++;
    });
    return counts;
  }, [filteredAlerts]);

  const trafficTrend = useMemo(() => {
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = 11; i >= 0; i--) {
      const t = new Date(Date.now() - i * 10 * 60 * 1000);
      const h = t.getHours();
      const peak = (h >= 7 && h <= 9) || (h >= 17 && h <= 19) ? 1.0 : (h >= 10 && h <= 16) ? 0.7 : h >= 22 || h <= 5 ? 0.15 : 0.5;
      const base = 2600 * peak;
      arr.push({
        time: formatTime(t).slice(0, 5),
        values: {
          flow: Math.round(base + (Math.random() - 0.5) * 200 + (11 - i) * 10),
          speed: Math.round(70 + (1 - peak) * 25 + (Math.random() - 0.5) * 6),
        },
      });
    }
    return arr;
  }, []);

  const envTrend = useMemo(() => {
    const arr: { time: string; values: Record<string, number> }[] = [];
    for (let i = 11; i >= 0; i--) {
      const t = new Date(Date.now() - i * 10 * 60 * 1000);
      arr.push({
        time: formatTime(t).slice(0, 5),
        values: {
          co: +(35 + Math.sin(i / 2) * 12 + (Math.random() - 0.5) * 8).toFixed(1),
          visibility: Math.round(280 + Math.cos(i / 3) * 80 + (Math.random() - 0.5) * 30),
        },
      });
    }
    return arr;
  }, []);

  const onlineCameras = MOCK_CAMERAS.filter(
    (c) => c.online && (selectedTunnelId === "all" || c.tunnelId === selectedTunnelId)
  ).length;
  const totalCameras = MOCK_CAMERAS.filter(
    (c) => selectedTunnelId === "all" || c.tunnelId === selectedTunnelId
  ).length;

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-accent" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-widest">
                TUNNEL MONITORING SYSTEM
              </h1>
              <span className="text-xs text-text-muted px-2 py-0.5 border border-border rounded">
                v2.4.1 运营版
              </span>
            </div>
          </div>
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
            全部
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/alerts")}
            className={cn(
              "btn btn-danger",
              alertStats.urgent > 0 && "alert-pulse"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            待处理 {alertStats.pending}
          </button>
          <button className="btn btn-secondary">
            <Maximize2 className="w-4 h-4" />
            全屏大屏
          </button>
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* 左列 - 车流 + 设备 */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          {/* 车流监测 */}
          <Card title="车流监测" accent corner className="shrink-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 flex items-end justify-between">
                <DataNumber
                  label="实时车流量"
                  value={traffic.flow}
                  suffix=" 辆/h"
                  size="xl"
                  color="accent"
                  glow
                />
                <MiniTrend
                  data={trafficTrend.map((d) => d.values.flow)}
                  color="#00D4FF"
                  height={48}
                />
              </div>
              <div className="pt-3 border-t border-border/40">
                <DataNumber
                  label="平均车速"
                  value={traffic.avgSpeed}
                  suffix=" km/h"
                  size="md"
                  color={traffic.avgSpeed > 80 ? "success" : traffic.avgSpeed < 40 ? "warning" : "default"}
                />
              </div>
              <div className="pt-3 border-t border-border/40">
                <DataNumber
                  label="车道占用率"
                  value={traffic.occupancy}
                  suffix=" %"
                  size="md"
                  color={traffic.occupancy > 85 ? "danger" : "default"}
                />
              </div>
              <div className="pt-3 border-t border-border/40">
                <div className="text-xs text-text-secondary mb-1">车道分布</div>
                <div className="space-y-1.5">
                  {[
                    { k: "车道1", v: traffic.lane1Flow, total: traffic.flow },
                    { k: "车道2", v: traffic.lane2Flow, total: traffic.flow },
                    ...(traffic.lane3Flow
                      ? [{ k: "车道3", v: traffic.lane3Flow, total: traffic.flow }]
                      : []),
                  ].map((l) => (
                    <div key={l.k} className="flex items-center gap-2 text-xs">
                      <span className="w-10 text-text-muted">{l.k}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark"
                          style={{ width: `${Math.min(100, (l.v / l.total) * 300)}%` }}
                        />
                      </div>
                      <span className="font-number text-text-primary text-[11px] w-10 text-right">
                        {l.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 设备运行总览 */}
          <Card
            title="设备运行总览"
            corner
            className="flex-1 min-h-0 flex flex-col"
            actions={
              <button
                onClick={() => nav("/devices")}
                className="text-xs text-accent hover:text-accent-dark flex items-center gap-1"
              >
                详情 <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-md bg-bg-elevated border border-border/50 p-3">
                <div className="text-xs text-text-muted mb-1">设备总数</div>
                <div className="font-display text-2xl font-bold text-text-primary">
                  {deviceStats.totals.total}
                  <span className="text-sm font-normal text-text-secondary ml-1">台</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-text-secondary">在线率</span>
                  <span className="font-number text-success font-semibold">
                    {deviceStats.onlineRate}%
                  </span>
                </div>
              </div>
              <div className="rounded-md p-3 border border-border/50 overflow-hidden relative"
                   style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(18,31,56,1))" }}>
                <DonutChart
                  data={[
                    { name: "运行", value: deviceStats.totals.running, color: "#00C853" },
                    { name: "故障", value: deviceStats.totals.fault, color: "#FF3B3B" },
                    { name: "离线", value: deviceStats.totals.offline, color: "#5A7298" },
                    { name: "维保", value: deviceStats.totals.maint, color: "#00D4FF" },
                  ]}
                  height={100}
                  centerValue={deviceStats.totals.running}
                  centerLabel="运行中"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {Object.values(DeviceType).map((t) => {
                const s = deviceStats.byType[t];
                const cfg = DeviceTypeConfig[t];
                const Icon = TYPE_ICON[t];
                if (s.total === 0) return null;
                return (
                  <div
                    key={t}
                    className="p-2 rounded border border-border/40 bg-bg-elevated/60 hover:border-border-light transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {cfg.label}
                      </span>
                      <span className="ml-auto font-number text-xs text-text-secondary">
                        {s.running}/{s.total}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-success">
                        运行{s.running}
                      </span>
                      <span className={s.fault > 0 ? "text-danger" : "text-text-muted"}>
                        故障{s.fault}
                      </span>
                      <span className={s.offline > 0 ? "text-warning" : "text-text-muted"}>
                        离线{s.offline}
                      </span>
                      <div className="ml-auto flex-1 h-1 rounded-full bg-border/30 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.fault > 0
                              ? "bg-gradient-to-r from-danger to-warning"
                              : "bg-gradient-to-r from-success to-accent"
                          )}
                          style={{ width: `${(s.running / s.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 中列 - 拓扑 + 环境 */}
        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          {/* 隧道拓扑图 */}
          <Card
            title="隧道运行拓扑"
            accent
            corner
            className="flex-1 min-h-0 overflow-hidden"
            actions={
              <div className="flex items-center gap-3 text-xs">
                {[
                  { c: "#00C853", l: "正常" },
                  { c: "#FF7A00", l: "告警" },
                  { c: "#FF3B3B", l: "故障" },
                  { c: "#5A7298", l: "离线" },
                ].map((lg) => (
                  <div key={lg.l} className="flex items-center gap-1.5 text-text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lg.c }} />
                    {lg.l}
                  </div>
                ))}
              </div>
            }
          >
            <div className="h-full relative">
              {/* 隧道示意 */}
              <svg viewBox="0 0 1000 420" className="w-full h-full">
                <defs>
                  <linearGradient id="tunnelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A2942" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0A1628" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2A4063" />
                    <stop offset="50%" stopColor="#3B5279" />
                    <stop offset="100%" stopColor="#2A4063" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 隧道外框 */}
                <rect
                  x="30"
                  y="60"
                  width="940"
                  height="300"
                  rx="180"
                  fill="url(#tunnelGrad)"
                  stroke="#2A4063"
                  strokeWidth="2"
                />
                <rect
                  x="30"
                  y="195"
                  width="940"
                  height="30"
                  fill="url(#roadGrad)"
                  opacity="0.8"
                />
                {/* 车道分隔线 */}
                {[165, 225, 255].map((y, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={y}
                    x2="950"
                    y2={y}
                    stroke={i === 1 || i === 2 ? "#FFD600" : "#8FA4C7"}
                    strokeWidth="1.5"
                    strokeDasharray={i === 0 ? "0" : "20 12"}
                    opacity="0.5"
                  />
                ))}

                {/* 洞口标识 */}
                <text x="50" y="50" fill="#8FA4C7" fontSize="11" fontFamily="Noto Sans SC">
                  ← 入口 {selectedTunnelId !== "all"
                    ? MOCK_TUNNELS.find((t) => t.id === selectedTunnelId)?.name
                    : "云顶山一号隧道上行"}
                </text>
                <text x="950" y="50" fill="#8FA4C7" fontSize="11" textAnchor="end" fontFamily="Noto Sans SC">
                  出口 →
                </text>

                {/* 设备点位 */}
                {filteredDevices.slice(0, 80).map((d, idx) => {
                  if (!d.position) return null;
                  const x = 50 + (d.position.x / 100) * 900;
                  const baseY = 60 + (d.position.y / 100) * 180;
                  const y = Math.min(340, Math.max(90, baseY));
                  const color =
                    d.status === DeviceStatus.RUNNING
                      ? "#00C853"
                      : d.status === DeviceStatus.FAULT
                      ? "#FF3B3B"
                      : d.status === DeviceStatus.OFFLINE
                      ? "#5A7298"
                      : "#00D4FF";
                  const Icon = TYPE_ICON[d.type];
                  return (
                    <g key={d.id} transform={`translate(${x}, ${y})`} className="cursor-pointer">
                      {(d.status === DeviceStatus.FAULT || d.status === DeviceStatus.OFFLINE) && (
                        <circle r="10" fill={color} opacity="0.2">
                          <animate
                            attributeName="r"
                            values="6;14;6"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.4;0;0.4"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                      <circle
                        r="7"
                        fill={color}
                        stroke="#0A1628"
                        strokeWidth="2"
                        filter={d.status === DeviceStatus.RUNNING ? "url(#glow)" : undefined}
                      />
                    </g>
                  );
                })}

                {/* 摄像头点位 */}
                {MOCK_CAMERAS.filter(
                  (c) => selectedTunnelId === "all" || c.tunnelId === selectedTunnelId
                )
                  .slice(0, 12)
                  .map((c, i) => (
                    <g key={c.id} transform={`translate(${80 + i * 75}, 80)`}>
                      <rect
                        x="-7"
                        y="-5"
                        width="14"
                        height="10"
                        rx="2"
                        fill={c.online ? "#00D4FF" : "#5A7298"}
                        opacity="0.9"
                      />
                      <path
                        d="M 7 -2 L 12 0 L 7 2 Z"
                        fill={c.online ? "#00D4FF" : "#5A7298"}
                        opacity="0.9"
                      />
                    </g>
                  ))}

                {/* 环境监测点 */}
                {[200, 500, 800].map((x, i) => (
                  <g key={i} transform={`translate(${x}, 130)`}>
                    <circle r="12" fill="rgba(0,212,255,0.1)" stroke="#00D4FF" strokeWidth="1.5" strokeDasharray="3 3" />
                    <Gauge className="w-0 h-0" />
                    <text y="3" textAnchor="middle" fill="#00D4FF" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
                      E{i + 1}
                    </text>
                  </g>
                ))}

                {/* 底部公里桩 */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i} transform={`translate(${80 + i * 210}, 380)`}>
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#2A4063" strokeWidth="1" />
                    <text
                      y="22"
                      textAnchor="middle"
                      fill="#5A7298"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                    >
                      K{i}+000
                    </text>
                  </g>
                ))}
              </svg>

              {/* 悬浮状态面板 */}
              <div className="absolute top-3 right-3 w-48 space-y-2">
                <div className="p-2 rounded bg-bg-elevated/90 backdrop-blur border border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary mb-1">
                    <Camera className="w-3.5 h-3.5 text-accent" />
                    视频监控在线
                  </div>
                  <div className="font-number text-text-primary text-lg font-semibold">
                    {onlineCameras}
                    <span className="text-xs text-text-muted ml-1">
                      / {totalCameras}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-bg-elevated/90 backdrop-blur border border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                    今日告警
                  </div>
                  <div className="flex items-center justify-between font-number text-text-primary text-lg font-semibold">
                    {alertStats.today}
                    <span className={cn(
                      "text-xs px-1.5 rounded",
                      alertStats.urgent > 0 && "bg-danger/20 text-danger alert-pulse"
                    )}>
                      紧急 {alertStats.urgent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 环境监测 */}
          <Card title="环境监测" corner className="shrink-0 h-[240px]">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-5 grid grid-cols-3 gap-2 h-full">
                {[
                  {
                    icon: Wind,
                    label: "CO浓度",
                    value: env.co,
                    unit: "ppm",
                    max: 200,
                    thresholds: [
                      { value: 0, color: "#00C853" },
                      { value: 50, color: "#FFD600" },
                      { value: 100, color: "#FF7A00" },
                      { value: 150, color: "#FF3B3B" },
                    ],
                  },
                  {
                    icon: Eye,
                    label: "能见度",
                    value: env.visibility,
                    unit: "m",
                    max: 500,
                    thresholds: [
                      { value: 0, color: "#FF3B3B" },
                      { value: 100, color: "#FF7A00" },
                      { value: 200, color: "#FFD600" },
                      { value: 300, color: "#00C853" },
                    ],
                    inverse: true,
                  },
                  {
                    icon: Thermometer,
                    label: "温湿度",
                    value: env.temperature,
                    value2: env.humidity,
                    unit: "℃",
                    unit2: "%",
                  },
                  {
                    icon: Wind,
                    label: "风速",
                    value: env.windSpeed,
                    unit: "m/s",
                    max: 5,
                    thresholds: [
                      { value: 0, color: "#00C853" },
                      { value: 2, color: "#00D4FF" },
                      { value: 3.5, color: "#FFD600" },
                    ],
                  },
                ].map((m, i) => (
                  <div
                    key={m.label}
                    className={cn(
                      "rounded border border-border/40 bg-bg-elevated/60 p-2 flex flex-col items-center",
                      i === 2 ? "col-span-1" : ""
                    )}
                  >
                    <div className="flex items-center gap-1 text-[11px] text-text-secondary mb-1">
                      <m.icon className="w-3 h-3 text-accent" />
                      {m.label}
                    </div>
                    {i === 2 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
                        <div>
                          <span className="font-number text-xl font-bold text-warning">
                            {m.value?.toFixed(1)}
                          </span>
                          <span className="text-xs text-text-muted ml-0.5">{m.unit}</span>
                        </div>
                        <div>
                          <span className="font-number text-sm text-accent">
                            {m.value2?.toFixed(0)}
                          </span>
                          <span className="text-[10px] text-text-muted ml-0.5">{m.unit2}</span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-1">
                          {env.windDirection}
                        </div>
                      </div>
                    ) : (
                      <GaugeChart
                        value={m.value as number}
                        max={m.max}
                        unit={m.unit}
                        thresholds={m.thresholds}
                        height={90}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="col-span-7 h-full">
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div className="rounded border border-border/40 bg-bg-elevated/40 p-2">
                    <div className="text-[11px] text-text-secondary mb-1">CO/能见度趋势</div>
                    <TrendChart
                      data={envTrend}
                      series={[
                        { key: "co", name: "CO(ppm)", color: "#FF3B3B" },
                        { key: "visibility", name: "能见度(m/10)", color: "#00D4FF" },
                      ]}
                      height={160}
                    />
                  </div>
                  <div className="rounded border border-border/40 bg-bg-elevated/40 p-2">
                    <div className="text-[11px] text-text-secondary mb-1">流量/车速趋势</div>
                    <TrendChart
                      data={trafficTrend}
                      series={[
                        { key: "flow", name: "流量(百辆)", color: "#00D4FF" },
                        { key: "speed", name: "车速(km/h)", color: "#00C853" },
                      ]}
                      height={160}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 右列 - 告警 */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          {/* 告警分级统计 */}
          <Card title="告警分级统计" corner className="shrink-0">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { l: AlertLevel.URGENT, k: "urgent" },
                { l: AlertLevel.IMPORTANT, k: "important" },
                { l: AlertLevel.NORMAL, k: "normal" },
                { l: AlertLevel.INFO, k: "info" },
              ].map(({ l, k }) => {
                const cfg = AlertLevelConfig[l];
                const count = (alertStats as any)[k];
                return (
                  <div
                    key={l}
                    className="rounded border p-2 text-center relative overflow-hidden"
                    style={{
                      borderColor: cfg.color + "60",
                      background: cfg.color + "10",
                    }}
                  >
                    {count > 0 && k === "urgent" && (
                      <span className="absolute inset-0 bg-danger/5 alert-pulse pointer-events-none rounded" />
                    )}
                    <div
                      className="font-display text-2xl font-bold mb-0.5"
                      style={{ color: cfg.color }}
                    >
                      {count}
                    </div>
                    <div className="text-[10px] text-text-secondary">{cfg.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                待确认 {alertStats.pending} 条
              </div>
              <button
                onClick={() => nav("/alerts")}
                className="text-accent hover:text-accent-dark flex items-center gap-0.5"
              >
                告警中心 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </Card>

          {/* 实时告警流 */}
          <Card
            title="实时告警"
            accent
            corner
            className="flex-1 min-h-0 flex flex-col"
            actions={
              <span className="flex items-center gap-1.5 text-[11px] text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
            }
          >
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredAlerts.slice(0, 18).map((a, idx) => {
                const cfg = AlertLevelConfig[a.level];
                return (
                  <div
                    key={a.id}
                    onClick={() => nav("/alerts")}
                    className={cn(
                      "p-2.5 rounded-md border cursor-pointer transition-all hover:scale-[1.01]",
                      a.status === AlertStatus.PENDING && "card-accent-hover",
                      idx === 0 && "animate-slide-in-right"
                    )}
                    style={{
                      borderColor:
                        a.status === AlertStatus.PENDING ? cfg.color + "80" : "#2A406360",
                      background:
                        a.status === AlertStatus.PENDING ? cfg.color + "10" : "rgba(15,30,53,0.5)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5",
                          a.level === AlertLevel.URGENT && "alert-pulse"
                        )}
                        style={{ backgroundColor: cfg.color + "30" }}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-1.5 py-px rounded"
                                style={{ backgroundColor: cfg.color + "20", color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-px rounded",
                              a.status === AlertStatus.PENDING
                                ? "bg-danger/20 text-danger"
                                : a.status === AlertStatus.CLOSED
                                ? "bg-success/20 text-success"
                                : "bg-accent/20 text-accent"
                            )}
                          >
                            {a.status === AlertStatus.PENDING
                              ? "待确认"
                              : a.status === AlertStatus.CONFIRMED
                              ? "已确认"
                              : a.status === AlertStatus.DISPATCHED
                              ? "已转派"
                              : a.status === AlertStatus.PROCESSING
                              ? "处置中"
                              : "已闭环"}
                          </span>
                          <span className="ml-auto text-[10px] text-text-muted whitespace-nowrap">
                            {timeAgo(a.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-text-primary leading-snug truncate">
                          {a.title}
                        </div>
                        <div className="text-[10px] text-text-secondary mt-0.5 truncate">
                          {a.tunnelName} · {a.deviceName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="shrink-0 px-2 flex items-center justify-between text-[11px] text-text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            数据采集服务正常
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            视频平台已连接
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            告警引擎运行中
          </span>
          <span>·</span>
          <span>接入设备 {filteredDevices.length} 台</span>
          <span>·</span>
          <span>在线 {deviceStats.totals.running} 台</span>
        </div>
        <div>
          © 2026 智慧隧道运营管理平台 · 数据每4秒自动刷新
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

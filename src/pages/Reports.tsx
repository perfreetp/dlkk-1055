import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  BarChart3,
  Calendar,
  Filter,
  ChevronDown,
  Car,
  AlertTriangle,
  Wind,
  Eye,
  Thermometer,
  Cpu,
  Trophy,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  UserCheck,
  FileSpreadsheet,
  FileCode,
  MapPin,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import {
  MOCK_TUNNELS,
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
  AlertStatusConfig,
  formatDate,
  formatTime,
  formatNumber,
  randomBetween,
  formatDateTime,
} from "@/utils/format";
import { AlertLevel, AlertStatus, DeviceStatus } from "@/types";

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
  const [exportStatus, setExportStatus] = useState<{ csv: boolean; html: boolean }>({ csv: false, html: false });
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const hasSelectedTunnels = selectedTunnels.length > 0;

  const dateRangeDays = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(diff, 365));
  }, [dateRange]);

  const tunnelFactor = useMemo(() => {
    if (!hasSelectedTunnels) return 0;
    return selectedTunnels.length / MOCK_TUNNELS.length;
  }, [selectedTunnels, hasSelectedTunnels]);

  const isInDateRange = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }, [dateRange]);

  const trafficTrend = useMemo(() => {
    if (!hasSelectedTunnels) return [];
    const arr: { time: string; values: Record<string, number> }[] = [];
    const start = new Date(dateRange.start);
    for (let i = 0; i < dateRangeDays; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
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
  }, [dateRange, dateRangeDays, tunnelFactor, hasSelectedTunnels]);

  const alertTrend = useMemo(() => {
    if (!hasSelectedTunnels) return [];
    const arr: { time: string; values: Record<string, number> }[] = [];
    const start = new Date(dateRange.start);
    for (let i = 0; i < dateRangeDays; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
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
  }, [dateRange, dateRangeDays, tunnelFactor, hasSelectedTunnels]);

  const envTrend = useMemo(() => {
    if (!hasSelectedTunnels) return [];
    const arr: { time: string; values: Record<string, number> }[] = [];
    const dataPoints = dateRangeDays <= 2 ? 24 : Math.min(dateRangeDays, 30);
    const stepMs = dateRangeDays <= 2
      ? 60 * 60 * 1000
      : (dateRangeDays * 24 * 60 * 60 * 1000) / dataPoints;
    const start = new Date(dateRange.start);
    for (let i = 0; i < dataPoints; i++) {
      const t = new Date(start.getTime() + i * stepMs);
      const hourFactor = Math.sin(((t.getHours() - 6) / 24) * Math.PI * 2);
      arr.push({
        time: dateRangeDays <= 2
          ? `${String(t.getHours()).padStart(2, "0")}:00`
          : `${t.getMonth() + 1}/${t.getDate()}`,
        values: {
          co: +(35 + hourFactor * 20 + randomBetween(-8, 8, 1)).toFixed(1),
          visibility: Math.round(350 - hourFactor * 120 + randomBetween(-40, 40)),
          temperature: +(18 + hourFactor * 8 + randomBetween(-2, 2, 1)).toFixed(1),
          humidity: Math.round(65 - hourFactor * 15 + randomBetween(-5, 5)),
        },
      });
    }
    return arr;
  }, [dateRange, dateRangeDays, hasSelectedTunnels]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const tunnelMatch = selectedTunnels.includes(a.tunnelId);
      const dateMatch = isInDateRange(a.createdAt);
      return tunnelMatch && dateMatch;
    });
  }, [alerts, selectedTunnels, isInDateRange]);

  const alertLevelStats = useMemo(() => {
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
  }, [filteredAlerts]);

  const openAlertsSummary = useMemo(() => {
    const openAlerts = filteredAlerts.filter((a) => a.status !== AlertStatus.CLOSED);
    const byStatus = {
      [AlertStatus.PENDING]: 0,
      [AlertStatus.CONFIRMED]: 0,
      [AlertStatus.DISPATCHED]: 0,
      [AlertStatus.PROCESSING]: 0,
    };
    const byLevel = { urgent: 0, important: 0, normal: 0, info: 0 };
    const byTunnel: Record<string, number> = {};
    const oldestOpen: typeof openAlerts = [];

    openAlerts.forEach((a) => {
      if (a.status !== AlertStatus.CLOSED) {
        byStatus[a.status as keyof typeof byStatus] =
          (byStatus[a.status as keyof typeof byStatus] || 0) + 1;
      }
      if (a.level === AlertLevel.URGENT) byLevel.urgent++;
      else if (a.level === AlertLevel.IMPORTANT) byLevel.important++;
      else if (a.level === AlertLevel.NORMAL) byLevel.normal++;
      else byLevel.info++;
      byTunnel[a.tunnelId] = (byTunnel[a.tunnelId] || 0) + 1;
    });

    const sorted = [...openAlerts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    oldestOpen.push(...sorted.slice(0, 5));

    return {
      total: openAlerts.length,
      byStatus,
      byLevel,
      byTunnel,
      oldestOpen,
      urgentImportant: byLevel.urgent + byLevel.important,
    };
  }, [filteredAlerts]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => selectedTunnels.includes(d.tunnelId));
  }, [devices, selectedTunnels]);

  const deviceOnlineStats = useMemo(() => {
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
  }, [filteredDevices]);

  const topAlertDevices = useMemo(() => {
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
  }, [filteredAlerts]);

  const summaryStats = useMemo(() => {
    if (!hasSelectedTunnels || trafficTrend.length === 0) {
      return {
        totalTraffic: 0,
        alertCount: 0,
        urgentCount: 0,
        deviceCount: 0,
        onlineRate: 0,
        avgCO: 0,
        avgVisibility: 0,
        avgTemperature: 0,
        avgHumidity: 0,
      };
    }
    const totalTraffic = trafficTrend.reduce((a, b) => a + b.values.flow, 0);
    const running = filteredDevices.filter((d) => d.status === DeviceStatus.RUNNING).length;
    const onlineRate = filteredDevices.length ? ((running / filteredDevices.length) * 100).toFixed(1) : "0";
    const avgCO = envTrend.length ? envTrend.reduce((a, b) => a + b.values.co, 0) / envTrend.length : 0;
    const avgVisibility = envTrend.length ? envTrend.reduce((a, b) => a + b.values.visibility, 0) / envTrend.length : 0;
    const avgTemperature = envTrend.length ? envTrend.reduce((a, b) => a + b.values.temperature, 0) / envTrend.length : 0;
    const avgHumidity = envTrend.length ? envTrend.reduce((a, b) => a + b.values.humidity, 0) / envTrend.length : 0;
    return {
      totalTraffic,
      alertCount: filteredAlerts.length,
      urgentCount: filteredAlerts.filter((a) => a.level === AlertLevel.URGENT).length,
      deviceCount: filteredDevices.length,
      onlineRate: parseFloat(onlineRate),
      avgCO: +avgCO.toFixed(1),
      avgVisibility: Math.round(avgVisibility),
      avgTemperature: +avgTemperature.toFixed(1),
      avgHumidity: Math.round(avgHumidity),
    };
  }, [trafficTrend, filteredAlerts, filteredDevices, envTrend, hasSelectedTunnels]);

  const buildCSVContent = () => {
    const lines: string[] = [];
    const tunnelNames = MOCK_TUNNELS.filter((t) => selectedTunnels.includes(t.id))
      .map((t) => t.name)
      .join("、");

    lines.push("# 智慧隧道运营管理统计报表");
    lines.push(`# 报表周期,${dateRange.start} 至 ${dateRange.end}`);
    lines.push(`# 统计隧道,${tunnelNames || "无"}`);
    lines.push(`# 生成时间,${formatDateTime(new Date())}`);
    lines.push("");

    lines.push("## 一、核心指标汇总");
    lines.push("指标名称,数值,单位");
    lines.push(`累计车流量,${formatNumber(summaryStats.totalTraffic)},辆`);
    lines.push(`告警总数,${summaryStats.alertCount},条`);
    lines.push(`紧急告警,${summaryStats.urgentCount},条`);
    lines.push(`未关闭事件,${openAlertsSummary.total},条`);
    lines.push(`设备总数,${summaryStats.deviceCount},台`);
    lines.push(`设备在线率,${summaryStats.onlineRate},%`);
    lines.push(`平均CO浓度,${summaryStats.avgCO},ppm`);
    lines.push(`平均能见度,${summaryStats.avgVisibility},m`);
    lines.push(`平均温度,${summaryStats.avgTemperature},℃`);
    lines.push(`平均湿度,${summaryStats.avgHumidity},%`);
    lines.push("");

    lines.push("## 二、车流趋势（按日）");
    lines.push("日期,车流量(辆/日),平均车速(km/h)");
    trafficTrend.forEach((d) => {
      lines.push(`${d.time},${d.values.flow},${d.values.avgSpeed}`);
    });
    lines.push("");

    lines.push("## 三、告警趋势（按日·按等级）");
    lines.push("日期,紧急,重要,一般,提示,合计");
    alertTrend.forEach((d) => {
      const total = d.values.urgent + d.values.important + d.values.normal + d.values.info;
      lines.push(`${d.time},${d.values.urgent},${d.values.important},${d.values.normal},${d.values.info},${total}`);
    });
    lines.push("");

    lines.push("## 四、告警等级分布");
    lines.push("等级,数量,占比(%)");
    alertLevelStats.data.forEach((d) => {
      const pct = alertLevelStats.total ? ((d.value / alertLevelStats.total) * 100).toFixed(1) : "0";
      lines.push(`${d.name},${d.value},${pct}`);
    });
    lines.push("");

    lines.push("## 五、未关闭事件摘要");
    lines.push(`未关闭总数,${openAlertsSummary.total}`);
    lines.push("状态分类");
    lines.push("状态,数量");
    Object.entries(openAlertsSummary.byStatus).forEach(([k, v]) => {
      lines.push(`${AlertStatusConfig[k as AlertStatus].label},${v}`);
    });
    lines.push("等级分类");
    lines.push("等级,数量");
    Object.entries(openAlertsSummary.byLevel).forEach(([k, v]) => {
      const label = k === "urgent" ? "紧急" : k === "important" ? "重要" : k === "normal" ? "一般" : "提示";
      lines.push(`${label},${v}`);
    });
    lines.push("");

    lines.push("## 六、未关闭事件明细（最旧5条）");
    lines.push("告警ID,标题,等级,状态,所属隧道,设备,创建时间");
    openAlertsSummary.oldestOpen.forEach((a) => {
      const levelLabel = AlertLevelConfig[a.level].label;
      const statusLabel = AlertStatusConfig[a.status].label;
      lines.push(
        [a.id, a.title, levelLabel, statusLabel, a.tunnelName || "", a.deviceName, a.createdAt]
          .map((s) => `"${String(s).replace(/"/g, '""')}"`)
          .join(",")
      );
    });
    lines.push("");

    lines.push("## 七、各隧道设备在线率");
    lines.push("隧道名称,设备总数,运行中,故障,离线,维保中,在线率(%)");
    MOCK_TUNNELS.filter((t) => selectedTunnels.includes(t.id)).forEach((t) => {
      const s = deviceOnlineStats[t.id];
      if (!s) return;
      const rate = s.total ? ((s.running / s.total) * 100).toFixed(1) : "0";
      lines.push(`${t.name},${s.total},${s.running},${s.fault},${s.offline},${s.maint},${rate}`);
    });
    lines.push("");

    lines.push("## 八、Top告警设备排行");
    lines.push("排名,设备名称,所属隧道,告警总数,紧急/重要数");
    topAlertDevices.forEach((d, idx) => {
      lines.push(`${idx + 1},${d.name},${d.tunnel},${d.count},${d.urgent}`);
    });
    lines.push("");

    return "\uFEFF" + lines.join("\n");
  };

  const buildHTMLContent = () => {
    const tunnelNames = MOCK_TUNNELS.filter((t) => selectedTunnels.includes(t.id))
      .map((t) => t.name)
      .join("、");

    const statusBadge = (label: string, color: string) =>
      `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:${color}20;color:${color};border:1px solid ${color}50;">${label}</span>`;

    const levelBadge = (level: AlertLevel) => {
      const cfg = AlertLevelConfig[level];
      return statusBadge(cfg.label, cfg.color);
    };

    const alertRows = openAlertsSummary.oldestOpen
      .map(
        (a) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.id}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${levelBadge(a.level)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${statusBadge(
          AlertStatusConfig[a.status].label,
          AlertStatusConfig[a.status].color
        )}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.tunnelName || "-"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.deviceName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.createdAt}</td>
      </tr>`
      )
      .join("");

    const deviceRows = MOCK_TUNNELS.filter((t) => selectedTunnels.includes(t.id))
      .map((t) => {
        const s = deviceOnlineStats[t.id];
        if (!s || s.total === 0) return "";
        const rate = ((s.running / s.total) * 100).toFixed(1);
        return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${t.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${s.total}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#00C853;">${s.running}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#FF3B3B;">${s.fault}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${s.offline}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#00D4FF;">${s.maint}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:bold;color:#00C853;">${rate}%</td>
        </tr>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>智慧隧道运营管理日报 - ${dateRange.start} ~ ${dateRange.end}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background: #f8fafc; color: #1f2937; padding: 32px; line-height: 1.6; }
  .container { max-width: 1100px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 28px 36px; }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: 2px; }
  .header p { opacity: 0.85; font-size: 14px; }
  .content { padding: 28px 36px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 14px; padding-left: 10px; border-left: 4px solid #00D4FF; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 8px; }
  .kpi-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 10px; padding: 16px; }
  .kpi-card.warn { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #fed7aa; }
  .kpi-card.danger { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-color: #fecaca; }
  .kpi-card.success { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #bbf7d0; }
  .kpi-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  .kpi-value { font-size: 22px; font-weight: 700; color: #0f172a; }
  .kpi-unit { font-size: 13px; font-weight: 400; color: #6b7280; margin-left: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #334155; border-bottom: 2px solid #e2e8f0; }
  .sub-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .sub-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
  .sub-card h4 { font-size: 13px; color: #6b7280; margin-bottom: 8px; font-weight: 500; }
  .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
  .stat-row .label { font-size: 13px; color: #475569; display: flex; align-items: center; gap: 6px; }
  .stat-row .value { font-size: 15px; font-weight: 600; color: #0f172a; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .footer { padding: 16px 36px; background: #f1f5f9; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
  .empty-hint { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>智 慧 隧 道 运 营 管 理 日 报</h1>
    <p>报表周期：${dateRange.start} 至 ${dateRange.end} · ${tunnelNames || "未选择隧道"} · 生成时间：${formatDateTime(new Date())}</p>
  </div>
  <div class="content">
    ${
      hasSelectedTunnels
        ? `
    <div class="section">
      <div class="section-title">核心指标汇总</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">累计车流量</div>
          <div class="kpi-value">${formatNumber(summaryStats.totalTraffic)}<span class="kpi-unit">辆</span></div>
        </div>
        <div class="kpi-card warn">
          <div class="kpi-label">告警总数</div>
          <div class="kpi-value">${summaryStats.alertCount}<span class="kpi-unit">条</span></div>
        </div>
        <div class="kpi-card danger">
          <div class="kpi-label">未关闭事件</div>
          <div class="kpi-value">${openAlertsSummary.total}<span class="kpi-unit">条</span></div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-label">设备在线率</div>
          <div class="kpi-value">${summaryStats.onlineRate}<span class="kpi-unit">%</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">未关闭事件摘要</div>
      <div class="sub-grid">
        <div class="sub-card">
          <h4>按状态分类</h4>
          ${Object.entries(openAlertsSummary.byStatus)
            .map(([k, v]) => {
              const cfg = AlertStatusConfig[k as AlertStatus];
              return `<div class="stat-row"><span class="label"><span class="dot" style="background:${cfg.color}"></span>${cfg.label}</span><span class="value" style="color:${cfg.color}">${v}</span></div>`;
            })
            .join("")}
        </div>
        <div class="sub-card">
          <h4>按等级分类</h4>
          ${Object.entries(openAlertsSummary.byLevel)
            .map(([k, v]) => {
              const levelMap: Record<string, { label: string; color: string }> = {
                urgent: { label: "紧急", color: "#FF3B3B" },
                important: { label: "重要", color: "#FF7A00" },
                normal: { label: "一般", color: "#FFD600" },
                info: { label: "提示", color: "#8FA4C7" },
              };
              const cfg = levelMap[k];
              return `<div class="stat-row"><span class="label"><span class="dot" style="background:${cfg.color}"></span>${cfg.label}</span><span class="value" style="color:${cfg.color}">${v}</span></div>`;
            })
            .join("")}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">未关闭事件明细（最旧 5 条）</div>
      ${
        openAlertsSummary.oldestOpen.length > 0
          ? `<table>
        <thead><tr><th>告警ID</th><th>标题</th><th>等级</th><th>状态</th><th>所属隧道</th><th>设备</th><th>创建时间</th></tr></thead>
        <tbody>${alertRows}</tbody>
      </table>`
          : `<div class="empty-hint">✓ 无未关闭事件</div>`
      }
    </div>

    <div class="section">
      <div class="section-title">各隧道设备在线率</div>
      <table>
        <thead><tr><th>隧道名称</th><th style="text-align:center;">设备总数</th><th style="text-align:center;">运行中</th><th style="text-align:center;">故障</th><th style="text-align:center;">离线</th><th style="text-align:center;">维保中</th><th style="text-align:center;">在线率</th></tr></thead>
        <tbody>${deviceRows}</tbody>
      </table>
    </div>
    `
        : `<div class="empty-hint" style="font-size:16px;padding:80px 20px;">⚠ 未选择任何隧道，请先选择隧道后再查看报表</div>`
    }
  </div>
  <div class="footer">
    <span>生成时间：${formatDateTime(new Date())}</span>
    <span>© 2026 智慧隧道运营管理平台</span>
  </div>
</div>
</body>
</html>`;
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportCSV = () => {
    if (!hasSelectedTunnels) return;
    const content = buildCSVContent();
    const filename = `隧道运营报表_${dateRange.start}_${dateRange.end}.csv`;
    triggerDownload(content, filename, "text/csv;charset=utf-8");
    setExportStatus((s) => ({ ...s, csv: true }));
    setTimeout(() => setExportStatus((s) => ({ ...s, csv: false })), 3000);
  };

  const handleExportHTML = () => {
    if (!hasSelectedTunnels) return;
    const content = buildHTMLContent();
    const filename = `隧道运营报表_${dateRange.start}_${dateRange.end}.html`;
    triggerDownload(content, filename, "text/html;charset=utf-8");
    setExportStatus((s) => ({ ...s, html: true }));
    setTimeout(() => setExportStatus((s) => ({ ...s, html: false })), 3000);
  };

  const EmptyState: React.FC<{ title?: string; hint?: string }> = ({
    title = "未选择隧道",
    hint = "请在上方筛选条件中选择至少一座隧道",
  }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-bg-elevated border border-border flex items-center justify-center mb-4">
        <MapPin className="w-10 h-10 text-text-muted opacity-50" />
      </div>
      <div className="text-lg font-medium text-text-secondary mb-2">{title}</div>
      <div className="text-sm text-text-muted">{hint}</div>
    </div>
  );

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
          <button
            onClick={handleExportCSV}
            disabled={!hasSelectedTunnels}
            className="btn btn-secondary text-xs disabled:opacity-50"
          >
            {exportStatus.csv ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                导出成功
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                导出 CSV
              </>
            )}
          </button>
          <button
            onClick={handleExportHTML}
            disabled={!hasSelectedTunnels}
            className="btn btn-secondary text-xs disabled:opacity-50"
          >
            {exportStatus.html ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                导出成功
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5" />
                导出 HTML
              </>
            )}
          </button>
          <button className="btn btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            刷新数据
          </button>
        </div>
      </div>

      <Card corner className="shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">筛选条件：</span>
          </div>

          <div className="relative" ref={dropdownRef}>
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

      {!hasSelectedTunnels ? (
        <Card corner accent className="flex-1 min-h-0">
          <EmptyState />
        </Card>
      ) : (
        <>
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
              {trafficTrend.length > 0 && (
                <div className="mt-2">
                  <MiniTrend
                    data={trafficTrend.map((d) => d.values.flow)}
                    color="#00D4FF"
                    height={30}
                  />
                </div>
              )}
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
              {alertTrend.length > 0 && (
                <div className="mt-2">
                  <MiniTrend
                    data={alertTrend.map((d) => d.values.urgent + d.values.important + d.values.normal)}
                    color="#FF7A00"
                    height={30}
                  />
                </div>
              )}
            </Card>

            <Card corner accent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">未关闭事件</span>
                <AlertCircle className="w-4 h-4 text-danger" />
              </div>
              <div className="flex items-end justify-between">
                <DataNumber
                  value={openAlertsSummary.total}
                  suffix=" 条"
                  size="lg"
                  color={openAlertsSummary.urgentImportant > 0 ? "danger" : "default"}
                  digits={0}
                />
                {openAlertsSummary.urgentImportant > 0 && (
                  <span className="text-[10px] text-danger px-1.5 py-0.5 rounded bg-danger/15 border border-danger/30">
                    高危 {openAlertsSummary.urgentImportant}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  待确认 {openAlertsSummary.byStatus[AlertStatus.PENDING]}
                </span>
                <span className="text-text-secondary flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  处置中 {openAlertsSummary.byStatus[AlertStatus.PROCESSING]}
                </span>
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
              {envTrend.length > 0 && (
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
              )}
            </Card>

            <Card corner accent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">平均能见度 / 温度</span>
                <Eye className="w-4 h-4 text-accent" />
              </div>
              <div className="flex items-end justify-between">
                <DataNumber
                  value={summaryStats.avgVisibility}
                  suffix=" m"
                  size="lg"
                  color="accent"
                  digits={0}
                />
              </div>
              {envTrend.length > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-warning" />
                    <span className="text-text-secondary">温度</span>
                    <span className="font-number text-warning font-semibold">{summaryStats.avgTemperature}℃</span>
                  </div>
                  <span className="font-number text-accent">湿度 {summaryStats.avgHumidity}%</span>
                </div>
              )}
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
                      <span>·</span>
                      <span>共 {dateRangeDays} 天</span>
                    </div>
                  }
                >
                  {trafficTrend.length > 0 ? (
                    <TrendChart
                      data={trafficTrend}
                      series={[
                        { key: "flow", name: "车流量(辆/日)", color: "#00D4FF" },
                        { key: "avgSpeed", name: "平均车速(km/h)", color: "#00C853" },
                      ]}
                      height={260}
                    />
                  ) : (
                    <EmptyState title="暂无车流数据" hint="当前筛选条件下无数据" />
                  )}
                </Card>
              )}

              {selectedMetrics.includes("alerts") && (
                <Card title="告警等级分布" corner accent className="col-span-4">
                  {alertLevelStats.total > 0 ? (
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
                  ) : (
                    <EmptyState title="暂无告警数据" hint="当前筛选条件下无数据" />
                  )}
                </Card>
              )}
            </div>

            <div className="grid grid-cols-12 gap-4">
              {selectedMetrics.includes("alerts") && (
                <Card title="告警趋势（按等级）" corner accent className="col-span-7">
                  {alertTrend.length > 0 ? (
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
                  ) : (
                    <EmptyState title="暂无告警趋势" hint="当前筛选条件下无数据" />
                  )}
                </Card>
              )}

              {selectedMetrics.includes("environment") && (
                <Card title="环境指标趋势" corner accent className="col-span-5">
                  {envTrend.length > 0 ? (
                    <TrendChart
                      data={envTrend}
                      series={[
                        { key: "co", name: "CO(ppm)", color: "#FF3B3B" },
                        { key: "temperature", name: "温度(℃)", color: "#FF7A00" },
                        { key: "humidity", name: "湿度(%)", color: "#00D4FF" },
                      ]}
                      height={260}
                    />
                  ) : (
                    <EmptyState title="暂无环境数据" hint="当前筛选条件下无数据" />
                  )}
                </Card>
              )}
            </div>

            <Card
              title="未关闭事件摘要"
              corner
              accent
              actions={
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={cn(
                    "px-2 py-0.5 rounded font-medium",
                    openAlertsSummary.urgentImportant > 0
                      ? "bg-danger/15 text-danger border border-danger/30"
                      : "bg-success/15 text-success border border-success/30"
                  )}>
                    {openAlertsSummary.urgentImportant > 0
                      ? `含 ${openAlertsSummary.urgentImportant} 条高危事件`
                      : "无高危事件"}
                  </span>
                </div>
              }
            >
              {openAlertsSummary.total > 0 ? (
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/30">
                      <div className="text-xs text-text-secondary mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        按状态分类
                      </div>
                      <div className="space-y-2.5">
                        {Object.entries(openAlertsSummary.byStatus).map(([k, v]) => {
                          const cfg = AlertStatusConfig[k as AlertStatus];
                          const pct = openAlertsSummary.total ? (v / openAlertsSummary.total) * 100 : 0;
                          return (
                            <div key={k}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="flex items-center gap-1.5" style={{ color: cfg.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                                  {cfg.label}
                                </span>
                                <span className="font-number font-semibold text-text-primary">{v}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/30">
                      <div className="text-xs text-text-secondary mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        按等级分类
                      </div>
                      <div className="space-y-2.5">
                        {Object.entries(openAlertsSummary.byLevel).map(([k, v]) => {
                          const levelMap: Record<string, { label: string; color: string }> = {
                            urgent: { label: "紧急", color: "#FF3B3B" },
                            important: { label: "重要", color: "#FF7A00" },
                            normal: { label: "一般", color: "#FFD600" },
                            info: { label: "提示", color: "#8FA4C7" },
                          };
                          const cfg = levelMap[k];
                          const pct = openAlertsSummary.total ? (v / openAlertsSummary.total) * 100 : 0;
                          return (
                            <div key={k}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="flex items-center gap-1.5" style={{ color: cfg.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                                  {cfg.label}
                                </span>
                                <span className="font-number font-semibold text-text-primary">{v}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-7">
                    <div className="text-xs text-text-secondary mb-2">待办优先：最旧未关闭 Top 5</div>
                    <div className="space-y-2">
                      {openAlertsSummary.oldestOpen.map((a) => {
                        const lvlCfg = AlertLevelConfig[a.level];
                        const stCfg = AlertStatusConfig[a.status];
                        return (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 p-2.5 rounded-lg bg-bg-elevated/30 border border-border/30 hover:border-border-light transition-colors"
                          >
                            <div
                              className="w-1.5 self-stretch rounded-full shrink-0"
                              style={{ backgroundColor: lvlCfg.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-text-primary truncate">
                                  {a.title}
                                </span>
                                <span
                                  className="text-[10px] px-1.5 py-px rounded shrink-0"
                                  style={{ backgroundColor: lvlCfg.color + "20", color: lvlCfg.color }}
                                >
                                  {lvlCfg.label}
                                </span>
                                <span
                                  className="text-[10px] px-1.5 py-px rounded shrink-0"
                                  style={{ backgroundColor: stCfg.color + "20", color: stCfg.color }}
                                >
                                  {stCfg.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {a.tunnelName}
                                </span>
                                <span>{a.deviceName}</span>
                                <span className="ml-auto">{a.createdAt}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <div className="text-success font-medium mb-1">所有事件均已闭环</div>
                  <div className="text-xs text-text-muted">
                    报表周期内共 {filteredAlerts.length} 条告警，当前无未关闭事项
                  </div>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-12 gap-4">
              <Card title="各隧道设备在线率统计" corner accent className="col-span-7">
                {MOCK_TUNNELS.filter((t) => selectedTunnels.includes(t.id)).length > 0 ? (
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
                ) : (
                  <EmptyState title="暂无设备数据" hint="当前筛选条件下无设备" />
                )}
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
                {topAlertDevices.length > 0 ? (
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
                  </div>
                ) : (
                  <EmptyState title="暂无告警数据" hint="当前筛选条件下无设备告警记录" />
                )}
              </Card>
            </div>

            <Card
              title="日报导出预览"
              corner
              accent
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={!hasSelectedTunnels}
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dark disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    导出 CSV
                  </button>
                  <button
                    onClick={handleExportHTML}
                    disabled={!hasSelectedTunnels}
                    className="flex items-center gap-1.5 text-xs text-success hover:text-success-dark disabled:opacity-50"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    导出 HTML
                  </button>
                </div>
              }
            >
              {hasSelectedTunnels ? (
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
                  <div className="grid grid-cols-5 gap-4 mb-5">
                    <PreviewItem label="累计车流量" value={`${formatNumber(summaryStats.totalTraffic)} 辆`} />
                    <PreviewItem label="告警总数" value={`${summaryStats.alertCount} 条`} highlight={summaryStats.alertCount > 50} />
                    <PreviewItem label="未关闭事件" value={`${openAlertsSummary.total} 条`} highlight={openAlertsSummary.urgentImportant > 0} />
                    <PreviewItem label="设备在线率" value={`${summaryStats.onlineRate}%`} />
                    <PreviewItem label="平均CO浓度" value={`${summaryStats.avgCO} ppm`} highlight={summaryStats.avgCO > 80} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="p-3 rounded bg-bg-card/70 border border-border/30">
                      <div className="text-xs text-text-secondary mb-2">近周期车流趋势</div>
                      {trafficTrend.length > 0 && (
                        <MiniTrend data={trafficTrend.map((d) => d.values.flow)} color="#00D4FF" height={40} />
                      )}
                    </div>
                    <div className="p-3 rounded bg-bg-card/70 border border-border/30">
                      <div className="text-xs text-text-secondary mb-2">近周期告警趋势</div>
                      {alertTrend.length > 0 && (
                        <MiniTrend
                          data={alertTrend.map((d) => d.values.urgent + d.values.important + d.values.normal)}
                          color="#FF7A00"
                          height={40}
                        />
                      )}
                    </div>
                  </div>
                  {openAlertsSummary.total > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-danger/5 border border-danger/20">
                      <div className="flex items-center gap-2 text-xs text-danger font-medium mb-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        未关闭事件提醒（{openAlertsSummary.total} 条）
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-bg-card/60 text-text-secondary border border-border/30">
                          待确认: <span className="text-danger font-semibold">{openAlertsSummary.byStatus[AlertStatus.PENDING]}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-bg-card/60 text-text-secondary border border-border/30">
                          处置中: <span className="text-accent font-semibold">{openAlertsSummary.byStatus[AlertStatus.PROCESSING]}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-bg-card/60 text-text-secondary border border-border/30">
                          高危: <span className="text-danger font-semibold">{openAlertsSummary.urgentImportant}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border/30">
                    <span>生成时间：{formatDate(new Date())} {formatTime(new Date())}</span>
                    <span>© 2026 智慧隧道运营管理平台</span>
                  </div>
                </div>
              ) : (
                <EmptyState />
              )}
            </Card>
          </div>
        </>
      )}
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

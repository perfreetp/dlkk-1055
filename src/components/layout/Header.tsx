import React, { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Maximize2,
  Minimize2,
  User,
  ChevronDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { useMonitorStore } from "@/store/useMonitorStore";
import { AlertLevel, AlertStatus } from "@/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/format";
import { MOCK_TUNNELS } from "@/data/mockData";

const Header: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [fs, setFs] = useState(false);
  const alerts = useMonitorStore((s) => s.alerts);
  const selectedTunnelId = useMonitorStore((s) => s.selectedTunnelId);
  const setSelectedTunnel = useMonitorStore((s) => s.setSelectedTunnel);
  const nav = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pending = alerts.filter(
    (a) => a.status === AlertStatus.PENDING
  );
  const urgent = pending.filter((a) => a.level === AlertLevel.URGENT);

  const toggleFs = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFs(true);
      } else {
        await document.exitFullscreen();
        setFs(false);
      }
    } catch (_) {}
  };

  return (
    <header className="h-16 bg-bg-secondary/80 backdrop-blur border-b border-border/60 flex items-center px-6 gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-text-secondary text-sm">隧道：</div>
        <div className="relative">
          <select
            value={selectedTunnelId}
            onChange={(e) => setSelectedTunnel(e.target.value)}
            className="select pr-8 appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">全部隧道（{MOCK_TUNNELS.length}座）</option>
            {MOCK_TUNNELS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.direction}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9 w-full"
            placeholder="搜索设备编号、告警关键词、处置单号..."
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-text-secondary text-sm font-number">
        <Clock className="w-4 h-4 text-accent" />
        <span className="tabular-nums">{formatDateTime(now)}</span>
      </div>

      <div className="h-6 w-px bg-border mx-2" />

      <button
        onClick={() => nav("/alerts")}
        className={cn(
          "relative w-10 h-10 rounded-md flex items-center justify-center transition-all",
          urgent.length > 0
            ? "bg-danger/15 text-danger hover:bg-danger/25 alert-pulse"
            : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
        )}
        title="告警提醒"
      >
        <Bell className="w-5 h-5" />
        {pending.length > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
              urgent.length > 0
                ? "bg-danger text-white"
                : "bg-warning text-white"
            )}
          >
            {pending.length}
          </span>
        )}
      </button>

      <button
        onClick={toggleFs}
        className="w-10 h-10 rounded-md flex items-center justify-center text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
        title="全屏"
      >
        {fs ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      <div className="h-6 w-px bg-border mx-2" />

      <div className="flex items-center gap-3 pl-1">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-accent-dark/40 border border-accent/30 flex items-center justify-center">
          <User className="w-5 h-5 text-accent" />
        </div>
        <div className="text-sm leading-tight hidden md:block">
          <div className="text-text-primary font-medium">周监控</div>
          <div className="text-text-muted text-xs">监控一班 · 值班员</div>
        </div>
      </div>

      {urgent.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-danger/10 border border-danger/30 text-danger text-sm font-medium animate-pulse ml-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{urgent.length} 条紧急告警待处理</span>
        </div>
      )}
    </header>
  );
};

export default Header;

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MonitorPlay,
  AlertTriangle,
  Server,
  ClipboardList,
  FileWarning,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/format";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const MENU = [
  { path: "/dashboard", label: "总览大屏", icon: LayoutDashboard, badge: "实时" },
  { path: "/video-wall", label: "视频墙", icon: MonitorPlay },
  { path: "/alerts", label: "告警中心", icon: AlertTriangle, countKey: "pending" },
  { path: "/devices", label: "设备台账", icon: Server },
  { path: "/inspection", label: "巡检任务", icon: ClipboardList },
  { path: "/incidents", label: "事件处置", icon: FileWarning, countKey: "open" },
  { path: "/reports", label: "统计报表", icon: BarChart3 },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const loc = useLocation();

  return (
    <aside
      className={cn(
        "h-full bg-bg-secondary/80 backdrop-blur border-r border-border flex flex-col transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
              <Activity className="w-5 h-5 text-bg-primary" />
            </div>
            <div>
              <div className="font-display font-bold text-accent text-glow leading-none tracking-wide text-lg">
                TMS
              </div>
              <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                Tunnel Monitor
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow mx-auto">
            <Activity className="w-5 h-5 text-bg-primary" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {MENU.map((item) => {
            const Icon = item.icon;
            const active =
              loc.pathname === item.path ||
              (item.path === "/dashboard" && loc.pathname === "/");
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all relative",
                    active
                      ? "bg-accent/10 text-accent border border-accent/30 shadow-glow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                  )}
                  <Icon className={cn("w-5 h-5 shrink-0", active && "drop-shadow-[0_0_4px_rgba(0,212,255,0.6)]")} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-border/60 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors text-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertLevel,
  AlertStatus,
  DeviceStatus,
  DeviceType,
} from "@/types";

export { AlertLevel, AlertStatus, DeviceStatus, DeviceType };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd HH:mm:ss", { locale: zhCN });
}

export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd", { locale: zhCN });
}

export function formatTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm:ss", { locale: zhCN });
}

export function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatNumber(n: number, digits = 0) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const AlertLevelConfig: Record<
  AlertLevel,
  { label: string; color: string; bg: string; border: string; textColor: string }
> = {
  [AlertLevel.URGENT]: {
    label: "紧急",
    color: "#FF3B3B",
    bg: "bg-danger/15",
    border: "border-danger/50",
    textColor: "text-danger",
  },
  [AlertLevel.IMPORTANT]: {
    label: "重要",
    color: "#FF7A00",
    bg: "bg-warning/15",
    border: "border-warning/50",
    textColor: "text-warning",
  },
  [AlertLevel.NORMAL]: {
    label: "一般",
    color: "#FFD600",
    bg: "bg-info/15",
    border: "border-info/50",
    textColor: "text-info",
  },
  [AlertLevel.INFO]: {
    label: "提示",
    color: "#8FA4C7",
    bg: "bg-text-secondary/10",
    border: "border-text-secondary/30",
    textColor: "text-text-secondary",
  },
};

export const AlertStatusConfig: Record<
  AlertStatus,
  { label: string; color: string; bg: string }
> = {
  [AlertStatus.PENDING]: {
    label: "待确认",
    color: "#FF3B3B",
    bg: "bg-danger/15",
  },
  [AlertStatus.CONFIRMED]: {
    label: "已确认",
    color: "#FFD600",
    bg: "bg-info/15",
  },
  [AlertStatus.DISPATCHED]: {
    label: "已转派",
    color: "#FF7A00",
    bg: "bg-warning/15",
  },
  [AlertStatus.PROCESSING]: {
    label: "处置中",
    color: "#00D4FF",
    bg: "bg-accent/15",
  },
  [AlertStatus.CLOSED]: {
    label: "已闭环",
    color: "#00C853",
    bg: "bg-success/15",
  },
};

export const DeviceStatusConfig: Record<
  DeviceStatus,
  { label: string; color: string; dot: string; bg: string }
> = {
  [DeviceStatus.RUNNING]: {
    label: "运行中",
    color: "text-success",
    dot: "bg-success",
    bg: "bg-success/10",
  },
  [DeviceStatus.OFFLINE]: {
    label: "离线",
    color: "text-text-muted",
    dot: "bg-text-muted",
    bg: "bg-text-muted/10",
  },
  [DeviceStatus.FAULT]: {
    label: "故障",
    color: "text-danger",
    dot: "bg-danger",
    bg: "bg-danger/10",
  },
  [DeviceStatus.MAINTENANCE]: {
    label: "维保中",
    color: "text-accent",
    dot: "bg-accent",
    bg: "bg-accent/10",
  },
};

export const DeviceTypeConfig: Record<DeviceType, { label: string; icon: string }> = {
  [DeviceType.LIGHTING]: { label: "照明系统", icon: "Lightbulb" },
  [DeviceType.FAN]: { label: "通风风机", icon: "Fan" },
  [DeviceType.PUMP]: { label: "排水水泵", icon: "Droplets" },
  [DeviceType.FIRE]: { label: "消防设备", icon: "Flame" },
  [DeviceType.SENSOR]: { label: "环境传感器", icon: "Gauge" },
  [DeviceType.CAMERA]: { label: "摄像头", icon: "Camera" },
};

export function randomBetween(min: number, max: number, digits = 0) {
  const n = Math.random() * (max - min) + min;
  return Number(n.toFixed(digits));
}

export function randomId(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type DeadlineStatus = "overdue" | "urgent" | "warning" | "normal";

export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diff = dl - now;
  if (diff < 0) return "overdue";
  if (diff < 1000 * 60 * 60) return "urgent";
  if (diff < 1000 * 60 * 60 * 24) return "warning";
  return "normal";
}

export function formatCountdown(deadline: string): string {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diff = dl - now;
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const prefix = diff < 0 ? "超期 " : "剩余 ";
  if (days > 0) return `${prefix}${days}天${hours}时${minutes}分`;
  if (hours > 0) return `${prefix}${hours}时${minutes}分`;
  return `${prefix}${minutes}分`;
}

export const DEADLINE_STATUS_CONFIG: Record<
  DeadlineStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  overdue: { label: "已超期", color: "#FF3B3B", bg: "bg-danger/15", border: "border-danger/50" },
  urgent: { label: "1小时内", color: "#FF7A00", bg: "bg-warning/20", border: "border-warning/60" },
  warning: { label: "24小时内", color: "#FFD600", bg: "bg-info/20", border: "border-info/60" },
  normal: { label: "正常", color: "#00C853", bg: "bg-success/10", border: "border-success/40" },
};

export const PRIORITY_ORDER: Record<AlertLevel, number> = {
  [AlertLevel.URGENT]: 0,
  [AlertLevel.IMPORTANT]: 1,
  [AlertLevel.NORMAL]: 2,
  [AlertLevel.INFO]: 3,
};

export const DEADLINE_ORDER: Record<DeadlineStatus, number> = {
  overdue: 0,
  urgent: 1,
  warning: 2,
  normal: 3,
};

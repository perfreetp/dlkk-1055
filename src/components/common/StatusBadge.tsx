import React from "react";
import {
  AlertLevel,
  AlertLevelConfig,
  AlertStatus,
  AlertStatusConfig,
  DeviceStatus,
  DeviceStatusConfig,
} from "@/utils/format";
import { cn } from "@/utils/format";

interface StatusBadgeProps {
  type: "alert" | "device";
  status: AlertLevel | AlertStatus | DeviceStatus;
  showDot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  showDot = true,
  pulse,
  className,
}) => {
  const cfg =
    type === "alert"
      ? AlertLevelConfig.hasOwnProperty(status)
        ? (AlertLevelConfig as any)[status]
        : (AlertStatusConfig as any)[status]
      : (DeviceStatusConfig as any)[status];

  if (!cfg) return null;

  return (
    <span
      className={cn(
        "badge",
        cfg.bg,
        cfg.textColor,
        cfg.border && cfg.border,
        type === "alert" && "border",
        className
      )}
      style={{ color: cfg.color }}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            pulse && (status === AlertLevel.URGENT ? "alert-pulse" : status === AlertLevel.IMPORTANT ? "alert-pulse-warning" : "")
          )}
          style={{ backgroundColor: cfg.color }}
        />
      )}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;

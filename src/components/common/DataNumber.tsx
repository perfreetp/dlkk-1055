import React, { useEffect, useState } from "react";
import { cn, formatNumber } from "@/utils/format";

interface DataNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "default" | "accent" | "success" | "danger" | "warning" | "info";
  glow?: boolean;
  className?: string;
  digits?: number;
}

const sizeMap = {
  sm: "text-lg font-medium",
  md: "text-2xl font-semibold",
  lg: "text-3xl font-bold",
  xl: "text-5xl font-extrabold font-display",
};

const colorMap = {
  default: "text-text-primary",
  accent: "text-accent",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-text-secondary",
};

export const DataNumber: React.FC<DataNumberProps> = ({
  value,
  suffix,
  prefix,
  label,
  size = "md",
  color = "default",
  glow,
  className,
  digits = 0,
}) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const end = value;
    const diff = end - start;
    const duration = 500;
    const startTime = Date.now();

    let rafId: number;
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * ease);
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <div className="text-xs text-text-secondary mb-1 tracking-wide">{label}</div>
      )}
      <div
        className={cn(
          "font-number leading-none",
          sizeMap[size],
          colorMap[color],
          glow && (color === "danger" ? "text-glow-danger" : "text-glow")
        )}
      >
        {prefix}
        {formatNumber(display, digits)}
        {suffix}
      </div>
    </div>
  );
};

export default DataNumber;

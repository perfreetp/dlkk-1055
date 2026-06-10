import ReactECharts from "echarts-for-react";
import React from "react";

interface MiniTrendProps {
  data: number[];
  color?: string;
  height?: number;
  areaOpacity?: number;
  smooth?: boolean;
}

export const MiniTrend: React.FC<MiniTrendProps> = ({
  data,
  color = "#00D4FF",
  height = 40,
  areaOpacity = 0.2,
  smooth = true,
}) => {
  const option = {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: {
      type: "category",
      show: false,
      data: data.map((_, i) => i),
    },
    yAxis: { type: "value", show: false },
    tooltip: { show: false },
    series: [
      {
        type: "line",
        data,
        symbol: "none",
        smooth,
        lineStyle: { color, width: 1.5 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + Math.round(areaOpacity * 255).toString(16).padStart(2, "0") },
              { offset: 1, color: color + "00" },
            ],
          },
        },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height, width: "100%" }} opts={{ renderer: "svg" }} />;
};

interface TrendChartProps {
  data: { time: string; values: Record<string, number> }[];
  series: { key: string; name: string; color: string }[];
  height?: number;
  yUnit?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  series,
  height = 300,
  yUnit = "",
}) => {
  const option = {
    backgroundColor: "transparent",
    grid: { left: 48, right: 20, top: 36, bottom: 32 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(18,31,56,0.95)",
      borderColor: "#2A4063",
      textStyle: { color: "#EAF2FF" },
      axisPointer: {
        lineStyle: { color: "rgba(0,212,255,0.4)" },
      },
    },
    legend: {
      data: series.map((s) => s.name),
      textStyle: { color: "#8FA4C7", fontSize: 12 },
      right: 10,
      top: 4,
      icon: "roundRect",
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.time),
      axisLine: { lineStyle: { color: "#2A4063" } },
      axisLabel: { color: "#5A7298", fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: yUnit,
      nameTextStyle: { color: "#5A7298", fontSize: 11, padding: [0, 30, 0, 0] },
      axisLine: { show: false },
      axisLabel: { color: "#5A7298", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(42,64,99,0.3)", type: "dashed" } },
    },
    series: series.map((s) => ({
      name: s.name,
      type: "line",
      data: data.map((d) => d.values[s.key]),
      symbol: "none",
      smooth: true,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: s.color + "33" },
            { offset: 1, color: s.color + "00" },
          ],
        },
      },
    })),
  };
  return <ReactECharts option={option} style={{ height }} />;
};

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  height = 200,
  centerLabel,
  centerValue,
}) => {
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(18,31,56,0.95)",
      borderColor: "#2A4063",
      textStyle: { color: "#EAF2FF" },
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 8,
      top: "center",
      textStyle: { color: "#8FA4C7", fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
    },
    graphic: centerLabel || centerValue ? [
      {
        type: "text",
        left: "25%",
        top: "45%",
        style: {
          text: centerValue ?? "",
          textAlign: "center",
          fill: "#EAF2FF",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
        },
      },
      {
        type: "text",
        left: "25%",
        top: "62%",
        style: {
          text: centerLabel ?? "",
          textAlign: "center",
          fill: "#8FA4C7",
          fontSize: 12,
        },
      },
    ] : [],
    series: [
      {
        type: "pie",
        radius: ["55%", "75%"],
        center: ["28%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderColor: "#121F38",
          borderWidth: 2,
          borderRadius: 2,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 4,
          itemStyle: {
            shadowBlur: 16,
            shadowColor: "rgba(0,0,0,0.5)",
          },
        },
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} />;
};

interface BarChartProps {
  categories: string[];
  data: { name: string; values: number[]; color: string }[];
  height?: number;
  horizontal?: boolean;
  yUnit?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  categories,
  data,
  height = 300,
  horizontal = false,
  yUnit = "",
}) => {
  const option = {
    backgroundColor: "transparent",
    grid: { left: horizontal ? 80 : 48, right: 20, top: 36, bottom: 32 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(18,31,56,0.95)",
      borderColor: "#2A4063",
      textStyle: { color: "#EAF2FF" },
    },
    legend: {
      data: data.map((d) => d.name),
      textStyle: { color: "#8FA4C7", fontSize: 12 },
      right: 10,
      top: 4,
      icon: "roundRect",
    },
    [horizontal ? "yAxis" : "xAxis"]: {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: "#2A4063" } },
      axisLabel: { color: "#5A7298", fontSize: 11 },
      axisTick: { show: false },
    },
    [horizontal ? "xAxis" : "yAxis"]: {
      type: "value",
      name: yUnit,
      nameTextStyle: { color: "#5A7298", fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: "#5A7298", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(42,64,99,0.3)", type: "dashed" } },
    },
    series: data.map((d) => ({
      name: d.name,
      type: "bar",
      data: d.values,
      itemStyle: {
        color: {
          type: "linear",
          x: 0, y: horizontal ? 0 : 1, x2: horizontal ? 1 : 0, y2: horizontal ? 0 : 0,
          colorStops: [
            { offset: 0, color: d.color + "aa" },
            { offset: 1, color: d.color + "55" },
          ],
        },
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      barWidth: data.length > 1 ? "45%" : "60%",
    })),
  };
  return <ReactECharts option={option} style={{ height }} />;
};

interface GaugeProps {
  value: number;
  max: number;
  unit?: string;
  thresholds?: { value: number; color: string }[];
  height?: number;
  label?: string;
}

export const GaugeChart: React.FC<GaugeProps> = ({
  value,
  max,
  unit = "",
  thresholds,
  height = 140,
  label,
}) => {
  const pickColor = () => {
    if (!thresholds) return "#00D4FF";
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) return thresholds[i].color;
    }
    return thresholds[0]?.color || "#00D4FF";
  };
  const color = pickColor();
  const option = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        radius: "95%",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max,
        splitNumber: 5,
        center: ["50%", "60%"],
        progress: {
          show: true,
          width: 10,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [[1, "rgba(42,64,99,0.3)"]],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: {
          offsetCenter: [0, "30%"],
          fontSize: 11,
          color: "#8FA4C7",
        },
        detail: {
          offsetCenter: [0, "-5%"],
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 700,
          color,
          fontFamily: "JetBrains Mono, monospace",
          formatter: `{value}${unit}`,
        },
        data: [{ value: Number(value.toFixed(1)), name: label }],
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} />;
};

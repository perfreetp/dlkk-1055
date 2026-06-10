import {
  Tunnel,
  Device,
  DeviceType,
  DeviceStatus,
  Alert,
  AlertLevel,
  AlertStatus,
  EnvironmentData,
  TrafficData,
  Camera,
  InspectionRoute,
  InspectionTask,
  Incident,
  IncidentTimelineItem,
  IncidentFeedback,
  Staff,
  DeviceMaintenanceRecord,
} from "@/types";
import { pickRandom, randomBetween, randomId, formatDateTime, formatDate } from "@/utils/format";
import { subDays, subHours, addDays, addHours } from "date-fns";

export const MOCK_TUNNELS: Tunnel[] = [
  { id: "t1", name: "云顶山一号隧道", length: 4860, lanes: 3, direction: "上行", district: "A标段" },
  { id: "t2", name: "云顶山二号隧道", length: 3250, lanes: 3, direction: "下行", district: "A标段" },
  { id: "t3", name: "青龙峡隧道", length: 2180, lanes: 2, direction: "双向", district: "B标段" },
  { id: "t4", name: "翠屏山隧道", length: 5620, lanes: 3, direction: "上行", district: "C标段" },
];

const DEVICE_NAMES: Record<DeviceType, string[]> = {
  [DeviceType.LIGHTING]: ["LED照明灯组", "应急照明灯", "洞口加强灯", "过渡段灯", "出口段灯"],
  [DeviceType.FAN]: ["射流风机", "轴流风机", "排烟风机", "送风机"],
  [DeviceType.PUMP]: ["集水池排水泵", "消防稳压泵", "喷淋泵", "排污泵"],
  [DeviceType.FIRE]: ["消防栓", "火灾探测器", "手动报警按钮", "灭火器组", "消防水炮"],
  [DeviceType.SENSOR]: ["CO/VI检测器", "风速风向检测器", "温湿度传感器", "亮度检测器", "NOx检测器"],
  [DeviceType.CAMERA]: ["固定摄像机", "云台摄像机", "交通事件检测", "全景摄像机"],
};

const LOCATION_TEMPLATES = [
  "K{km}+{m}左",
  "K{km}+{m}右",
  "洞口{m}m处",
  "{n}号行车道上方",
  "检修通道{m}m处",
];

function generateLocation(): string {
  const tpl = pickRandom(LOCATION_TEMPLATES);
  return tpl
    .replace("{km}", String(randomBetween(1, 5)))
    .replace("{m}", String(randomBetween(100, 900, 10)))
    .replace("{n}", String(randomBetween(1, 3)));
}

function generateDevices(): Device[] {
  const devices: Device[] = [];
  const types = Object.values(DeviceType);

  MOCK_TUNNELS.forEach((tunnel) => {
    types.forEach((type, ti) => {
      const count =
        type === DeviceType.SENSOR
          ? 8
          : type === DeviceType.CAMERA
          ? 10
          : type === DeviceType.LIGHTING
          ? 20
          : type === DeviceType.FAN
          ? 6
          : type === DeviceType.PUMP
          ? 4
          : 6;

      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        const status: DeviceStatus =
          roll < 0.03
            ? DeviceStatus.FAULT
            : roll < 0.08
            ? DeviceStatus.OFFLINE
            : roll < 0.12
            ? DeviceStatus.MAINTENANCE
            : DeviceStatus.RUNNING;

        const typePrefix = type.slice(0, 3).toUpperCase();
        const seq = String(i + 1).padStart(3, "0");
        const names = DEVICE_NAMES[type];

        devices.push({
          id: `d-${tunnel.id}-${ti}-${i}`,
          code: `${typePrefix}-${tunnel.id.toUpperCase()}-${seq}`,
          name: `${pickRandom(names)} ${i + 1}#`,
          type,
          tunnelId: tunnel.id,
          tunnelName: tunnel.name,
          location: generateLocation(),
          status,
          lastMaintenanceDate: formatDateTime(subDays(new Date(), randomBetween(1, 90))),
          installedAt: formatDateTime(subDays(new Date(), randomBetween(365, 1200))),
          params: generateDeviceParams(type, status),
          position: {
            x: 5 + (i / count) * 90 + randomBetween(-3, 3),
            y: 20 + ti * 12 + randomBetween(-3, 3),
          },
        });
      }
    });
  });
  return devices;
}

function generateDeviceParams(type: DeviceType, status: DeviceStatus) {
  if (status !== DeviceStatus.RUNNING && Math.random() > 0.3) return undefined;
  switch (type) {
    case DeviceType.LIGHTING:
      return { brightness: `${randomBetween(60, 100)}%`, power: `${randomBetween(80, 240)}W`, runtime: `${randomBetween(1000, 8000)}h` };
    case DeviceType.FAN:
      return { speed: `${randomBetween(600, 1480)}rpm`, current: `${randomBetween(10, 45)}A`, vibration: `${randomBetween(0.5, 3.2)}mm/s` };
    case DeviceType.PUMP:
      return { pressure: `${randomBetween(0.2, 0.8)}MPa`, flow: `${randomBetween(20, 120)}m³/h`, level: `${randomBetween(15, 85)}%` };
    case DeviceType.FIRE:
      return { pressure: `${randomBetween(0.4, 1.2)}MPa`, status: "正常" };
    case DeviceType.SENSOR:
      return { interval: "5s", status: "采集正常" };
    case DeviceType.CAMERA:
      return { resolution: "1080P", fps: "25", bitrate: "4Mbps" };
    default:
      return undefined;
  }
}

export const MOCK_DEVICES: Device[] = generateDevices();

function generateMaintenanceRecords(): DeviceMaintenanceRecord[] {
  const records: DeviceMaintenanceRecord[] = [];
  MOCK_DEVICES.slice(0, 60).forEach((d, idx) => {
    const count = randomBetween(1, 3);
    for (let i = 0; i < count; i++) {
      records.push({
        id: `mr-${idx}-${i}`,
        deviceId: d.id,
        type: pickRandom(["定期巡检", "故障维修", "保养维护", "更换配件"]),
        date: formatDateTime(subDays(new Date(), randomBetween(1, 180))),
        operator: pickRandom(["张建国", "李明伟", "王海涛", "赵鹏飞", "陈志强"]),
        description: pickRandom([
          "设备运行状态检查，紧固接线端子",
          "更换过滤器，清洁散热片",
          "异常震动检修，更换轴承",
          "固件升级，参数重新校准",
          "例行保养，添加润滑油",
        ]),
        result: pickRandom(["修复完成，恢复运行", "运行正常，无异常", "待进一步观察", "配件待采购"]),
      });
    }
  });
  return records;
}

export const MOCK_MAINTENANCE_RECORDS: DeviceMaintenanceRecord[] = generateMaintenanceRecords();

const ALERT_TITLES: Record<AlertLevel, { title: string; content: string }[]> = {
  [AlertLevel.URGENT]: [
    { title: "火灾报警触发", content: "K3+200处火灾探测器检测到异常烟雾浓度，联动消防系统启动" },
    { title: "CO浓度严重超标", content: "隧道中段CO浓度达到180ppm，已超过安全阈值上限" },
    { title: "照明系统大面积故障", content: "同一区域3组照明灯同时离线，现场亮度低于安全值" },
    { title: "风机联动失效", content: "2台主射流风机故障停机，通风能力严重不足" },
    { title: "能见度极低", content: "洞口段能见度低于35m，已触发交通管制建议" },
  ],
  [AlertLevel.IMPORTANT]: [
    { title: "排水泵异常停机", content: "3#集水池水泵电流异常，过载保护已动作" },
    { title: "摄像头离线", content: "K2+400处云台摄像机离线，信号中断超过5分钟" },
    { title: "温湿度异常", content: "隧道内温度达到38℃，湿度低于20%，需关注" },
    { title: "消防压力偏低", content: "消防管网压力降至0.35MPa，低于正常值0.5MPa" },
    { title: "风机运行参数偏离", content: "1#排烟风机电流高于额定值15%，需现场检查" },
  ],
  [AlertLevel.NORMAL]: [
    { title: "设备通信短暂中断", content: "传感器数据采集异常，10分钟内恢复正常" },
    { title: "照明亮度偏差", content: "亮度检测值与设定值偏差>15%，需检查调光器" },
    { title: "检修门状态异常", content: "东侧检修门被打开超过30分钟，提醒现场确认" },
    { title: "定期维保提醒", content: "6台设备距下次维保日期不足7天" },
    { title: "车流量接近饱和", content: "当前车流量达到设计容量85%，注意通行效率" },
  ],
  [AlertLevel.INFO]: [
    { title: "系统自检完成", content: "全系统日检完成，检查项256项，通过率98.5%" },
    { title: "巡检任务完成", content: "当日8条巡检路线已全部完成" },
    { title: "设备恢复运行", content: "3#照明回路经检修后恢复正常运行" },
    { title: "日报生成完成", content: "昨日运营日报已生成，可在报表中心查看" },
    { title: "天气提醒", content: "本时段有大雾，请注意洞口能见度监测" },
  ],
};

function weightedRandomLevel(): AlertLevel {
  const r = Math.random();
  if (r < 0.05) return AlertLevel.URGENT;
  if (r < 0.2) return AlertLevel.IMPORTANT;
  if (r < 0.7) return AlertLevel.NORMAL;
  return AlertLevel.INFO;
}

export function generateAlerts(count = 30): Alert[] {
  const alerts: Alert[] = [];
  const faultyDevices = MOCK_DEVICES.filter(
    (d) => d.status === DeviceStatus.FAULT || d.status === DeviceStatus.OFFLINE
  );

  for (let i = 0; i < count; i++) {
    const level = weightedRandomLevel();
    const template = pickRandom(ALERT_TITLES[level]);
    const isOld = i > count * 0.4;
    const device = pickRandom(i < 5 ? faultyDevices : MOCK_DEVICES);
    const hoursAgo = randomBetween(0, 720);
    const createdAt = subHours(new Date(), hoursAgo);

    const statusRoll = Math.random();
    let status: AlertStatus;
    if (!isOld && i < 8) {
      status = AlertStatus.PENDING;
    } else if (statusRoll < 0.35) {
      status = AlertStatus.CONFIRMED;
    } else if (statusRoll < 0.6) {
      status = AlertStatus.DISPATCHED;
    } else if (statusRoll < 0.85) {
      status = AlertStatus.PROCESSING;
    } else {
      status = AlertStatus.CLOSED;
    }

    alerts.push({
      id: randomId("a-"),
      deviceId: device.id,
      deviceName: device.name,
      tunnelId: device.tunnelId,
      tunnelName: device.tunnelName,
      level,
      title: template.title,
      content: template.content,
      status,
      createdAt: formatDateTime(createdAt),
      confirmedAt:
        status !== AlertStatus.PENDING
          ? formatDateTime(addHours(createdAt, randomBetween(0.05, 1)))
          : undefined,
      confirmedBy:
        status !== AlertStatus.PENDING
          ? pickRandom(["周监控", "吴值班", "郑班长", "孙调度"])
          : undefined,
      confirmRemark:
        status !== AlertStatus.PENDING
          ? pickRandom(["已联系现场", "需现场检查", "持续观察", "转养护处理"])
          : undefined,
      dispatchedTo:
        [AlertStatus.DISPATCHED, AlertStatus.PROCESSING, AlertStatus.CLOSED].includes(status)
          ? pickRandom(["张建国", "李明伟", "王海涛", "赵鹏飞"])
          : undefined,
      dispatchedAt:
        [AlertStatus.DISPATCHED, AlertStatus.PROCESSING, AlertStatus.CLOSED].includes(status)
          ? formatDateTime(addHours(createdAt, randomBetween(0.5, 3)))
          : undefined,
      closedAt:
        status === AlertStatus.CLOSED
          ? formatDateTime(addHours(createdAt, randomBetween(3, 48)))
          : undefined,
    });
  }
  return alerts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const MOCK_ALERTS: Alert[] = generateAlerts(45);

function generateEnvironmentHistory(tunnelId: string, hours = 24): EnvironmentData[] {
  const arr: EnvironmentData[] = [];
  const now = new Date();
  for (let i = hours * 12; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000);
    const hourFactor = Math.sin(((t.getHours() - 6) / 24) * Math.PI * 2);
    arr.push({
      timestamp: formatDateTime(t),
      tunnelId,
      co: Math.max(5, 35 + hourFactor * 20 + randomBetween(-8, 8, 1)),
      visibility: Math.max(50, 350 - hourFactor * 120 + randomBetween(-40, 40)),
      temperature: 18 + hourFactor * 8 + randomBetween(-2, 2, 1),
      humidity: 65 - hourFactor * 15 + randomBetween(-5, 5, 1),
      windSpeed: Math.max(0.1, 1.8 + Math.sin(i / 10) * 0.8 + randomBetween(-0.3, 0.3, 2)),
      windDirection: pickRandom(["东风", "东南风", "南风", "西南风", "西风"]),
    });
  }
  return arr;
}

export function getAllEnvironmentData() {
  const map: Record<string, EnvironmentData[]> = {};
  MOCK_TUNNELS.forEach((t) => (map[t.id] = generateEnvironmentHistory(t.id)));
  return map;
}

export const MOCK_ENVIRONMENT = getAllEnvironmentData();

export function getLatestEnvironment(tunnelId?: string) {
  const env = tunnelId
    ? MOCK_ENVIRONMENT[tunnelId]
    : Object.values(MOCK_ENVIRONMENT).flat();
  if (tunnelId) {
    return env[env.length - 1];
  }
  const latests = Object.values(MOCK_ENVIRONMENT).map((e) => e[e.length - 1]);
  return {
    timestamp: latests[0].timestamp,
    tunnelId: "all",
    co: latests.reduce((a, b) => a + b.co, 0) / latests.length,
    visibility: latests.reduce((a, b) => a + b.visibility, 0) / latests.length,
    temperature: latests.reduce((a, b) => a + b.temperature, 0) / latests.length,
    humidity: latests.reduce((a, b) => a + b.humidity, 0) / latests.length,
    windSpeed: latests.reduce((a, b) => a + b.windSpeed, 0) / latests.length,
    windDirection: latests[0].windDirection,
  } as EnvironmentData;
}

function generateTrafficHistory(tunnelId: string, hours = 24): TrafficData[] {
  const arr: TrafficData[] = [];
  const now = new Date();
  for (let i = hours * 6; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 10 * 60 * 1000);
    const h = t.getHours();
    let peakFactor = 0.3;
    if ((h >= 7 && h <= 9) || (h >= 17 && h <= 19)) peakFactor = 0.95;
    else if (h >= 10 && h <= 16) peakFactor = 0.7;
    else if (h >= 22 || h <= 5) peakFactor = 0.1;
    const base = 800 * peakFactor;
    const flow = base + randomBetween(-100, 100);
    const laneFactor = 1 / (randomBetween(2.2, 3));
    arr.push({
      timestamp: formatDateTime(t),
      tunnelId,
      flow: Math.round(flow),
      avgSpeed: Math.round(60 + (1 - peakFactor) * 35 + randomBetween(-8, 8)),
      occupancy: Math.min(95, Math.round(peakFactor * 100 + randomBetween(-5, 5))),
      lane1Flow: Math.round(flow * laneFactor),
      lane2Flow: Math.round(flow * laneFactor * 0.95),
      lane3Flow: Math.round(flow * laneFactor * 0.9),
    });
  }
  return arr;
}

export function getAllTrafficData() {
  const map: Record<string, TrafficData[]> = {};
  MOCK_TUNNELS.forEach((t) => (map[t.id] = generateTrafficHistory(t.id)));
  return map;
}

export const MOCK_TRAFFIC = getAllTrafficData();

export function getLatestTraffic(tunnelId?: string) {
  if (tunnelId) {
    const list = MOCK_TRAFFIC[tunnelId];
    return list[list.length - 1];
  }
  const latests = Object.values(MOCK_TRAFFIC).map((e) => e[e.length - 1]);
  return {
    timestamp: latests[0].timestamp,
    tunnelId: "all",
    flow: latests.reduce((a, b) => a + b.flow, 0),
    avgSpeed: Math.round(latests.reduce((a, b) => a + b.avgSpeed, 0) / latests.length),
    occupancy: Math.round(latests.reduce((a, b) => a + b.occupancy, 0) / latests.length),
    lane1Flow: latests.reduce((a, b) => a + b.lane1Flow, 0),
    lane2Flow: latests.reduce((a, b) => a + b.lane2Flow, 0),
    lane3Flow: latests.reduce((a, b) => a + (b.lane3Flow || 0), 0),
  } as TrafficData;
}

export const MOCK_CAMERAS: Camera[] = (() => {
  const list: Camera[] = [];
  let idx = 0;
  MOCK_TUNNELS.forEach((tunnel) => {
    const groups = ["洞口段", "过渡段", "中段", "出口段", "全景"];
    const count = 12;
    for (let i = 0; i < count; i++) {
      idx++;
      list.push({
        id: `cam-${idx}`,
        code: `CAM-${tunnel.id.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        name: `${tunnel.name} ${pickRandom(groups)}摄像头 ${i + 1}`,
        tunnelId: tunnel.id,
        tunnelName: tunnel.name,
        location: generateLocation(),
        group: pickRandom(groups),
        online: Math.random() > 0.08,
      });
    }
  });
  return list;
})();

export const MOCK_STAFF: Staff[] = [
  { id: "s1", name: "周监控", role: "duty", phone: "138****1234", team: "监控一班" },
  { id: "s2", name: "吴值班", role: "duty", phone: "138****2345", team: "监控一班" },
  { id: "s3", name: "郑班长", role: "duty", phone: "138****3456", team: "监控二班" },
  { id: "s4", name: "孙调度", role: "duty", phone: "138****4567", team: "监控二班" },
  { id: "s5", name: "张建国", role: "maintenance", phone: "139****5678", team: "养护一组" },
  { id: "s6", name: "李明伟", role: "maintenance", phone: "139****6789", team: "养护一组" },
  { id: "s7", name: "王海涛", role: "maintenance", phone: "139****7890", team: "养护二组" },
  { id: "s8", name: "赵鹏飞", role: "maintenance", phone: "139****8901", team: "养护二组" },
  { id: "s9", name: "陈志强", role: "inspector", phone: "137****9012", team: "巡检一班" },
  { id: "s10", name: "刘亚军", role: "inspector", phone: "137****0123", team: "巡检一班" },
  { id: "s11", name: "黄立军", role: "inspector", phone: "137****1234", team: "巡检二班" },
];

const ROUTE_CHECK_ITEMS = [
  "照明灯具外观及亮度检查",
  "风机运行状态及异响检查",
  "消防设备压力及完整性检查",
  "排水设施液位检查",
  "线缆桥架及箱盒密封检查",
  "路面及路缘石完整性",
  "交通标志清晰度检查",
  "诱导标及轮廓标完好性",
  "消火栓及灭火器有效性",
  "设备间卫生及温湿度",
];

export const MOCK_ROUTES: InspectionRoute[] = MOCK_TUNNELS.flatMap((t, ti) => [
  {
    id: `r-${t.id}-1`,
    name: `${t.name} 日常巡检路线 A`,
    tunnelId: t.id,
    tunnelName: t.name,
    checkPoints: [
      { name: "洞口段 K0+000 ~ K0+500", items: ROUTE_CHECK_ITEMS.slice(0, 4) },
      { name: "过渡段 K0+500 ~ K1+200", items: ROUTE_CHECK_ITEMS.slice(2, 6) },
      { name: "中段 K1+200 ~ K2+800", items: ROUTE_CHECK_ITEMS.slice(3, 8) },
      { name: "出口段 K2+800 ~ 终点", items: ROUTE_CHECK_ITEMS.slice(5, 10) },
    ].slice(0, Math.max(2, 4 - ti)),
  },
  {
    id: `r-${t.id}-2`,
    name: `${t.name} 专项巡检路线 B`,
    tunnelId: t.id,
    tunnelName: t.name,
    checkPoints: [
      { name: "设备机房专项检查", items: ROUTE_CHECK_ITEMS.slice(0, 3).concat(ROUTE_CHECK_ITEMS.slice(9)) },
      { name: "消防系统全段检查", items: ["消防栓压力", "灭火器有效期", "报警按钮测试", "水炮动作测试"] },
    ],
  },
]);

function generateInspectionTasks(): InspectionTask[] {
  const tasks: InspectionTask[] = [];
  let idx = 0;
  MOCK_ROUTES.forEach((route, ri) => {
    for (let i = 0; i < 4; i++) {
      idx++;
      const d = subDays(new Date(), i - 1);
      const statusRoll = i === 0 ? Math.random() : 1;
      let status: InspectionTask["status"];
      let progress: number;
      if (i >= 2) {
        status = "completed";
        progress = 100;
      } else if (statusRoll < 0.35) {
        status = "pending";
        progress = 0;
      } else if (statusRoll < 0.8) {
        status = "in_progress";
        progress = randomBetween(10, 80, 10);
      } else {
        status = "abnormal";
        progress = randomBetween(60, 100, 10);
      }
      tasks.push({
        id: `it-${idx}`,
        code: `IT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(idx).padStart(3, "0")}`,
        routeId: route.id,
        routeName: route.name,
        inspector: pickRandom(MOCK_STAFF.filter((s) => s.role === "inspector")).name,
        scheduledDate: formatDate(d),
        timeSlot: pickRandom(["早班 08:00-12:00", "中班 12:00-18:00", "晚班 18:00-次日02:00"]),
        status,
        progress,
        abnormalCount: status === "abnormal" ? randomBetween(1, 4) : 0,
        checkPoints: route.checkPoints.map((cp) => ({
          name: cp.name,
          items: cp.items.map((name) => ({
            name,
            result:
              progress < 10 || (progress < 30 && Math.random() > 0.5)
                ? "na"
                : status === "abnormal" && Math.random() < 0.1
                ? "abnormal"
                : "normal",
            remark: status === "abnormal" && Math.random() < 0.15 ? "发现异常，已记录" : undefined,
          })),
        })),
      });
    }
  });
  return tasks.sort(
    (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );
}

export const MOCK_INSPECTION_TASKS: InspectionTask[] = generateInspectionTasks();

export function generateIncidents(alerts: Alert[]): Incident[] {
  const incidents: Incident[] = [];
  const dispatched = alerts.filter(
    (a) => a.status === AlertStatus.DISPATCHED || a.status === AlertStatus.PROCESSING || a.status === AlertStatus.CLOSED
  );
  dispatched.slice(0, 15).forEach((alert, idx) => {
    const phases = ["任务创建", "现场到场", "问题处置", "验收闭环"];
    let phase: number;
    let status: Incident["status"];
    if (alert.status === AlertStatus.CLOSED) {
      phase = 4;
      status = "closed";
    } else if (alert.status === AlertStatus.PROCESSING) {
      phase = Math.random() > 0.5 ? 3 : 2;
      status = phase === 3 ? "feedback" : "in_progress";
    } else {
      phase = 1;
      status = "pending";
    }

    const timeline: IncidentTimelineItem[] = [];
    for (let p = 0; p < phase; p++) {
      timeline.push({
        time: formatDateTime(addHours(new Date(alert.createdAt), p * 0.5 + randomBetween(0, 0.5))),
        status: phases[p],
        operator:
          p === 0
            ? pickRandom(MOCK_STAFF.filter((s) => s.role === "duty")).name
            : pickRandom(MOCK_STAFF.filter((s) => s.role !== "duty")).name,
        remark: pickRandom([
          "已联系现场人员",
          "已到达现场开始工作",
          "处置中，预计还需30分钟",
          "处理完成，恢复正常",
          undefined,
        ]),
      });
    }

    const feedbacks: IncidentFeedback[] = [];
    if (phase >= 2) {
      feedbacks.push({
        id: `fb-${idx}-1`,
        time: timeline[1]?.time || formatDateTime(new Date()),
        reporter: alert.dispatchedTo || "现场人员",
        content: pickRandom([
          "已到达现场，经排查确认为设备接线松动，正在紧固处理",
          "现场检查中，发现传感器数据漂移，准备更换模块",
          "已定位故障点，为保护回路动作，正在复位",
          "现场工况正常，疑似误报，需进一步观察",
        ]),
      });
    }
    if (phase >= 3) {
      feedbacks.push({
        id: `fb-${idx}-2`,
        time: formatDateTime(addHours(new Date(timeline[2]?.time || new Date()), randomBetween(0.3, 1.5))),
        reporter: alert.dispatchedTo || "现场人员",
        content: pickRandom([
          "处置完成，设备已恢复正常运行，数据显示稳定",
          "已更换故障配件，试运行15分钟无异常",
          "已完成清洁和紧固工作，参数恢复正常值范围",
          "问题已解决，已通知监控中心确认状态",
        ]),
      });
    }

    incidents.push({
      id: `inc-${idx}`,
      code: `CZ-${formatDate(new Date(alert.createdAt)).replace(/-/g, "")}-${String(idx + 1).padStart(3, "0")}`,
      alertId: alert.id,
      sourceType: "alert",
      tunnelId: alert.tunnelId,
      tunnelName: alert.tunnelName,
      deviceId: alert.deviceId,
      deviceName: alert.deviceName,
      title: alert.title,
      description: alert.content,
      assignee: alert.dispatchedTo || pickRandom(MOCK_STAFF.filter((s) => s.role !== "duty")).name,
      deadline: formatDateTime(addHours(new Date(alert.createdAt), alert.level === AlertLevel.URGENT ? 4 : alert.level === AlertLevel.IMPORTANT ? 12 : 24)),
      status,
      phase,
      priority: alert.level,
      createdAt: alert.createdAt,
      timeline,
      feedbacks,
    });
  });
  return incidents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const MOCK_INCIDENTS: Incident[] = generateIncidents(MOCK_ALERTS);

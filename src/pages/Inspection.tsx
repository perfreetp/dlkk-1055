import React, { useState, useMemo } from "react";
import {
  Route,
  ListTodo,
  ClipboardList,
  Plus,
  Send,
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_ROUTES, MOCK_STAFF } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import { cn, formatDate } from "@/utils/format";
import { InspectionTask, InspectionRoute } from "@/types";

type TabKey = "routes" | "tasks" | "records";

const TASK_STATUS_CONFIG: Record<
  InspectionTask["status"],
  { label: string; color: string; bg: string; border: string }
> = {
  pending: { label: "待执行", color: "#8FA4C7", bg: "bg-text-secondary/10", border: "border-text-secondary/30" },
  in_progress: { label: "执行中", color: "#00D4FF", bg: "bg-accent/15", border: "border-accent/50" },
  completed: { label: "已完成", color: "#00C853", bg: "bg-success/15", border: "border-success/50" },
  abnormal: { label: "异常", color: "#FF3B3B", bg: "bg-danger/15", border: "border-danger/50" },
};

const Inspection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const { inspectionTasks } = useMonitorStore();
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newTaskForm, setNewTaskForm] = useState({
    routeId: "",
    inspector: "",
    scheduledDate: formatDate(new Date()),
    timeSlot: "早班 08:00-12:00",
  });

  const filteredTasks = useMemo(() => {
    return inspectionTasks.filter((t) => {
      const matchKeyword =
        !searchKeyword ||
        t.code.includes(searchKeyword) ||
        t.routeName.includes(searchKeyword) ||
        t.inspector.includes(searchKeyword);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [inspectionTasks, searchKeyword, statusFilter]);

  const taskStats = useMemo(() => {
    const stats = { total: 0, pending: 0, inProgress: 0, completed: 0, abnormal: 0 };
    inspectionTasks.forEach((t) => {
      stats.total++;
      if (t.status === "pending") stats.pending++;
      else if (t.status === "in_progress") stats.inProgress++;
      else if (t.status === "completed") stats.completed++;
      else if (t.status === "abnormal") stats.abnormal++;
    });
    return stats;
  }, [inspectionTasks]);

  const inspectors = MOCK_STAFF.filter((s) => s.role === "inspector");

  const handleCreateTask = () => {
    if (!newTaskForm.routeId || !newTaskForm.inspector) return;
    const route = MOCK_ROUTES.find((r) => r.id === newTaskForm.routeId);
    if (!route) return;
    const newTask: InspectionTask = {
      id: `it-${Date.now()}`,
      code: `IT-${newTaskForm.scheduledDate.replace(/-/g, "")}-${String(inspectionTasks.length + 1).padStart(3, "0")}`,
      routeId: route.id,
      routeName: route.name,
      inspector: newTaskForm.inspector,
      scheduledDate: newTaskForm.scheduledDate,
      timeSlot: newTaskForm.timeSlot,
      status: "pending",
      progress: 0,
      abnormalCount: 0,
      checkPoints: route.checkPoints.map((cp) => ({
        name: cp.name,
        items: cp.items.map((name) => ({ name, result: "na" as const })),
      })),
    };
    useMonitorStore.setState((s) => ({ inspectionTasks: [newTask, ...s.inspectionTasks] }));
    setShowNewTaskModal(false);
    setNewTaskForm({ routeId: "", inspector: "", scheduledDate: formatDate(new Date()), timeSlot: "早班 08:00-12:00" });
  };

  const handleDispatch = (taskId: string) => {
    useMonitorStore.setState((s) => ({
      inspectionTasks: s.inspectionTasks.map((t) =>
        t.id === taskId ? { ...t, status: "in_progress" as const } : t
      ),
    }));
  };

  const tabs = [
    { key: "routes" as TabKey, label: "路线管理", icon: Route },
    { key: "tasks" as TabKey, label: "任务列表", icon: ListTodo },
    { key: "records" as TabKey, label: "巡检记录", icon: ClipboardList },
  ];

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-accent" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-widest">巡检任务管理</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "tasks" && (
            <button onClick={() => setShowNewTaskModal(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              新建任务
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-2.5 text-sm rounded-t border-b-2 transition-all flex items-center gap-2",
                activeTab === tab.key
                  ? "bg-bg-card border-accent text-accent shadow-glow-sm"
                  : "bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "routes" && (
          <div className="h-full grid grid-cols-12 gap-4">
            <div className="col-span-8 h-full overflow-y-auto pr-1 space-y-3">
              {MOCK_ROUTES.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  expanded={expandedRoute === route.id}
                  onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                />
              ))}
            </div>
            <div className="col-span-4 space-y-4">
              <Card title="路线统计" corner>
                <div className="grid grid-cols-2 gap-3">
                  <DataNumber label="路线总数" value={MOCK_ROUTES.length} suffix=" 条" size="lg" color="accent" />
                  <DataNumber
                    label="覆盖隧道"
                    value={new Set(MOCK_ROUTES.map((r) => r.tunnelId)).size}
                    suffix=" 座"
                    size="lg"
                    color="success"
                  />
                  <DataNumber
                    label="检查点总数"
                    value={MOCK_ROUTES.reduce((a, r) => a + r.checkPoints.length, 0)}
                    suffix=" 个"
                    size="md"
                  />
                  <DataNumber
                    label="检查项总数"
                    value={MOCK_ROUTES.reduce((a, r) => a + r.checkPoints.reduce((b, c) => b + c.items.length, 0), 0)}
                    suffix=" 项"
                    size="md"
                  />
                </div>
              </Card>
              <Card title="隧道分布" corner>
                <div className="space-y-2.5">
                  {Array.from(new Set(MOCK_ROUTES.map((r) => r.tunnelName))).map((tunnelName) => {
                    const routes = MOCK_ROUTES.filter((r) => r.tunnelName === tunnelName);
                    return (
                      <div key={tunnelName} className="p-2.5 rounded border border-border/40 bg-bg-elevated/50">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-text-primary">{tunnelName}</span>
                          <span className="text-xs text-accent font-number">{routes.length} 条路线</span>
                        </div>
                        <div className="text-xs text-text-secondary space-y-0.5">
                          {routes.map((r) => (
                            <div key={r.id} className="flex items-center gap-1.5">
                              <Route className="w-3 h-3 text-text-muted" />
                              {r.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="h-full flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-3 shrink-0">
              <StatCard label="全部任务" value={taskStats.total} color="#00D4FF" />
              <StatCard label="待执行" value={taskStats.pending} color="#8FA4C7" />
              <StatCard label="执行中" value={taskStats.inProgress} color="#FF7A00" />
              <StatCard label="已完成" value={taskStats.completed} color="#00C853" />
              <StatCard label="异常" value={taskStats.abnormal} color="#FF3B3B" pulse={taskStats.abnormal > 0} />
            </div>

            <Card corner className="shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索任务编号、路线名称、巡检员..."
                    className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-text-muted" />
                  {["all", "pending", "in_progress", "completed", "abnormal"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded border transition-all",
                        statusFilter === s
                          ? "bg-accent/15 border-accent/50 text-accent"
                          : "bg-bg-elevated border-border text-text-secondary hover:border-border-light hover:text-text-primary"
                      )}
                    >
                      {s === "all"
                        ? "全部"
                        : TASK_STATUS_CONFIG[s as InspectionTask["status"]].label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  expanded={expandedTask === task.id}
                  onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  onDispatch={() => handleDispatch(task.id)}
                />
              ))}
              {filteredTasks.length === 0 && (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">
                  暂无符合条件的任务
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "records" && (
          <div className="h-full overflow-y-auto pr-1">
            <Card title="巡检记录" corner>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">任务编号</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">巡检路线</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">巡检员</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">计划日期</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">班次</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">进度</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">状态</th>
                      <th className="text-left py-3 px-3 text-text-secondary font-medium">异常数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionTasks.filter((t) => t.status !== "pending").map((task) => {
                      const cfg = TASK_STATUS_CONFIG[task.status];
                      return (
                        <tr
                          key={task.id}
                          className="border-b border-border/30 hover:bg-bg-elevated/40 transition-colors"
                        >
                          <td className="py-3 px-3 font-number text-accent">{task.code}</td>
                          <td className="py-3 px-3 text-text-primary">{task.routeName}</td>
                          <td className="py-3 px-3 text-text-secondary">{task.inspector}</td>
                          <td className="py-3 px-3 text-text-secondary">{task.scheduledDate}</td>
                          <td className="py-3 px-3 text-text-secondary">{task.timeSlot}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-border/40 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    task.status === "abnormal"
                                      ? "bg-gradient-to-r from-danger to-warning"
                                      : "bg-gradient-to-r from-accent to-success"
                                  )}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="font-number text-xs text-text-secondary w-10">{task.progress}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn("badge border", cfg.bg, cfg.border)}
                              style={{ color: cfg.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                "font-number font-semibold",
                                (task.abnormalCount || 0) > 0 ? "text-danger" : "text-success"
                              )}
                            >
                              {task.abnormalCount || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
          <div className="w-[520px] rounded-lg bg-bg-card border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" />
                新建巡检任务
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">巡检路线</label>
                <select
                  value={newTaskForm.routeId}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, routeId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                >
                  <option value="">请选择巡检路线</option>
                  {MOCK_ROUTES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">巡检员</label>
                <select
                  value={newTaskForm.inspector}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, inspector: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                >
                  <option value="">请选择巡检员</option>
                  {inspectors.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} - {s.team}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">计划日期</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={newTaskForm.scheduledDate}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, scheduledDate: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">班次时段</label>
                  <select
                    value={newTaskForm.timeSlot}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  >
                    <option>早班 08:00-12:00</option>
                    <option>中班 12:00-18:00</option>
                    <option>晚班 18:00-次日02:00</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/60 bg-bg-elevated/30">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-sm rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskForm.routeId || !newTaskForm.inspector}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                创建并派发
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string; pulse?: boolean }> = ({
  label,
  value,
  color,
  pulse,
}) => (
  <Card corner accent>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-text-secondary mb-1">{label}</div>
        <div className="font-display text-3xl font-bold" style={{ color }}>
          {value}
        </div>
      </div>
      {pulse && <div className="w-2.5 h-2.5 rounded-full bg-danger alert-pulse" />}
    </div>
  </Card>
);

const RouteCard: React.FC<{
  route: InspectionRoute;
  expanded: boolean;
  onToggle: () => void;
}> = ({ route, expanded, onToggle }) => (
  <Card
    corner
    accent
    className={cn("transition-all", expanded && "ring-1 ring-accent/30")}
  >
    <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
        <Route className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-text-primary">{route.name}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
            {route.tunnelName}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {route.checkPoints.length} 个检查点
          </span>
          <span>
            {route.checkPoints.reduce((a, c) => a + c.items.length, 0)} 项检查内容
          </span>
        </div>
      </div>
      <button className="p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-muted">
        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>

    {expanded && (
      <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
        {route.checkPoints.map((cp, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-bg-elevated/50 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-xs font-bold text-accent font-number">
                {idx + 1}
              </span>
              <span className="font-medium text-sm text-text-primary">{cp.name}</span>
              <span className="text-xs text-text-muted">· {cp.items.length} 项</span>
            </div>
            <div className="ml-8 grid grid-cols-2 gap-1.5">
              {cp.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-text-secondary py-1 px-2 rounded bg-bg-card/50"
                >
                  <span className="w-1 h-1 rounded-full bg-text-muted" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);

const TaskCard: React.FC<{
  task: InspectionTask;
  expanded: boolean;
  onToggle: () => void;
  onDispatch: () => void;
}> = ({ task, expanded, onToggle, onDispatch }) => {
  const cfg = TASK_STATUS_CONFIG[task.status];
  const totalItems = task.checkPoints.reduce((a, c) => a + c.items.length, 0);
  const completedItems = task.checkPoints.reduce(
    (a, c) => a + c.items.filter((i) => i.result !== "na").length,
    0
  );
  const abnormalItems = task.checkPoints.reduce(
    (a, c) => a + c.items.filter((i) => i.result === "abnormal").length,
    0
  );

  return (
    <Card corner accent className={cn("transition-all", expanded && "ring-1 ring-accent/30")}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0",
            cfg.bg,
            cfg.border
          )}
        >
          <ListTodo className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-number text-sm text-accent">{task.code}</span>
            <h3 className="font-medium text-text-primary truncate">{task.routeName}</h3>
            <span className={cn("badge border shrink-0", cfg.bg, cfg.border)} style={{ color: cfg.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </span>
            {(task.abnormalCount || 0) > 0 && (
              <span className="badge border bg-danger/15 border-danger/50 text-danger shrink-0">
                <AlertCircle className="w-3 h-3" />
                异常 {task.abnormalCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.inspector}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {task.scheduledDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.timeSlot}
            </span>
            <span className="flex items-center gap-1">
              {completedItems}/{totalItems} 项
            </span>
          </div>
        </div>
        <div className="w-36 shrink-0 mx-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-muted">进度</span>
            <span className="font-number text-text-primary">{task.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-border/40 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                task.status === "abnormal"
                  ? "bg-gradient-to-r from-danger to-warning"
                  : "bg-gradient-to-r from-accent to-success"
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.status === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDispatch();
              }}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              <Send className="w-3.5 h-3.5" />
              派发
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-muted"
          >
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
          {task.checkPoints.map((cp, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-bg-elevated/50 border border-border/30">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-xs font-bold text-accent font-number">
                  {idx + 1}
                </span>
                <span className="font-medium text-sm text-text-primary">{cp.name}</span>
                <span className="text-xs text-text-muted">
                  · {cp.items.filter((i) => i.result !== "na").length}/{cp.items.length}
                </span>
              </div>
              <div className="ml-8 space-y-1.5">
                {cp.items.map((item, i) => {
                  const resultIcon =
                    item.result === "normal" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : item.result === "abnormal" ? (
                      <XCircle className="w-4 h-4 text-danger" />
                    ) : (
                      <MinusCircle className="w-4 h-4 text-text-muted" />
                    );
                  const resultText =
                    item.result === "normal"
                      ? "正常"
                      : item.result === "abnormal"
                      ? "异常"
                      : "未检";
                  const resultColor =
                    item.result === "normal"
                      ? "text-success"
                      : item.result === "abnormal"
                      ? "text-danger"
                      : "text-text-muted";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded bg-bg-card/60"
                    >
                      {resultIcon}
                      <span className="flex-1 text-text-secondary">{item.name}</span>
                      <span className={cn("font-medium", resultColor)}>{resultText}</span>
                      {item.remark && (
                        <span className="text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                          {item.remark}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {abnormalItems > 0 && (
            <div className="p-3 rounded-lg bg-danger/8 border border-danger/25 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="text-xs text-danger">
                本次巡检共发现 <span className="font-semibold">{abnormalItems}</span> 项异常，
                请及时跟进处理并生成处置单。
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default Inspection;

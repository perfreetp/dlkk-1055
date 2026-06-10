import React, { useState, useMemo } from "react";
import {
  FileWarning,
  Clock,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  Send,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Camera,
  Paperclip,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_STAFF, MOCK_ALERTS } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import StatusBadge from "@/components/common/StatusBadge";
import { cn, formatDate, AlertLevelConfig, timeAgo, formatDateTime } from "@/utils/format";
import { Incident, AlertLevel } from "@/types";

type TabKey = "list" | "tracking";

const PHASES = ["任务创建", "现场到场", "问题处置", "验收闭环"];

const INCIDENT_STATUS_CONFIG: Record<
  Incident["status"],
  { label: string; color: string; bg: string; border: string }
> = {
  pending: { label: "待处理", color: "#8FA4C7", bg: "bg-text-secondary/10", border: "border-text-secondary/30" },
  in_progress: { label: "处置中", color: "#00D4FF", bg: "bg-accent/15", border: "border-accent/50" },
  feedback: { label: "反馈中", color: "#FF7A00", bg: "bg-warning/15", border: "border-warning/50" },
  closed: { label: "已闭环", color: "#00C853", bg: "bg-success/15", border: "border-success/50" },
};

const Incidents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("list");
  const { incidents, createIncident, updateIncidentPhase, addFeedback } = useMonitorStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackReporter, setFeedbackReporter] = useState("");
  const [newForm, setNewForm] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: AlertLevel.NORMAL as AlertLevel,
    deadline: "",
  });

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchKeyword =
        !searchKeyword ||
        inc.code.includes(searchKeyword) ||
        inc.title.includes(searchKeyword) ||
        inc.assignee.includes(searchKeyword);
      const matchStatus = statusFilter === "all" || inc.status === statusFilter;
      const matchPriority = priorityFilter === "all" || inc.priority === priorityFilter;
      return matchKeyword && matchStatus && matchPriority;
    });
  }, [incidents, searchKeyword, statusFilter, priorityFilter]);

  const unclosedIncidents = useMemo(
    () => incidents.filter((i) => i.status !== "closed"),
    [incidents]
  );

  const displayList = activeTab === "list" ? filteredIncidents : unclosedIncidents;

  const stats = useMemo(() => {
    const s = { total: 0, pending: 0, inProgress: 0, feedback: 0, closed: 0, urgent: 0 };
    incidents.forEach((i) => {
      s.total++;
      if (i.status === "pending") s.pending++;
      else if (i.status === "in_progress") s.inProgress++;
      else if (i.status === "feedback") s.feedback++;
      else if (i.status === "closed") s.closed++;
      if (i.priority === AlertLevel.URGENT) s.urgent++;
    });
    return s;
  }, [incidents]);

  const maintenanceStaff = MOCK_STAFF.filter((s) => s.role !== "duty");

  const handleCreate = () => {
    if (!newForm.title || !newForm.assignee) return;
    createIncident({
      title: newForm.title,
      description: newForm.description,
      assignee: newForm.assignee,
      priority: newForm.priority,
      deadline: newForm.deadline || undefined,
    });
    setShowNewModal(false);
    setNewForm({
      title: "",
      description: "",
      assignee: "",
      priority: AlertLevel.NORMAL,
      deadline: "",
    });
  };

  const handleAddFeedback = () => {
    if (!showFeedbackModal || !feedbackContent || !feedbackReporter) return;
    addFeedback(showFeedbackModal, feedbackReporter, feedbackContent);
    setShowFeedbackModal(null);
    setFeedbackContent("");
    setFeedbackReporter("");
  };

  const tabs = [
    { key: "list" as TabKey, label: "处置单列表", icon: FileWarning },
    { key: "tracking" as TabKey, label: "未关闭追踪", icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <FileWarning className="w-5 h-5 text-accent" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-widest">事件处置中心</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            新增处置单
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = tab.key === "tracking" ? unclosedIncidents.length : incidents.length;
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
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  activeTab === tab.key ? "bg-accent/20 text-accent" : "bg-border/40 text-text-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4">
        <div className="grid grid-cols-6 gap-3 shrink-0">
          <StatCard label="全部处置单" value={stats.total} color="#00D4FF" />
          <StatCard label="待处理" value={stats.pending} color="#8FA4C7" />
          <StatCard label="处置中" value={stats.inProgress} color="#FF7A00" />
          <StatCard label="反馈中" value={stats.feedback} color="#FFD600" />
          <StatCard label="已闭环" value={stats.closed} color="#00C853" />
          <StatCard label="紧急事件" value={stats.urgent} color="#FF3B3B" pulse={stats.urgent > 0} />
        </div>

        {activeTab === "list" && (
          <Card corner className="shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索处置单编号、标题、负责人..."
                  className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <span className="text-xs text-text-secondary">状态:</span>
                {["all", "pending", "in_progress", "feedback", "closed"].map((s) => (
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
                    {s === "all" ? "全部" : INCIDENT_STATUS_CONFIG[s as Incident["status"]].label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-text-secondary">优先级:</span>
                {["all", AlertLevel.URGENT, AlertLevel.IMPORTANT, AlertLevel.NORMAL, AlertLevel.INFO].map((p) => {
                  const label =
                    p === "all" ? "全部" : AlertLevelConfig[p as AlertLevel].label;
                  const cfg = p !== "all" ? AlertLevelConfig[p as AlertLevel] : null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded border transition-all",
                        priorityFilter === p
                          ? cfg
                            ? `border`
                            : "bg-accent/15 border-accent/50 text-accent"
                          : "bg-bg-elevated border-border text-text-secondary hover:border-border-light hover:text-text-primary"
                      )}
                      style={
                        priorityFilter === p && cfg
                          ? {
                              backgroundColor: cfg.color + "20",
                              borderColor: cfg.color + "60",
                              color: cfg.color,
                            }
                          : undefined
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {displayList.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              expanded={expandedId === inc.id}
              onToggle={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
              onAdvance={() => updateIncidentPhase(inc.id)}
              onAddFeedback={() => setShowFeedbackModal(inc.id)}
            />
          ))}
          {displayList.length === 0 && (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              暂无符合条件的处置单
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
          <div className="w-[560px] rounded-lg bg-bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 shrink-0">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" />
                新增处置单
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  事件标题 <span className="text-danger">*</span>
                </label>
                <input
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  placeholder="请输入事件标题，如：排水泵异常停机"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">事件描述</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="请详细描述事件情况、影响范围等"
                  rows={3}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    负责人 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={newForm.assignee}
                    onChange={(e) => setNewForm({ ...newForm, assignee: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  >
                    <option value="">请选择负责人</option>
                    {maintenanceStaff.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} - {s.team}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">优先级</label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as AlertLevel })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  >
                    {Object.values(AlertLevel).map((l) => (
                      <option key={l} value={l}>
                        {AlertLevelConfig[l].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">处置期限</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={newForm.deadline}
                    onChange={(e) => setNewForm({ ...newForm, deadline: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">关联告警（可选）</label>
                <select
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                  defaultValue=""
                >
                  <option value="">不关联告警</option>
                  {MOCK_ALERTS.slice(0, 10).map((a) => (
                    <option key={a.id} value={a.id}>
                      [{AlertLevelConfig[a.level].label}] {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/60 bg-bg-elevated/30 shrink-0">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-sm rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newForm.title || !newForm.assignee}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                创建处置单
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
          <div className="w-[480px] rounded-lg bg-bg-card border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                添加现场反馈
              </h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(null);
                  setFeedbackContent("");
                  setFeedbackReporter("");
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  反馈人 <span className="text-danger">*</span>
                </label>
                <select
                  value={feedbackReporter}
                  onChange={(e) => setFeedbackReporter(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary focus:border-accent/50 focus:outline-none"
                >
                  <option value="">请选择反馈人</option>
                  {maintenanceStaff.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  反馈内容 <span className="text-danger">*</span>
                </label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="请描述现场情况、已采取的措施、当前进展等..."
                  rows={5}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  上传照片
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  添加附件
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/60 bg-bg-elevated/30">
              <button
                onClick={() => {
                  setShowFeedbackModal(null);
                  setFeedbackContent("");
                  setFeedbackReporter("");
                }}
                className="px-4 py-2 text-sm rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddFeedback}
                disabled={!feedbackContent || !feedbackReporter}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                提交反馈
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

const IncidentCard: React.FC<{
  incident: Incident;
  expanded: boolean;
  onToggle: () => void;
  onAdvance: () => void;
  onAddFeedback: () => void;
}> = ({ incident, expanded, onToggle, onAdvance, onAddFeedback }) => {
  const statusCfg = INCIDENT_STATUS_CONFIG[incident.status];
  const priorityCfg = AlertLevelConfig[incident.priority];
  const progress = ((incident.phase - 1) / 3) * 100;
  const canAdvance = incident.phase < 4;

  return (
    <Card corner accent className={cn("transition-all", expanded && "ring-1 ring-accent/30")}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
            statusCfg.bg,
            statusCfg.border
          )}
        >
          <FileWarning className="w-5 h-5" style={{ color: statusCfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="font-number text-sm text-accent">{incident.code}</span>
            <h3 className="font-medium text-text-primary">{incident.title}</h3>
            <span
              className="badge border shrink-0"
              style={{
                backgroundColor: priorityCfg.color + "20",
                borderColor: priorityCfg.color + "50",
                color: priorityCfg.color,
              }}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  incident.priority === AlertLevel.URGENT && "alert-pulse"
                )}
                style={{ backgroundColor: priorityCfg.color }}
              />
              {priorityCfg.label}
            </span>
            <span className={cn("badge border shrink-0", statusCfg.bg, statusCfg.border)} style={{ color: statusCfg.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.color }} />
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {incident.assignee}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              创建于 {timeAgo(incident.createdAt)}
            </span>
            {incident.deadline && (
              <span className="flex items-center gap-1 text-warning">
                <Clock className="w-3 h-3" />
                期限 {incident.deadline}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {incident.feedbacks.length} 条反馈
            </span>
          </div>
        </div>
        <div className="w-48 shrink-0 mx-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-text-muted">处置阶段 {incident.phase}/4</span>
            <span className="font-number text-text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-gradient-to-r from-accent via-success to-accent-dark"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-text-muted">
            {PHASES.map((p, i) => (
              <span
                key={i}
                className={cn(
                  i < incident.phase ? "text-accent" : "",
                  i === incident.phase - 1 ? "font-semibold" : ""
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAdvance && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdvance();
              }}
              className="btn btn-primary text-xs py-1.5 px-3"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              推进
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
        <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
          {incident.description && (
            <div className="p-3 rounded-lg bg-bg-elevated/50 border border-border/30">
              <div className="text-xs text-text-secondary mb-1">事件描述</div>
              <p className="text-sm text-text-primary leading-relaxed">{incident.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/30">
              <div className="text-xs text-text-secondary mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                处置时间线
              </div>
              <div className="relative pl-5 space-y-3">
                <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border/50" />
                {incident.timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <div
                      className={cn(
                        "absolute -left-5 w-3.5 h-3.5 rounded-full border-2 mt-0.5",
                        i === incident.timeline.length - 1
                          ? "bg-accent border-accent shadow-glow-sm"
                          : "bg-bg-card border-success"
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{t.status}</span>
                        {i === incident.timeline.length - 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                            当前阶段
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {t.operator} · {t.time}
                      </div>
                      {t.remark && (
                        <div className="text-xs text-text-secondary mt-1 pl-2 border-l-2 border-border/50">
                          {t.remark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/30 flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs text-text-secondary flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                  现场反馈记录
                </div>
                <button
                  onClick={onAddFeedback}
                  className="text-[11px] text-accent hover:text-accent-dark flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  添加反馈
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[260px]">
                {incident.feedbacks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted py-8">
                    暂无现场反馈
                  </div>
                ) : (
                  incident.feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-2.5 rounded-md bg-bg-card/70 border border-border/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-accent">{fb.reporter}</span>
                        <span className="text-[10px] text-text-muted">{timeAgo(fb.time)}</span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed">{fb.content}</p>
                      {fb.images && fb.images.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {fb.images.map((img, i) => (
                            <div
                              key={i}
                              className="w-14 h-14 rounded bg-bg-elevated border border-border/40 flex items-center justify-center"
                            >
                              <Camera className="w-4 h-4 text-text-muted" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Incidents;

import React, { useMemo, useState, useEffect } from "react";
import {
  Camera,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera as CameraIcon,
  Video,
  VideoOff,
  Square,
  Circle,
  Wifi,
  WifiOff,
  Search,
  Filter,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { MOCK_TUNNELS, MOCK_CAMERAS } from "@/data/mockData";
import Card from "@/components/common/Card";
import DataNumber from "@/components/common/DataNumber";
import { cn, formatDateTime } from "@/utils/format";
import { Camera as CameraType } from "@/types";

type GridSize = 4 | 9 | 16;

const GRID_CONFIG: Record<GridSize, { cols: string; label: string; icon: React.ComponentType<any> }> = {
  4: { cols: "grid-cols-2", label: "2×2", icon: Grid2X2 },
  9: { cols: "grid-cols-3", label: "3×3", icon: Grid3X3 },
  16: { cols: "grid-cols-4", label: "4×4", icon: LayoutGrid },
};

const PTZButton: React.FC<{
  icon: React.ComponentType<any>;
  onClick?: () => void;
  className?: string;
}> = ({ icon: Icon, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-9 h-9 rounded flex items-center justify-center transition-all",
      "bg-bg-elevated/60 border border-border/50 text-text-secondary",
      "hover:bg-accent/15 hover:border-accent/50 hover:text-accent",
      "active:scale-95",
      className
    )}
  >
    <Icon className="w-4 h-4" />
  </button>
);

interface VideoCellProps {
  camera: CameraType;
  isFullscreen: boolean;
  onDoubleClick: () => void;
  onSelect: () => void;
  isSelected: boolean;
  isRecording: boolean;
  onToggleRecord: () => void;
  onSnapshot: () => void;
}

const VideoCell: React.FC<VideoCellProps> = ({
  camera,
  isFullscreen,
  onDoubleClick,
  onSelect,
  isSelected,
  isRecording,
  onToggleRecord,
  onSnapshot,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer transition-all group",
        "bg-bg-secondary border",
        isSelected
          ? "border-accent shadow-glow ring-1 ring-accent/50"
          : "border-border/50 hover:border-border-light",
        isFullscreen && "fixed inset-4 z-50 !m-0 !rounded-xl border-accent shadow-glow"
      )}
      style={{ aspectRatio: isFullscreen ? "auto" : "16/9" }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-secondary">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-grid" />
          </div>
          <div className="relative flex flex-col items-center gap-2 z-10">
            {camera.online ? (
              <>
                <Camera className="w-10 h-10 text-accent/60" />
                <div className="text-xs text-text-muted font-mono">
                  {camera.code}
                </div>
                <div className="text-[10px] text-text-muted/60">
                  实时视频流 · 1080P @ 25fps
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-10 h-10 text-text-muted/50" />
                <div className="text-xs text-text-muted">视频信号中断</div>
                <div className="text-[10px] text-danger/70">请检查设备连接</div>
              </>
            )}
          </div>
        </div>
        {camera.online && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 p-2 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              camera.online
                ? "bg-success/20 text-success"
                : "bg-danger/20 text-danger"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                camera.online ? "bg-success animate-pulse" : "bg-danger"
              )}
            />
            {camera.online ? "在线" : "离线"}
          </span>
          {camera.online && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-mono">
              <Play className="w-2.5 h-2.5 fill-current" />
              LIVE
            </span>
          )}
          {isRecording && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-danger/20 text-danger alert-pulse">
              <Circle className="w-2.5 h-2.5 fill-current" />
              REC
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-secondary/90 font-mono">
          {formatDateTime(time)}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-text-primary truncate">
            {camera.name}
          </div>
          <div className="text-[10px] text-text-secondary/80 truncate">
            {camera.tunnelName} · {camera.location}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSnapshot();
            }}
            className="w-7 h-7 rounded flex items-center justify-center bg-black/40 hover:bg-accent/30 text-text-secondary hover:text-accent transition-colors"
            title="截图"
          >
            <CameraIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleRecord();
            }}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors",
              isRecording
                ? "bg-danger/40 text-danger"
                : "bg-black/40 hover:bg-danger/30 text-text-secondary hover:text-danger"
            )}
            title={isRecording ? "停止录像" : "开始录像"}
          >
            {isRecording ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Video className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDoubleClick();
            }}
            className="w-7 h-7 rounded flex items-center justify-center bg-black/40 hover:bg-accent/30 text-text-secondary hover:text-accent transition-colors"
            title="全屏"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {isFullscreen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDoubleClick();
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-danger/40 text-text-secondary hover:text-danger flex items-center justify-center z-20"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const VideoWall: React.FC = () => {
  const { selectedTunnelId, setSelectedTunnel } = useMonitorStore();
  const [gridSize, setGridSize] = useState<GridSize>(9);
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [recordingCameras, setRecordingCameras] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const filteredCameras = useMemo(() => {
    let list = MOCK_CAMERAS;
    if (selectedTunnelId !== "all") {
      list = list.filter((c) => c.tunnelId === selectedTunnelId);
    }
    if (selectedGroup !== "all") {
      list = list.filter((c) => c.group === selectedGroup);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedTunnelId, selectedGroup, searchText]);

  const displayedCameras = useMemo(
    () => filteredCameras.slice(0, gridSize),
    [filteredCameras, gridSize]
  );

  const groups = useMemo(() => {
    const set = new Set(MOCK_CAMERAS.map((c) => c.group));
    return ["all", ...Array.from(set)];
  }, []);

  const stats = useMemo(() => {
    const total = filteredCameras.length;
    const online = filteredCameras.filter((c) => c.online).length;
    const offline = total - online;
    const recording = recordingCameras.size;
    return { total, online, offline, recording };
  }, [filteredCameras, recordingCameras]);

  const selectedCam = useMemo(
    () => MOCK_CAMERAS.find((c) => c.id === selectedCamera),
    [selectedCamera]
  );

  const toggleRecording = (id: string) => {
    setRecordingCameras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSnapshot = (camera: CameraType) => {
    alert(`截图已保存: ${camera.code}_${Date.now()}.png`);
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="corner-bracket px-4 py-2 bg-bg-card border border-border rounded">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-accent" />
              <h1 className="font-display font-bold text-xl text-text-primary tracking-wider">
                视频监控墙
              </h1>
              <span className="text-xs text-text-muted px-2 py-0.5 border border-border rounded">
                VIDEO WALL
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {MOCK_TUNNELS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTunnel(t.id)}
              className={cn(
                "px-3 py-1.5 text-xs rounded border transition-all",
                selectedTunnelId === t.id
                  ? "bg-accent/15 border-accent/50 text-accent shadow-glow-sm"
                  : "bg-bg-card border-border text-text-secondary hover:border-border-light hover:text-text-primary"
              )}
            >
              {t.name.slice(0, 6)}
            </button>
          ))}
          <button
            onClick={() => setSelectedTunnel("all")}
            className={cn(
              "px-3 py-1.5 text-xs rounded border transition-all font-semibold",
              selectedTunnelId === "all"
                ? "bg-accent text-bg-primary border-accent shadow-glow-sm"
                : "bg-bg-card border-border text-text-secondary hover:border-border-light hover:text-text-primary"
            )}
          >
            全部隧道
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="btn btn-secondary"
            title={isMuted ? "取消静音" : "静音"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "btn",
              isPaused ? "btn-primary" : "btn-secondary"
            )}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? "继续" : "暂停"}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-10 flex flex-col gap-4 min-h-0">
          <Card corner className="shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="搜索摄像头名称/编号/位置..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="input pl-8 w-64 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-text-muted mr-1" />
                  {groups.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded border transition-all",
                        selectedGroup === g
                          ? "bg-accent/20 border-accent/40 text-accent"
                          : "bg-bg-elevated/60 border-border/40 text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {g === "all" ? "全部分组" : g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-bg-elevated/60 rounded border border-border/40">
                {(Object.keys(GRID_CONFIG) as unknown as GridSize[]).map((size) => {
                  const cfg = GRID_CONFIG[size];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={cn(
                        "px-3 py-1.5 rounded flex items-center gap-1.5 text-xs transition-all",
                        gridSize === size
                          ? "bg-accent/20 text-accent"
                          : "text-text-secondary hover:text-text-primary hover:bg-border/30"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-4">
                <span>视频监控画面</span>
                <span className="text-xs text-text-muted font-normal">
                  显示 {displayedCameras.length} / {filteredCameras.length} 路
                </span>
              </div>
            }
            accent
            corner
            className="flex-1 min-h-0 overflow-hidden"
            actions={
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-success" />
                  <span className="text-text-secondary">
                    在线率{" "}
                    <span className="font-number text-success">
                      {stats.online}
                    </span>
                    /{stats.total}
                  </span>
                </div>
                {stats.recording > 0 && (
                  <div className="flex items-center gap-1">
                    <Circle className="w-3 h-3 fill-danger text-danger animate-pulse" />
                    <span className="text-danger">
                      录像中 {stats.recording} 路
                    </span>
                  </div>
                )}
              </div>
            }
          >
            <div
              className={cn(
                "grid gap-3 h-full overflow-auto p-1",
                GRID_CONFIG[gridSize].cols
              )}
            >
              {displayedCameras.map((cam) => (
                <VideoCell
                  key={cam.id}
                  camera={cam}
                  isFullscreen={fullscreenCamera === cam.id}
                  onDoubleClick={() =>
                    setFullscreenCamera(
                      fullscreenCamera === cam.id ? null : cam.id
                    )
                  }
                  onSelect={() => setSelectedCamera(cam.id)}
                  isSelected={selectedCamera === cam.id}
                  isRecording={recordingCameras.has(cam.id)}
                  onToggleRecord={() => toggleRecording(cam.id)}
                  onSnapshot={() => handleSnapshot(cam)}
                />
              ))}
              {Array.from({ length: Math.max(0, gridSize - displayedCameras.length) }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-lg border border-dashed border-border/30 bg-bg-secondary/40 flex items-center justify-center"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <div className="flex flex-col items-center gap-1 text-text-muted/50">
                      <Camera className="w-8 h-8 opacity-40" />
                      <span className="text-xs">空闲通道</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-2 flex flex-col gap-4 min-h-0">
          <Card title="监控概览" corner className="shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-bg-elevated/60 border border-border/40 p-2.5">
                <DataNumber
                  label="摄像头总数"
                  value={stats.total}
                  size="lg"
                  color="accent"
                />
              </div>
              <div className="rounded-md bg-bg-elevated/60 border border-border/40 p-2.5">
                <DataNumber
                  label="在线数量"
                  value={stats.online}
                  size="lg"
                  color="success"
                />
              </div>
              <div className="rounded-md bg-bg-elevated/60 border border-border/40 p-2.5">
                <DataNumber
                  label="离线数量"
                  value={stats.offline}
                  size="lg"
                  color="danger"
                />
              </div>
              <div className="rounded-md bg-bg-elevated/60 border border-border/40 p-2.5">
                <DataNumber
                  label="录像中"
                  value={stats.recording}
                  size="lg"
                  color="warning"
                />
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <CameraIcon className="w-4 h-4 text-accent" />
                <span>摄像头控制</span>
              </div>
            }
            corner
            className="shrink-0"
          >
            {selectedCam ? (
              <div className="space-y-4">
                <div className="p-2.5 rounded-md bg-bg-elevated/60 border border-border/40">
                  <div className="text-xs font-medium text-text-primary mb-1 truncate">
                    {selectedCam.name}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">
                    {selectedCam.code}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-1">
                    {selectedCam.tunnelName}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {selectedCam.group} · {selectedCam.location}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                    <span className="w-1 h-3 bg-accent rounded-sm inline-block" />
                    云台控制 (PTZ)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 w-fit mx-auto">
                    <div />
                    <PTZButton icon={ChevronUp} />
                    <div />
                    <PTZButton icon={ChevronLeft} />
                    <PTZButton
                      icon={RotateCcw}
                      className="bg-accent/15 border-accent/40 text-accent"
                    />
                    <PTZButton icon={ChevronRight} />
                    <div />
                    <PTZButton icon={ChevronDown} />
                    <div />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                    <span className="w-1 h-3 bg-accent rounded-sm inline-block" />
                    变焦控制
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <PTZButton icon={ZoomOut} />
                    <div className="flex-1 h-2 mx-2 rounded-full bg-bg-elevated/80 border border-border/40 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-accent to-accent-dark rounded-full" />
                    </div>
                    <PTZButton icon={ZoomIn} />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                    <span className="w-1 h-3 bg-accent rounded-sm inline-block" />
                    快捷操作
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSnapshot(selectedCam)}
                      className="btn btn-secondary !py-1.5 text-xs"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      截图
                    </button>
                    <button
                      onClick={() => toggleRecording(selectedCam.id)}
                      className={cn(
                        "btn !py-1.5 text-xs",
                        recordingCameras.has(selectedCam.id)
                          ? "btn-danger"
                          : "btn-secondary"
                      )}
                    >
                      {recordingCameras.has(selectedCam.id) ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          停止
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5" />
                          录像
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                    <span className="w-1 h-3 bg-accent rounded-sm inline-block" />
                    预置位
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        className="h-8 rounded text-xs font-number bg-bg-elevated/60 border border-border/40 text-text-secondary hover:bg-accent/15 hover:border-accent/40 hover:text-accent transition-all"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted text-sm">
                <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <div>请在左侧选择一个摄像头</div>
                <div className="text-[11px] text-text-muted/70 mt-1">
                  点击视频画面进行控制
                </div>
              </div>
            )}
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-success" />
                <span>摄像头列表</span>
              </div>
            }
            corner
            className="flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredCameras.map((cam) => (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam.id)}
                  className={cn(
                    "p-2 rounded-md border cursor-pointer transition-all",
                    selectedCamera === cam.id
                      ? "bg-accent/10 border-accent/40"
                      : "border-transparent hover:bg-bg-elevated/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0 mt-0.5",
                        cam.online
                          ? "bg-success animate-pulse"
                          : "bg-danger"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary truncate">
                        {cam.name}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">
                        {cam.code} · {cam.group}
                      </div>
                    </div>
                    {recordingCameras.has(cam.id) && (
                      <Circle className="w-2 h-2 fill-danger text-danger animate-pulse shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {fullscreenCamera && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setFullscreenCamera(null)}
        />
      )}
    </div>
  );
};

export default VideoWall;

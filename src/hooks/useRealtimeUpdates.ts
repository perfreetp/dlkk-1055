import { useEffect } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";

export function useRealtimeUpdates() {
  const updateRandomData = useMonitorStore((s) => s.updateRandomData);
  const maybeGenerateNewAlert = useMonitorStore((s) => s.maybeGenerateNewAlert);

  useEffect(() => {
    const dataTimer = setInterval(updateRandomData, 4000);
    const alertTimer = setInterval(maybeGenerateNewAlert, 12000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(alertTimer);
    };
  }, [updateRandomData, maybeGenerateNewAlert]);
}

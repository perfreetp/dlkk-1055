import React, { useMemo } from "react";
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import VideoWall from "@/pages/VideoWall";
import Alerts from "@/pages/Alerts";
import Devices from "@/pages/Devices";
import DeviceDetail from "@/pages/DeviceDetail";
import Inspection from "@/pages/Inspection";
import Incidents from "@/pages/Incidents";
import Reports from "@/pages/Reports";

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video-wall" element={<VideoWall />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/inspection" element={<Inspection />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default App;

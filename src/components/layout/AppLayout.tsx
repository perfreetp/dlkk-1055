import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AnimatePresence, motion } from "framer-motion";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  useRealtimeUpdates();

  return (
    <div className="h-full w-full flex bg-grid">
      <div className="scanlines absolute inset-0 pointer-events-none z-0" />
      {!isDashboard && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {!isDashboard && <Header />}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

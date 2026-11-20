import Sidebar from "../Components/Sidebar";
import Topbar from "../Components/Topbar";
import { Outlet } from "react-router-dom";

import { useState } from "react";


const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white">

      <Sidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col">

        <Topbar
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        <main className="flex-1 bg-slate-50 overflow-auto p-2">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;
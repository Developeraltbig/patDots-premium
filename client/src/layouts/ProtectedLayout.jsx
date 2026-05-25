import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "../components/dashboard/Sidebar";
import "../styles/dashboard/DashboardLayout.css";

const ProtectedLayout = () => {
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;

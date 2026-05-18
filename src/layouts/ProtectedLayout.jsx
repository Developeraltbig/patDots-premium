import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedLayout = () => {
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-dashboard-layout">
      <main className="protected-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;

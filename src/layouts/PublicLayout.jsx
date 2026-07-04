import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/home/header";
import Footer from "../components/home/Footer";

const PublicLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    if (location.pathname === "/") {
      return <Navigate to="/new-draft" replace />;
    }

    if (location.pathname === "/login") {
      return <Navigate to="/my-drafts" replace />;
    }
  }

  return (
    <>
      <Header />
      <main className="public-main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default PublicLayout;

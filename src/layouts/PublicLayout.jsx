import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/home/header";

const PublicLayout = () => {
  return (
    <>
      <Header />

      <main className="public-main-content">
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;

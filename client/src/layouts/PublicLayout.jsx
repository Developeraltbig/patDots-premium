import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/home/header";
import Footer from "../components/home/Footer";

const PublicLayout = () => {
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

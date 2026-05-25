import React, { Suspense, lazy } from "react";
import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import CheckoutPage from "./pages/CheckoutPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Dashboard from "./pages/Dashboard";
import Preview from "./pages/PreviewPage";

// Lazy Loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));

// Premium Fallback Loader
const PageLoader = () => (
  <div className="global-loader">
    <div className="spinner"></div>
  </div>
);

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/preview/:id" element={<Preview />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="/draft/:id" element={<Dashboard />} />
          </Route>

          {/* CATCH-ALL REDIRECT */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <ToastContainer theme="dark" position="bottom-right" />
    </>
  );
}

export default App;

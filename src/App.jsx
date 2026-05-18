import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import PublicLayout from "./layouts/PublicLayout";

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
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer theme="dark" position="bottom-right" />
    </>
  );
}

export default App;

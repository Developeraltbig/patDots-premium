import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts & Static Pages
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import CheckoutPage from "./pages/CheckoutPage";
import Preview from "./pages/PreviewPage";

// THE FIX: Import Draft instead of Dashboard
import Draft from "./components/dashboard/Draft";

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
          {/* PUBLIC ROUTES */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/preview/:id" element={<Preview />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
          </Route>

          {/* PROTECTED ROUTES */}
          <Route element={<ProtectedLayout />}>
            {/* THE FIX: Use Draft component here */}
            <Route path="/draft/:id" element={<Draft />} />
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

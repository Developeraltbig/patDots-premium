import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts & Static Pages
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import CheckoutPage from "./pages/CheckoutPage";
import Preview from "./pages/PreviewPage";

// Lazy Loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Draft = lazy(() => import("./components/dashboard/Draft"));
const MyDrafts = lazy(() => import("./pages/MyDrafts"));
const NewDraft = lazy(() => import("./pages/NewDraft"));

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
            <Route path="/draft/:id" element={<Draft />} />
            <Route path="/new-draft" element={<NewDraft />} />
            <Route path="/my-drafts" element={<MyDrafts />} />
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

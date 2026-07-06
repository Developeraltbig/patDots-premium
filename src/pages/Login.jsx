import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Mail, Lock, X } from "lucide-react";
import L1 from "../assets/images/Patdots-logo-dark-bg.png";

// RTK Query Hooks & Redux Actions
import {
  useLoginUserMutation,
  useForgotPasswordMutation,
} from "../store/slices/authApi";
import { setAuthUser } from "../store/slices/authSlice";

import "../styles/Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/my-drafts";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginUser, { isLoading: isLoggingIn }] = useLoginUserMutation();
  const [forgotPassword, { isLoading: isForgotLoading }] =
    useForgotPasswordMutation();

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");

    try {
      const res = await loginUser({ email, password }).unwrap();
      if (res.success && res.user) {
        dispatch(setAuthUser(res.user));
      }
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          "Invalid credentials. Please try again.",
      );
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email");

    try {
      await forgotPassword(forgotEmail).unwrap();
      toast.success("If an account exists, a reset link has been sent.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* LEFT SIDE: Brand */}
      <div className="login-brand-col">
        <div className="brand-glow"></div>

        <div className="brand-content">
          <h1>
            Patent drafting,
            <br />
            reinvented.
          </h1>
          <p>
            Join thousands of inventors securing their ideas in minutes, not
            weeks. Bank-level security meets cutting-edge AI.
          </p>
        </div>

        <div className="brand-footer">
          <p>© {new Date().getFullYear()} PatDots.ai</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="login-form-col">
        <div className="form-card">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* RENAMED TO login-input-group */}
            <div className="login-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="login-input-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="btn-forgot-password"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-login-submit"
            >
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="form-footer">
            <Link to="/" className="back-link">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header-row">
              <h3>Reset Password</h3>
              <button
                className="btn-close"
                onClick={() => setShowForgotModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="modal-desc">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="login-input-group">
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={isForgotLoading}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isForgotLoading || !forgotEmail}
                className="btn-login-submit mt-4"
              >
                {isForgotLoading ? "Sending Link..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

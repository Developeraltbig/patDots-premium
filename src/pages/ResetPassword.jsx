import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Lock, ArrowLeft } from "lucide-react";

import { useResetPasswordMutation } from "../store/slices/authApi";

import "../styles/Login.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (password.length < 4) {
      return toast.error("Password must be at least 4 characters.");
    }

    try {
      const res = await resetPassword({ token, password }).unwrap();

      if (res.success) {
        toast.success("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to reset password. The link may be expired.",
      );
    }
  };

  return (
    <div
      className="login-page-wrapper"
      style={{ justifyContent: "center", backgroundColor: "#f8fafc" }}
    >
      <div
        className="login-form-col"
        style={{ flex: "none", width: "100%", padding: "40px 20px" }}
      >
        <div className="form-card" style={{ margin: "0 auto" }}>
          <div className="form-header">
            <h2>Set New Password</h2>
            <p>Enter your new secure password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="password">New Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="btn-login-submit"
            >
              {isLoading ? "Updating Password..." : "Reset Password"}
            </button>
          </form>

          <div className="form-footer">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

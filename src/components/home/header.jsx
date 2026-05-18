import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Add a slight glassmorphism effect on scroll for a premium feel
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`premium-header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        {/* Left: Logo & Branding */}
        <Link to="/" className="brand-link">
          <div className="logo-mark">
            {/* Inline SVG matching the 'P' logo in your image */}
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M25 80V20C25 20 45 20 60 20C79.33 20 95 35.67 95 55C95 74.33 79.33 90 60 90C50 90 40.83 85.83 34.33 79.17L44.83 68.67C48.67 72.5 54 75 60 75C71.05 75 80 66.05 80 55C80 43.95 71.05 35 60 35H40V80H25ZM60 65C65.52 65 70 60.52 70 55C70 49.48 65.52 45 60 45C54.48 45 50 49.48 50 55C50 60.52 54.48 65 60 65Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">PatDots.ai</h1>
            <span className="brand-subtitle">Powered by barcodeIP</span>
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="header-actions">
          <button
            className="btn-login-outline"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

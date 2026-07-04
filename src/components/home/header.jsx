// File: client/src/components/home/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import logoImg from "../../assets/images/Patdots-logo-dark-bg.png";
import "../../styles/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Pull auth state
  const { isAuthenticated } = useSelector((state) => state.auth);

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
        <Link to="/" className="brand-link">
          <div className="brand-text">
            <img
              src={logoImg}
              alt="PatDots.ai Logo"
              className="brand-logo-image"
            />
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            <button
              className="btn-login-outline"
              onClick={() => navigate("/my-drafts")}
            >
              Dashboard
            </button>
          ) : (
            <button
              className="btn-login-outline"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

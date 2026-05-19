import React from "react";
import { Link } from "react-router-dom";
import "../../styles/home/Footer.css";

// Pure SVG Components for Social Icons (Zero Dependencies)
const XLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const YoutubeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="premium-footer">
      {/* Subtle purple radial glow on the left */}
      <div className="footer-glow"></div>

      <div className="footer-container">
        <div className="footer-top-row">
          {/* LEFT COLUMN: Brand & Description */}
          <div className="footer-brand-col">
            <Link
              to="/"
              onClick={handleScrollToTop}
              className="footer-logo-link"
            >
              <div className="footer-logo-mark">
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
              <div className="footer-brand-text">
                <h2 className="footer-brand-title">PatDots.ai</h2>
                <span className="footer-brand-subtitle">
                  Powered by barcodeIP
                </span>
              </div>
            </Link>

            <p className="footer-description">
              AI-Powered Patent Drafting In Minutes, Not Weeks. Protect
              <br />
              Your Invention Without The $2,000+ Price Tag.
            </p>

            <p className="footer-contact">
              Questions?{" "}
              <a href="mailto:Support@Patdots.Ai">Support@Patdots.Ai</a>
            </p>
          </div>

          {/* RIGHT COLUMN: Navigation Links */}
          <div className="footer-links-col">
            <div className="link-group">
              <h4 className="link-group-title">Product</h4>
              <Link to="/new-draft" className="footer-link">
                Generate Draft
              </Link>
              <a href="/#pricing-sec" className="footer-link">
                Pricing
              </a>
              <a href="/#how-it-works" className="footer-link">
                How It Works
              </a>
              <a href="/#faq" className="footer-link">
                FAQ
              </a>
            </div>

            <div className="link-group">
              <h4 className="link-group-title">Legal</h4>
              <Link to="/terms" className="footer-link">
                Terms Of Use
              </Link>
              <Link to="/privacy" className="footer-link">
                Privacy Policy
              </Link>
              <Link to="/security" className="footer-link">
                Security
              </Link>
            </div>
          </div>
        </div>

        {/* SOCIAL ICONS (Aligned to the right above the line) */}
        <div className="footer-socials-row">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="X (Twitter)"
          >
            <XLogo />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="LinkedIn"
          >
            <LinkedinIcon />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="YouTube"
          >
            <YoutubeIcon />
          </a>
        </div>

        {/* DIVIDER */}
        <div className="footer-divider"></div>

        {/* BOTTOM COPYRIGHT */}
        <div className="footer-bottom-row">
          <p>© {currentYear} PatDots.Ai. Powered By BarcodeIP.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

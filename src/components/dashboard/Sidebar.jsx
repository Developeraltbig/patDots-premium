import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FileEdit, LogOut, Menu, X } from "lucide-react";
import { toast } from "react-toastify";

// RTK Query Hooks
import { useGetUserDraftsQuery } from "../../store/slices/patentApi";
import { useLogoutUserMutation } from "../../store/slices/authApi";
import { logout } from "../../store/slices/authSlice";

import L1 from "../../assets/images/Patdots-logo-dark-bg.png";
import "../../styles/dashboard/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { id: activeId } = useParams();

  // Mobile Sidebar State
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar automatically when route changes (e.g., user clicks a draft on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const { user } = useSelector((state) => state.auth);
  const { data: response, isLoading: draftsLoading } = useGetUserDraftsQuery();
  const drafts = response?.patents || [];

  const [logoutUserMutation] = useLogoutUserMutation();

  const handleNewDraft = () => navigate("/new-draft");

  const handleLogout = async () => {
    try {
      await logoutUserMutation().unwrap();
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const getTruncatedTitle = (title) => {
    if (!title) return "Untitled Draft";
    const clean = title.replace(/<[^>]+>/g, "");
    return clean.length > 55 ? clean.substring(0, 55) + "..." : clean;
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <>
      {/* --- MOBILE HAMBURGER BUTTON --- */}
      <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
        <Menu size={24} />
      </button>

      {/* --- MOBILE DARK OVERLAY --- */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* --- SIDEBAR --- */}
      <aside className={`premium-sidebar ${isOpen ? "open" : ""}`}>
        {/* 1. Brand Logo */}
        <div className="sidebar-brand-wrapper">
          <Link to="/" className="brand-link">
            <div className="brand-text">
              <img
                src={L1}
                alt="PatDots.ai Logo"
                className="brand-logo-image"
              />
            </div>
          </Link>

          {/* Mobile Close Button inside sidebar */}
          <button className="mobile-close-btn" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* 2. New Draft Button */}
        <div className="sidebar-action">
          <button className="btn-new-draft" onClick={handleNewDraft}>
            <FileEdit size={18} strokeWidth={2} />
            <span>New Draft</span>
          </button>
        </div>

        {/* 3. Drafts List */}
        <div className="sidebar-drafts-list custom-scrollbar-dark">
          {draftsLoading ? (
            <div className="sidebar-loader">Loading...</div>
          ) : drafts?.length === 0 ? (
            <div className="sidebar-empty">No drafts found.</div>
          ) : (
            drafts?.map((draft) => {
              const isActive = activeId === draft.publicId;
              const planName =
                draft.payments?.planType || draft.payment?.planType || "Basic";
              const planFormatted =
                planName.charAt(0).toUpperCase() + planName.slice(1);

              const draftType =
                draft.draftType === "nonprovisional"
                  ? "Non-Prov"
                  : "Provisional";
              const title =
                draft.draftType === "nonprovisional"
                  ? draft.nonProvisional?.basic_sections?.title_of_invention
                      ?.content
                  : draft.provisional?.basic_sections?.title?.content;

              return (
                <div
                  key={draft._id}
                  className={`sidebar-draft-card ${isActive ? "active" : ""}`}
                  onClick={() => navigate(`/draft/${draft.publicId}`)}
                >
                  <div className="draft-meta">
                    <span className="draft-meta-text">{draftType}</span>
                  </div>
                  <h4 className="draft-title">{getTruncatedTitle(title)}</h4>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Sidebar Footer (User Profile & Logout) */}
        <div className="sidebar-footer">
          <div className="sidebar-divider"></div>
          <div className="sidebar-user-profile">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-email-info" title={user?.email}>
              {user?.email}
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

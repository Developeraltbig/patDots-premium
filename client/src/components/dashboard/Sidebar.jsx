import React, { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FileEdit } from "lucide-react";
import { fetchAllDraft } from "../../store/slices/patentSlice";
import L1 from "../../assets/images/Patdots-logo.svg";
import "../../styles/dashboard/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: activeId } = useParams();

  // Use existing Redux state
  const { drafts, draftsLoading } = useSelector((state) => state.patent);

  useEffect(() => {
    dispatch(fetchAllDraft());
  }, [dispatch]);

  const handleNewDraft = () => navigate("/new-draft");

  const getTruncatedTitle = (title) => {
    if (!title) return "Untitled Draft";
    const clean = title.replace(/<[^>]+>/g, "");
    return clean.length > 55 ? clean.substring(0, 55) + "..." : clean;
  };

  return (
    <aside className="premium-sidebar">
      {/* 1. Brand Logo */}
      <div className="sidebar-brand">
        <Link to="/" className="brand-link">
          <div className="brand-logo-wrapper">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="logo-svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M25 80V20C25 20 45 20 60 20C79.33 20 95 35.67 95 55C95 74.33 79.33 90 60 90C50 90 40.83 85.83 34.33 79.17L44.83 68.67C48.67 72.5 54 75 60 75C71.05 75 80 66.05 80 55C80 43.95 71.05 35 60 35H40V80H25ZM60 65C65.52 65 70 60.52 70 55C70 49.48 65.52 45 60 45C54.48 45 50 49.48 50 55C50 60.52 54.48 65 60 65Z"
                fill="#0f172a"
              />
            </svg>
          </div>
          <div className="brand-text">
            <h2 style={{ color: "#fff" }}>PatDots.ai</h2>
            <span>Powered by barcodeIP</span>
          </div>
        </Link>
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
              draft.draftType === "nonprovisional" ? "Non-Prov" : "Provisional";
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
                  <span className="draft-meta-text">
                    {draftType} · {planFormatted}
                  </span>
                </div>
                <h4 className="draft-title">{getTruncatedTitle(title)}</h4>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "../../store/axios";
import {
  FileText,
  Copy,
  Download,
  Edit3,
  Globe,
  Send,
  FileBadge,
  LayoutTemplate,
  Shield,
  Users,
  Search,
  Target,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { fetchDraft } from "../../store/slices/patentSlice";
import Sidebar from "./Sidebar";
import "../../styles/dashboard/Draft.css";

// --- DYNAMICALLY LOAD RAZORPAY SCRIPT ---
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const TABS = [
  { id: "draft", label: "Draft", icon: <FileText size={16} /> },
  {
    id: "non-provisional",
    label: "Non-Provisional",
    icon: <FileBadge size={16} />,
  },
  { id: "diagrams", label: "Diagrams", icon: <LayoutTemplate size={16} /> },
  { id: "uspto-form", label: "USPTO-Form", icon: <Edit3 size={16} /> },
  { id: "nda", label: "NDA", icon: <Shield size={16} /> },
  { id: "licensees", label: "Potential Licenses", icon: <Users size={16} /> },
  { id: "search", label: "Search", icon: <Search size={16} /> },
  { id: "deep-search", label: "Deep Search", icon: <Target size={16} /> },
];

const SECTIONS_CONFIG = [
  { id: "title", label: "Title", num: "01" },
  { id: "background", label: "Background", num: "02" },
  { id: "abstract", label: "Abstract", num: "03" },
  { id: "field", label: "Field Of Invention", num: "04" },
  { id: "summary", label: "Summary", num: "05" },
  { id: "description", label: "Detailed Description", num: "06" },
  { id: "advantages", label: "Advantages", num: "07" },
  { id: "claims", label: "Claims", num: "08" },
  { id: "forms", label: "USPTO Filing Forms", num: "09" },
];

const Draft = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentDraft, isFetching } = useSelector((state) => state.patent);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("draft");
  const [activeVariant, setActiveVariant] = useState("basic");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchDraft(id));
    }
  }, [id, dispatch]);

  if (isFetching || !currentDraft) {
    return (
      <div className="dashboard-layout-wrapper">
        <Sidebar />
        <main className="dashboard-main-content loader-center">
          <div className="spinner-border text-primary" role="status"></div>
        </main>
      </div>
    );
  }

  const patent = currentDraft;
  const isCurrentlyNonProv = patent.draftType === "nonprovisional";
  const draftData = isCurrentlyNonProv
    ? patent.nonProvisional
    : patent.provisional;
  const sectionsData = draftData?.[`${activeVariant}_sections`] || {};

  // Safe Title Extraction
  const rawTitle =
    sectionsData?.title?.content ||
    sectionsData?.title_of_invention?.content ||
    "Untitled Invention";
  const projectTitle = String(rawTitle).replace(/<[^>]+>/g, "");

  // --- NAVIGATE TO CHECKOUT FOR NON-PROVISIONAL UPGRADE ---
  const handleUpgradeToNonProvisional = () => {
    navigate(`/checkout/${id}?addon=nonprovisionalDraftStatus`);
  };

  // Smooth scroll
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(`sec-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getSectionContent = (secId) => {
    let schemaKey = secId;
    if (isCurrentlyNonProv) {
      const nonProvMap = {
        title: "title_of_invention",
        background: "background_of_invention",
        abstract: "abstract",
        field: "fields_of_invention",
        summary: "summary_of_invention",
        description: "detailed_descriptions",
        advantages: "embodiments",
        claims: "claims",
      };
      schemaKey = nonProvMap[secId] || secId;
    }
    return sectionsData[schemaKey]?.content || "";
  };

  // --- RENDER LOGIC ---
  const isPaywallView = activeTab === "non-provisional" && !isCurrentlyNonProv;
  const isWorkspaceView =
    activeTab === "draft" ||
    (activeTab === "non-provisional" && isCurrentlyNonProv);

  return (
    <div className="dashboard-layout-wrapper">
      <Sidebar />

      <main className="dashboard-main-content">
        {/* 1. TOP TITLE BAR */}
        <div className="dash-top-bar">
          <h1 className="dash-project-title">{projectTitle}</h1>
        </div>

        {/* 2. HORIZONTAL TABS */}
        <div className="dash-horizontal-tabs custom-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`dash-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- 3A. FEATURE PAYWALL VIEW --- */}
        {isPaywallView && (
          <div className="feature-paywall-container custom-scrollbar">
            <div className="paywall-card">
              <div className="paywall-header">
                <div className="paywall-icon-ring">
                  <FileBadge size={32} className="paywall-icon" />
                </div>
                <h2>Upgrade to Non-Provisional</h2>
                <p>
                  Transform your provisional draft into a formal, USPTO-ready
                  utility application.
                </p>
              </div>

              <div className="paywall-features">
                <div className="paywall-feature-item">
                  <CheckCircle2 size={20} className="text-purple" />
                  <div>
                    <h4>Formal Claims Section</h4>
                    <span>
                      10-15 independent and dependent claims drafted per USPTO
                      strict legal standards.
                    </span>
                  </div>
                </div>
                <div className="paywall-feature-item">
                  <CheckCircle2 size={20} className="text-purple" />
                  <div>
                    <h4>Embodiments & Detailed Description</h4>
                    <span>
                      Expanded technical scope referencing detailed drawings and
                      alternate architectures.
                    </span>
                  </div>
                </div>
                <div className="paywall-feature-item">
                  <CheckCircle2 size={20} className="text-purple" />
                  <div>
                    <h4>3 Strategic Variants</h4>
                    <span>
                      Includes Balanced, Broad, and Technical variants
                      regenerated specifically for utility filing.
                    </span>
                  </div>
                </div>
              </div>

              <div className="paywall-footer">
                <div className="paywall-price-block">
                  <span className="paywall-price-label">One-time upgrade</span>
                  <span className="paywall-price-amount">$29.00</span>
                </div>
                <button
                  className="btn-paywall-unlock"
                  onClick={handleUpgradeToNonProvisional}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    "Processing..."
                  ) : (
                    <>
                      Unlock Non-Provisional <Sparkles size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- 3B. WORKSPACE VIEW --- */}
        {isWorkspaceView && (
          <div className="workspace-scroll-container custom-scrollbar">
            <div className="workspace-grid">
              {/* LEFT OUTLINE */}
              <div className="workspace-outline-col">
                <div className="outline-header">Outline</div>
                <div className="outline-list">
                  {SECTIONS_CONFIG.map((sec) => (
                    <button
                      key={sec.id}
                      className="outline-item"
                      onClick={() => scrollToSection(sec.id)}
                    >
                      <span className="outline-num">{sec.num}</span>
                      <span className="outline-label">{sec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT DOCUMENT VIEWER */}
              <div className="workspace-document-col">
                <div className="document-toolbar">
                  <div className="variant-tabs">
                    <button
                      className={`variant-btn ${activeVariant === "basic" ? "active" : ""}`}
                      onClick={() => setActiveVariant("basic")}
                    >
                      Balanced
                    </button>
                    <button
                      className={`variant-btn ${activeVariant === "broad" ? "active" : ""}`}
                      onClick={() => setActiveVariant("broad")}
                    >
                      Broad
                    </button>
                    <button
                      className={`variant-btn ${activeVariant === "technical" ? "active" : ""}`}
                      onClick={() => setActiveVariant("technical")}
                    >
                      Technical
                    </button>
                  </div>

                  <div className="document-actions">
                    <button className="doc-action-btn">
                      <Globe size={14} /> Translate
                    </button>
                    <button
                      className="doc-action-btn"
                      onClick={() => navigate(`/draft/${id}/export`)}
                    >
                      <Download size={14} /> Download
                    </button>
                    <button className="doc-action-btn">
                      <Copy size={14} /> Copy
                    </button>
                    <button className="doc-action-btn">
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                </div>

                <div className="document-content-area">
                  {SECTIONS_CONFIG.filter((s) => s.id !== "forms").map(
                    (sec) => {
                      const content = getSectionContent(sec.id);

                      // Show loader if the draft is currently processing (e.g., right after purchase)
                      const isProcessingContent =
                        patent.status === "processing" ||
                        draftData?.[`${activeVariant}_status`] ===
                          "processing" ||
                        draftData?.[`${activeVariant}_status`] === "generating";

                      return (
                        <div
                          id={`sec-${sec.id}`}
                          className="doc-section-block"
                          key={sec.id}
                        >
                          <h3 className="doc-sec-title">{sec.label}</h3>

                          {content ? (
                            <div
                              className="doc-sec-text"
                              dangerouslySetInnerHTML={{ __html: content }}
                            />
                          ) : isProcessingContent ? (
                            <div className="inline-processing-state">
                              <div className="spinner-border-sm text-purple"></div>
                              <span>AI is drafting this section...</span>
                            </div>
                          ) : (
                            <p className="doc-sec-placeholder">
                              Content is not available for this section.
                            </p>
                          )}
                          <div className="doc-sec-divider"></div>
                        </div>
                      );
                    },
                  )}
                </div>

                {(patent.payment?.planType === "professional" ||
                  patent.payment?.planType === "enterprise" ||
                  patent.currentPlan === "professional" ||
                  patent.currentPlan === "enterprise") && (
                  <button className="fab-attorney-review">
                    <Send size={16} /> Attorney Review
                  </button>
                )}
              </div>
            </div>

            {/* USPTO FORM BOTTOM BANNER */}
            <div className="uspto-bottom-banner mt-6">
              <div className="uspto-banner-content">
                <h3 className="uspto-banner-title">USPTO-FORM</h3>
                <p className="uspto-banner-desc">
                  Generate the required USPTO filing forms automatically based
                  on your draft data. Ready for direct submission.
                </p>
              </div>
              <button
                className="btn-generate-now"
                onClick={() => setActiveTab("uspto-form")}
              >
                Generate Now <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Draft;

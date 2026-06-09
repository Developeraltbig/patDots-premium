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

import {
  fetchDraft,
  reGenerateDraft,
  setIsBasicProvisionalGenerating,
  setIsBroadProvisionalGenerating,
  setIsTechnicalProvisionalGenerating,
  setIsBasicNonProvisionalGenerating,
  setIsBroadNonProvisionalGenerating,
  setIsTechnicalNonProvisionalGenerating,
} from "../../store/slices/patentSlice";

import Sidebar from "./Sidebar";
import USPTOFormGenerator from "./USPTOFormGenerator";
import NdaGenerator from "./NdaGenerator";
import LicenseeGenerator from "./LicenseeGenerator";
import DiagramsGenerator from "./DiagramsGenerator";
import "../../styles/dashboard/Draft.css";

const TABS = [
  {
    id: "draft",
    label: "Provisional",
    addonKey: "provisionalDraftStatus",
    icon: <FileText size={16} />,
  },
  {
    id: "non-provisional",
    label: "Non-Provisional",
    addonKey: "nonprovisionalDraftStatus",
    icon: <FileBadge size={16} />,
  },
  {
    id: "diagrams",
    label: "Diagrams",
    addonKey: "Diagrams",
    icon: <LayoutTemplate size={16} />,
  },
  {
    id: "uspto-form",
    label: "USPTO-Form",
    addonKey: "formFillingStatus",
    icon: <Edit3 size={16} />,
  },
  { id: "nda", label: "NDA", addonKey: null, icon: <Shield size={16} /> }, // NDA base is free/included
  {
    id: "licensees",
    label: "Potential Licenses",
    addonKey: "licenseeReport",
    icon: <Users size={16} />,
  },
  {
    id: "search",
    label: "Search",
    addonKey: "searchStatus",
    icon: <Search size={16} />,
  },
  {
    id: "deep-search",
    label: "Deep Search",
    addonKey: "deepSearchStatus",
    icon: <Target size={16} />,
  },
];

const PROV_SECTIONS = [
  { id: "title", label: "Title", num: "01" },
  { id: "background", label: "Background", num: "02" },
  { id: "abstract", label: "Abstract", num: "03" },
  { id: "field", label: "Field Of Invention", num: "04" },
  { id: "summary", label: "Summary", num: "05" },
  { id: "description", label: "Detailed Description", num: "06" },
  { id: "advantages", label: "Advantages", num: "07" },
  { id: "claims", label: "Claims", num: "08" },
];

const NON_PROV_SECTIONS = [
  { id: "title_of_invention", label: "Title of Invention", num: "01" },
  {
    id: "background_of_invention",
    label: "Background of Invention",
    num: "02",
  },
  { id: "abstract", label: "Abstract", num: "03" },
  { id: "fields_of_invention", label: "Fields of Invention", num: "04" },
  { id: "summary_of_invention", label: "Summary of Invention", num: "05" },
  {
    id: "brief_description",
    label: "Brief Description of Drawings",
    num: "06",
  },
  { id: "detailed_descriptions", label: "Detailed Description", num: "07" },
  { id: "claims", label: "Claims", num: "08" },
];

const Draft = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    currentDraft,
    isFetching,
    isBasicProvisionalGenerating,
    isBroadProvisionalGenerating,
    isTechnicalProvisionalGenerating,
    isBasicNonProvisionalGenerating,
    isBroadNonProvisionalGenerating,
    isTechnicalNonProvisionalGenerating,
  } = useSelector((state) => state.patent);

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

  // Tab and Addon Logic
  const activeTabConfig = TABS.find((t) => t.id === activeTab);
  const requiredAddon = activeTabConfig?.addonKey;

  // Check if the current tab's required addon is unlocked
  const isUnlocked = !requiredAddon || patent.addons?.[requiredAddon] === true;

  const isCurrentlyNonProv = activeTab === "non-provisional";
  const activeSections = isCurrentlyNonProv ? NON_PROV_SECTIONS : PROV_SECTIONS;

  const draftData = isCurrentlyNonProv
    ? patent.nonProvisional
    : patent.provisional;
  const sectionsData = draftData?.[`${activeVariant}_sections`] || {};
  const activeStatus = draftData?.[`${activeVariant}_status`] || "draft";

  // Safe Title Extraction
  const rawTitle =
    sectionsData?.title?.content ||
    sectionsData?.title_of_invention?.content ||
    patent?.inventionText?.substring(0, 30) ||
    "Untitled Invention";

  const projectTitle = String(rawTitle).replace(/<[^>]+>/g, "");

  // Check if current variant is actively generating
  const isGeneratingActiveVariant = isCurrentlyNonProv
    ? (activeVariant === "basic" && isBasicNonProvisionalGenerating) ||
      (activeVariant === "broad" && isBroadNonProvisionalGenerating) ||
      (activeVariant === "technical" && isTechnicalNonProvisionalGenerating)
    : (activeVariant === "basic" && isBasicProvisionalGenerating) ||
      (activeVariant === "broad" && isBroadProvisionalGenerating) ||
      (activeVariant === "technical" && isTechnicalProvisionalGenerating);

  // Dynamic Navigation to Checkout for ANY locked addon
  const handleUnlockFeature = () => {
    navigate(`/checkout/${id}?addon=${requiredAddon}`);
  };

  const handleRegenerate = async () => {
    const draftType = isCurrentlyNonProv ? "nonprovisional" : "provisional";
    const type = `${activeVariant}_sections`;

    // Dispatch loaders immediately
    if (draftType === "provisional") {
      if (activeVariant === "basic")
        dispatch(setIsBasicProvisionalGenerating(true));
      if (activeVariant === "broad")
        dispatch(setIsBroadProvisionalGenerating(true));
      if (activeVariant === "technical")
        dispatch(setIsTechnicalProvisionalGenerating(true));
    } else {
      if (activeVariant === "basic")
        dispatch(setIsBasicNonProvisionalGenerating(true));
      if (activeVariant === "broad")
        dispatch(setIsBroadNonProvisionalGenerating(true));
      if (activeVariant === "technical")
        dispatch(setIsTechnicalNonProvisionalGenerating(true));
    }

    try {
      const res = await dispatch(
        reGenerateDraft({ id, draftType, type }),
      ).unwrap();
      if (res.success) {
        toast.success(`Regenerating ${activeVariant} draft. Please wait...`);
      }
    } catch (error) {
      toast.error("Failed to start regeneration");
    }
  };

  // Smooth scroll
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(`sec-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getSectionContent = (schemaKey) => {
    return sectionsData[schemaKey]?.content || "";
  };

  // --- RENDER LOGIC ---
  const isPaywallView = !isUnlocked;
  const isWorkspaceView =
    isUnlocked && (activeTab === "draft" || activeTab === "non-provisional");
  const isUsptoFormView = isUnlocked && activeTab === "uspto-form";
  const isNdaView = isUnlocked && activeTab === "nda";
  const isLicenseeView = isUnlocked && activeTab === "licensees";
  const isDiagramsView = isUnlocked && activeTab === "diagrams";

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

        {/* --- 3A. DYNAMIC PAYWALL VIEW --- */}
        {isPaywallView && (
          <div className="feature-paywall-container custom-scrollbar">
            <div className="paywall-card">
              <div className="paywall-header">
                <div className="paywall-icon-ring">{activeTabConfig?.icon}</div>
                <h2>Unlock {activeTabConfig?.label}</h2>
                <p>
                  Upgrade your patent strategy with premium features integrated
                  directly into this project.
                </p>
              </div>

              <div
                className="paywall-footer"
                style={{ justifyContent: "center" }}
              >
                <button
                  className="btn-paywall-unlock"
                  onClick={handleUnlockFeature}
                >
                  Unlock full draft <Sparkles size={16} />
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
                  {activeSections.map((sec) => (
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
                  {/* --- STATUS HANDLING: COMPLETED vs PROCESSING vs OTHER (Regenerate) --- */}
                  {activeStatus === "completed" ? (
                    /* RENDER ACTUAL SECTIONS WHEN COMPLETED */
                    activeSections.map((sec) => {
                      const content = getSectionContent(sec.id);

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
                          ) : (
                            <p className="doc-sec-placeholder">
                              Content is not available for this section.
                            </p>
                          )}
                          <div className="doc-sec-divider"></div>
                        </div>
                      );
                    })
                  ) : isGeneratingActiveVariant ||
                    activeStatus === "processing" ||
                    activeStatus === "generating" ? (
                    <div
                      className="inline-processing-state"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        className="spinner-border-sm text-purple"
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderWidth: "0.2em",
                          display: "inline-block",
                          borderTopColor: "transparent",
                          borderRightColor: "transparent",
                          borderBottomColor: "#8b5cf6",
                          borderLeftColor: "#8b5cf6",
                          borderRadius: "50%",
                          animation: "spinner-border .75s linear infinite",
                        }}
                      ></div>
                      <h3 style={{ marginTop: "1rem" }}>
                        AI is drafting your {activeVariant} sections...
                      </h3>
                    </div>
                  ) : (
                    /* CATCH-ALL FOR DRAFT, ERROR, OR ANY OTHER STATUS */
                    <div
                      className="regenerate-fallback-box"
                      style={{ textAlign: "center", padding: "60px 20px" }}
                    >
                      <h3 className="regenerate-title">Draft Not Generated</h3>
                      <p
                        className="regenerate-text"
                        style={{ color: "#64748b", marginBottom: "20px" }}
                      >
                        Your {activeVariant} variant for the{" "}
                        {isCurrentlyNonProv ? "Non-Provisional" : "Provisional"}{" "}
                        application is currently unavailable or needs to be
                        generated.
                      </p>
                      <button
                        onClick={handleRegenerate}
                        className="btn-paywall-unlock"
                        style={{ margin: "0 auto" }}
                      >
                        Regenerate {activeVariant} Draft
                      </button>
                    </div>
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

        {/* --- 3C. USPTO FORM VIEW --- */}
        {isUsptoFormView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <USPTOFormGenerator
              patentData={patent}
              setPatentData={() => dispatch(fetchDraft(id))}
            />
          </div>
        )}

        {/* --- 3D. NDA VIEW --- */}
        {isNdaView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <NdaGenerator
              patentData={patent}
              setPatentData={() => dispatch(fetchDraft(id))}
            />
          </div>
        )}

        {/* --- 3E. LICENSEES VIEW --- */}
        {isLicenseeView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <LicenseeGenerator patentData={patent} />
          </div>
        )}

        {/* --- 3F. DIAGRAMS VIEW --- */}
        {isDiagramsView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <DiagramsGenerator patentData={patent} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Draft;

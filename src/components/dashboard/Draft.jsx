import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getPendingDrafts } from "../../utils/draftqueueHelper";
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
  Check,
  X,
} from "lucide-react";

import ReactQuill from "react-quill-new";
import plantumlEncoder from "plantuml-encoder";
import "react-quill-new/dist/quill.snow.css";

// 1. UI Loaders (Controlled by Sockets)
import {
  setIsBasicProvisionalGenerating,
  setIsBroadProvisionalGenerating,
  setIsTechnicalProvisionalGenerating,
  setIsBasicNonProvisionalGenerating,
  setIsBroadNonProvisionalGenerating,
  setIsTechnicalNonProvisionalGenerating,
} from "../../store/slices/patentSlice";

// 2. RTK Query Hooks
import {
  useGetDraftByIdQuery,
  useRegenerateDraftMutation,
  useUpdateSectionMutation,
  useDownloadPatentPdfMutation,
  useDownloadPatentDocxMutation,
  useTranslateDocumentMutation,
} from "../../store/slices/patentApi";

import {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
} from "../../store/slices/paymentApi";

import Sidebar from "./Sidebar";
import USPTOFormGenerator from "./USPTOFormGenerator";
import NdaGenerator from "./NdaGenerator";
import LicenseeGenerator from "./LicenseeGenerator";
import DiagramsGenerator from "./DiagramsGenerator";
import SearchGenerator from "./SearchGenerator";
import DeepSearchGenerator from "./DeepSearchGenerator";
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

const ALL_LANGUAGES = [
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Hebrew" },
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
  { id: "embodiments", label: "Alternative Embodiments", num: "09" },
  {
    id: "industrial_applicability",
    label: "Industrial Applicability",
    num: "10",
  },
  { id: "block_diagram", label: "Block Diagram", num: "11" },
  { id: "flow_chart", label: "Flow Chart", num: "12" },
];

const Draft = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- RTK QUERY AUTOMAGIC ---
  const {
    data: fetchRes,
    isLoading,
    refetch,
  } = useGetDraftByIdQuery(id, { skip: !id });
  const patent = fetchRes?.data || fetchRes;
  const [regenerateDraftMutation] = useRegenerateDraftMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();

  // --- REDUX STATE (For Socket Loaders) ---
  const {
    isBasicProvisionalGenerating,
    isBroadProvisionalGenerating,
    isTechnicalProvisionalGenerating,
    isBasicNonProvisionalGenerating,
    isBroadNonProvisionalGenerating,
    isTechnicalNonProvisionalGenerating,
  } = useSelector((state) => state.patent);

  const [activeTab, setActiveTab] = useState("draft");
  const [activeVariant, setActiveVariant] = useState("basic");
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [downloadPatentPdf] = useDownloadPatentPdfMutation();
  const [downloadPatentDocx] = useDownloadPatentDocxMutation();
  const [translateDocument] = useTranslateDocumentMutation();
  const [createOrder] = useCreateOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = React.useRef(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const [showDraftLangModal, setShowDraftLangModal] = useState(false);
  const [selectedNewDraftLangs, setSelectedNewDraftLangs] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Calculate Languages
  const purchasedDraftLangs = patent?.addons?.draftTranslations || [];
  const availableDraftLanguages = ALL_LANGUAGES.filter(
    (lang) =>
      purchasedDraftLangs.includes(lang.code) ||
      purchasedDraftLangs.includes(lang.label),
  );
  const unpurchasedLanguages = ALL_LANGUAGES.filter(
    (lang) =>
      !purchasedDraftLangs.includes(lang.code) &&
      !purchasedDraftLangs.includes(lang.label),
  );
  const purchasedLabels = availableDraftLanguages
    .map((l) => l.label)
    .join(", ");

  useEffect(() => {
    if (patent && !hasInitializedTab) {
      let initialTab = "draft"; // default

      // Check what they just clicked/generated using localStorage
      const pending = getPendingDrafts();
      const localType = pending[id]?.draftType;

      // Smart routing logic based on purchased addons or intent
      if (localType === "normal_search" && patent.addons?.searchStatus) {
        initialTab = "search";
      } else if (
        localType === "nonprovisional" &&
        patent.addons?.nonprovisionalDraftStatus
      ) {
        initialTab = "non-provisional";
      } else if (
        localType === "provisional" &&
        patent.addons?.provisionalDraftStatus
      ) {
        initialTab = "draft";
      }
      // Fallbacks for legacy patents or direct navigations
      else if (
        patent.addons?.searchStatus &&
        !patent.addons?.provisionalDraftStatus &&
        !patent.addons?.nonprovisionalDraftStatus
      ) {
        initialTab = "search";
      } else if (patent.addons?.nonprovisionalDraftStatus) {
        initialTab = "non-provisional";
      } else if (patent.draftType === "nonprovisional") {
        initialTab = "non-provisional";
      }

      setActiveTab(initialTab);
      setHasInitializedTab(true);
    }
  }, [patent, hasInitializedTab, id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target)
      ) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const handleEditClick = (sectionId, currentContent) => {
    setEditingSection(sectionId);
    setEditContent(currentContent || "");
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditContent("");
  };

  const handleSaveEdit = async (sectionId) => {
    try {
      const draftType = isCurrentlyNonProv ? "nonprovisional" : "provisional";
      const type = `${activeVariant}_sections`;

      await updateSection({
        id,
        sectionKey: sectionId,
        content: editContent,
        draftType,
        type,
      }).unwrap();

      toast.success("Section updated successfully!");
      setEditingSection(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update section.");
    }
  };

  const handleDownload = async (format) => {
    setShowDownloadMenu(false);
    toast.info(`Generating ${format.toUpperCase()}...`);

    // Identifies exactly what the user is looking at (e.g., "provisional_technical")
    const draftType = isCurrentlyNonProv ? "nonprovisional" : "provisional";
    const payloadType = `${draftType}_${activeVariant}`;

    try {
      let blob;
      if (format === "pdf") {
        blob = await downloadPatentPdf({ id, type: payloadType }).unwrap();
      } else {
        blob = await downloadPatentDocx({ id, type: payloadType }).unwrap();
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Patent_Draft_${activeVariant}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download complete!");
    } catch (error) {
      toast.error("Failed to download file.");
    }
  };

  const handleTranslateDownload = async (langCode, langLabel) => {
    setIsTranslating(true);
    toast.info(`Translating to ${langLabel}...`);
    setShowDownloadMenu(false);

    const draftType = isCurrentlyNonProv ? "nonprovisional" : "provisional";
    const payloadType = `${draftType}_${activeVariant}`;

    try {
      const blob = await translateDocument({
        id,
        targetLanguage: "Spanish",
        type: payloadType, // Sends the active variant
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Patent_Draft_${activeVariant}_${langLabel.replace(/\s+/g, "_")}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`${langLabel} draft downloaded!`);
    } catch (error) {
      toast.error("Translation failed. Please try again later.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePurchaseDraftLangs = async () => {
    if (selectedNewDraftLangs.length === 0) return;
    setIsProcessingPayment(true);

    const rzpScript = document.createElement("script");
    rzpScript.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(rzpScript);

    rzpScript.onload = async () => {
      try {
        const orderRes = await createOrder({
          draftId: patent.draftId,
          addons: { draftTranslations: ["Spanish"] },
        }).unwrap();

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: "PatDots",
          description: `Draft Translations (${selectedNewDraftLangs.length} languages)`,
          order_id: orderRes.id,
          handler: async function (response) {
            try {
              const verifyRes = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                draftId: patent.draftId,
                userEmail: "altbigdeveloper3@gmail.com",
                userName: "altbig",
              }).unwrap();

              if (verifyRes.success) {
                toast.success("Languages purchased successfully!");
                refetch(); // Instantly update RTK Query Cache to unlock dropdown
                setShowDraftLangModal(false);
                setSelectedNewDraftLangs([]);
              }
            } catch (err) {
              toast.error("Payment verification failed.");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          theme: { color: "#2563eb" },
          modal: { ondismiss: () => setIsProcessingPayment(false) },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        toast.error("Could not initiate payment.");
        setIsProcessingPayment(false);
      }
    };
  };

  const toggleNewDraftLang = (code) => {
    setSelectedNewDraftLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  if (isLoading || !patent) {
    return (
      <div className="dashboard-layout-wrapper">
        <Sidebar />
        <main className="dashboard-main-content loader-center">
          <div className="spinner-border text-primary" role="status"></div>
        </main>
      </div>
    );
  }

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

    // Dispatch loaders immediately for Socket UI
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
      // Using RTK Query Mutation!
      const res = await regenerateDraftMutation({
        id,
        draftType,
        type,
      }).unwrap();
      if (res.success) {
        toast.success(`Regenerating ${activeVariant} draft. Please wait...`);
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to start regeneration");
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
  const isSearchView = isUnlocked && activeTab === "search";
  const isDeepSearchView = isUnlocked && activeTab === "deep-search";
  const getImageUrl = (code) => {
    if (!code) return null;
    try {
      const cleanCode = code
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      const encoded = plantumlEncoder.encode(cleanCode);
      return `https://www.plantuml.com/plantuml/svg/${encoded}`;
    } catch {
      return null;
    }
  };

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
                    <div
                      className="download-dropdown-wrapper"
                      ref={downloadMenuRef}
                    >
                      <button
                        className="doc-action-btn"
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      >
                        <Download size={14} /> Download {isTranslating && "..."}
                      </button>

                      {showDownloadMenu && (
                        <div className="download-menu">
                          <div className="menu-section-label">
                            Standard Format
                          </div>
                          <button onClick={() => handleDownload("docx")}>
                            <span className="file-icon docx">W</span> Word
                            Document (English)
                          </button>
                          <button onClick={() => handleDownload("pdf")}>
                            <span className="file-icon pdf">PDF</span> PDF
                            Document (English)
                          </button>

                          {availableDraftLanguages.length > 0 && (
                            <>
                              <div
                                className="menu-section-label"
                                style={{
                                  borderTop: "1px solid #f1f5f9",
                                  marginTop: "8px",
                                  paddingTop: "8px",
                                }}
                              >
                                Draft Translations
                              </div>
                              {availableDraftLanguages.map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() =>
                                    handleTranslateDownload(
                                      lang.code,
                                      lang.label,
                                    )
                                  }
                                >
                                  <span className="lang-code-abbr">
                                    {lang.code.toUpperCase()}
                                  </span>{" "}
                                  {lang.label}
                                </button>
                              ))}
                            </>
                          )}

                          {unpurchasedLanguages.length > 0 && (
                            <div
                              style={{
                                borderTop: "1px solid #f1f5f9",
                                marginTop: "4px",
                              }}
                            >
                              <button
                                className="add-more-langs-button"
                                onClick={() => {
                                  setShowDownloadMenu(false);
                                  setShowDraftLangModal(true);
                                }}
                              >
                                <span className="add-more-icon">+</span> Add
                                more languages ($29)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="document-content-area">
                  {activeStatus === "completed" ? (
                    /* RENDER ACTUAL SECTIONS WHEN COMPLETED */
                    activeSections.map((sec) => {
                      const content = getSectionContent(sec.id);
                      const isEditingThis = editingSection === sec.id;

                      // Identify if this section is a PlantUML diagram
                      const isDiagram =
                        sec.id === "flow_chart" || sec.id === "block_diagram";
                      const imageUrl = isDiagram ? getImageUrl(content) : null;

                      return (
                        <div
                          id={`sec-${sec.id}`}
                          className={`doc-section-block ${isEditingThis ? "is-editing" : ""}`}
                          key={sec.id}
                        >
                          <div className="doc-sec-header">
                            <h3 className="doc-sec-title">{sec.label}</h3>

                            {/* Editor Actions - Hidden for Diagrams to prevent code corruption */}
                            {!isDiagram &&
                              (isEditingThis ? (
                                <div className="doc-sec-actions">
                                  <button
                                    className="btn-editor-cancel"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                  >
                                    <X size={16} /> Cancel
                                  </button>
                                  <button
                                    className="btn-editor-save"
                                    onClick={() => handleSaveEdit(sec.id)}
                                    disabled={isUpdating}
                                  >
                                    <Check size={16} />{" "}
                                    {isUpdating ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn-editor-edit"
                                  onClick={() =>
                                    handleEditClick(sec.id, content)
                                  }
                                >
                                  <Edit3 size={15} /> Edit
                                </button>
                              ))}
                          </div>

                          {/* Content or Editor */}
                          {isEditingThis && !isDiagram ? (
                            <div className="quill-wrapper animate-fade-in">
                              <ReactQuill
                                theme="snow"
                                value={editContent}
                                onChange={setEditContent}
                                modules={quillModules}
                                className="premium-quill"
                              />
                            </div>
                          ) : isDiagram ? (
                            imageUrl ? (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "30px",
                                  backgroundColor: "#f8fafc",
                                  border: "1px dashed #cbd5e1",
                                  borderRadius: "8px",
                                }}
                              >
                                <img
                                  src={imageUrl}
                                  alt={sec.label}
                                  style={{ maxWidth: "100%" }}
                                />
                              </div>
                            ) : (
                              <p className="doc-sec-placeholder">
                                Diagram data is unavailable or generating...
                              </p>
                            )
                          ) : content ? (
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
            {/* Passing RTK refetch down so forms can refresh state instantly */}
            <USPTOFormGenerator patentData={patent} setPatentData={refetch} />
          </div>
        )}

        {/* --- 3D. NDA VIEW --- */}
        {isNdaView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <NdaGenerator patentData={patent} setPatentData={refetch} />
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

        {/* --- 3G. SEARCH VIEW --- */}
        {isSearchView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <SearchGenerator
              patentData={patent}
              isUnlocked={patent.addons?.searchStatus === true}
            />
          </div>
        )}

        {/* --- 3H. DEEP SEARCH VIEW --- */}
        {isDeepSearchView && (
          <div
            className="workspace-scroll-container custom-scrollbar"
            style={{ padding: "0 24px" }}
          >
            <DeepSearchGenerator
              patentData={patent}
              isUnlocked={patent.addons?.deepSearchStatus === true}
            />
          </div>
        )}

        {showDraftLangModal && (
          <div className="nda-lang-modal-overlay">
            <div className="nda-lang-modal">
              <div className="nda-lang-modal-header">
                <div>
                  <h3>Add Draft Translations</h3>
                  <p>
                    Select languages to translate.{" "}
                    <strong>$29 per language.</strong>
                  </p>
                </div>
                <button
                  className="btn-close-modal"
                  onClick={() => setShowDraftLangModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="nda-lang-modal-body">
                {purchasedLabels && (
                  <div className="nda-purchased-box">
                    Already purchased: {purchasedLabels}
                  </div>
                )}
                <div className="nda-avail-langs-section">
                  <h4>AVAILABLE LANGUAGES</h4>
                  <div className="nda-lang-pills">
                    {unpurchasedLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`nda-lang-pill ${selectedNewDraftLangs.includes(lang.code) ? "selected" : ""}`}
                        onClick={() => toggleNewDraftLang(lang.code)}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="nda-lang-modal-footer">
                <div className="nda-footer-left">
                  <p className="nda-selected-text">
                    Selected:{" "}
                    {selectedNewDraftLangs.length > 0
                      ? selectedNewDraftLangs
                          .map(
                            (c) =>
                              ALL_LANGUAGES.find((l) => l.code === c).label,
                          )
                          .join(", ")
                      : "None"}
                  </p>
                  <h3 className="nda-total-price">
                    ${(selectedNewDraftLangs.length * 29).toFixed(2)}
                  </h3>
                </div>
                <div className="nda-footer-right">
                  <button
                    className="btn-cancel-modal"
                    onClick={() => setShowDraftLangModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-purchase-modal"
                    onClick={handlePurchaseDraftLangs}
                    disabled={
                      selectedNewDraftLangs.length === 0 || isProcessingPayment
                    }
                  >
                    {isProcessingPayment
                      ? "Processing..."
                      : "Purchase & Translate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Draft;

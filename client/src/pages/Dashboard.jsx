import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useGetDraftByIdQuery } from "../features/api/patentApi";
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
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import "../styles/dashboard/Dashboard.css";

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
  { id: "claims", label: "Claims (10-15)", num: "08" },
  { id: "forms", label: "USPTO Filing Forms", num: "09" },
];

const Dashboard = () => {
  const { id } = useParams();
  const { data: response, isLoading } = useGetDraftByIdQuery(id);
  const patent = response;

  const [activeTab, setActiveTab] = useState("draft");
  const [activeVariant, setActiveVariant] = useState("basic"); // "basic" = Balanced, "broad" = Broad, "technical" = Technical

  if (isLoading)
    return (
      <div className="dash-global-loader">
        <div className="spinner"></div>
      </div>
    );
  if (!patent) return <div className="dash-error">Draft not found.</div>;

  // Extract data based on JSON structure
  const draftData =
    patent.draftType === "nonprovisional"
      ? patent.nonProvisional
      : patent.provisional;
  const sectionsData = draftData?.[`${activeVariant}_sections`] || {};

  // Get Title
  const projectTitle =
    sectionsData?.title?.content ||
    sectionsData?.title_of_invention?.content ||
    "Untitled Invention";

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(`sec-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="dashboard-layout-wrapper">
      <Sidebar />

      <main className="dashboard-main-content">
        {/* 1. TOP TITLE BAR */}
        <div className="dash-top-bar">
          <h1
            className="dash-project-title"
            dangerouslySetInnerHTML={{ __html: projectTitle }}
          />
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

        {/* 3. WORKSPACE GRID */}
        {activeTab === "draft" && (
          <div className="workspace-grid">
            {/* LEFT OUTLINE */}
            <div className="workspace-outline-col">
              <div className="outline-header">Outline</div>
              <div className="outline-list custom-scrollbar">
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
              {/* Toolbar */}
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
                  <button className="doc-action-btn">
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

              {/* Document Content Scroll Area */}
              <div className="document-content-area custom-scrollbar">
                {SECTIONS_CONFIG.filter((s) => s.id !== "forms").map((sec) => {
                  const schemaKey =
                    patent.draftType === "nonprovisional" &&
                    sec.id === "description"
                      ? "detailed_descriptions"
                      : sec.id;
                  const content = sectionsData?.[schemaKey]?.content || "";

                  return (
                    <div
                      id={`sec-${sec.id}`}
                      className="doc-section-block"
                      key={sec.id}
                    >
                      <span className="doc-sec-num">Section {sec.num}</span>
                      <h3 className="doc-sec-title">{sec.label}</h3>

                      {content ? (
                        <div
                          className="doc-sec-text"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      ) : (
                        <p className="doc-sec-placeholder">
                          Generating content...
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Attorney Review Floating Button */}
              {patent.payment?.planType === "professional" ||
              patent.payment?.planType === "enterprise" ? (
                <button className="fab-attorney-review">
                  <Send size={16} /> Attorney Review
                </button>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

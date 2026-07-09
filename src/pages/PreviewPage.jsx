// File: client/src/pages/PreviewPage.jsx

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Check, Lock } from "lucide-react";
import Header from "../components/home/Header";
import { getGlobalProjectTitle } from "../utils/stringHelpers";

// RTK Query Hook
import { useGetDraftByIdQuery } from "../store/slices/patentApi";
import { getPendingDrafts } from "../utils/draftqueueHelper";

import "../styles/home/PreviewPage.css";

// Configure section orders for standard drafts
const PROV_SECTIONS = [
  { id: "title", label: "Title", num: "01" },
  { id: "background", label: "Background", num: "02" },
  { id: "abstract", label: "Abstract", num: "03" },
  { id: "field", label: "Field Of Invention", num: "04" },
  { id: "summary", label: "Summary", num: "05" },
  { id: "description", label: "Detailed Description", num: "06" },
  { id: "advantages", label: "Advantages", num: "07" },
  { id: "claims", label: "Claims (10-15)", num: "08" },
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
  { id: "brief_description", label: "Brief Description", num: "06" },
  { id: "detailed_descriptions", label: "Detailed Description", num: "07" },
  { id: "claims", label: "Claims", num: "08" },
];

const SEARCH_SECTIONS = [
  { id: "extraction", label: "Prior Art Extraction", num: "01" },
  { id: "mapping", label: "Novelty Mapping", num: "02" },
  { id: "matrices", label: "Comparison Matrices", num: "03" },
  { id: "excerpts", label: "Verbatim Excerpts", num: "04" },
];

const PreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- RTK QUERY AUTOMAGIC ---
  const {
    data: fetchRes,
    isLoading,
    isError,
  } = useGetDraftByIdQuery(id, { skip: !id });
  const currentDraft = fetchRes?.data || fetchRes;

  // Handle errors and missing drafts gracefully
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load draft data.");
      navigate("/");
    } else if (fetchRes && !fetchRes.success && !isLoading) {
      toast.error("Draft not found");
      navigate("/");
    }
  }, [isError, fetchRes, isLoading, navigate]);

  // --- DYNAMIC TYPE DETECTION ---
  const pendingDrafts = getPendingDrafts();
  const localDraftType =
    pendingDrafts[id]?.draftType ||
    (currentDraft?.draftType === "nonprovisional"
      ? "nonprovisional"
      : "provisional");

  let addonKey = "provisionalDraftStatus";
  let displayTitle = "Provisional Draft";
  let sectionConfig = PROV_SECTIONS;
  let unlockedKeys = ["title", "background", "abstract"];

  if (localDraftType === "nonprovisional") {
    addonKey = "nonprovisionalDraftStatus";
    displayTitle = "Non-Provisional Draft";
    sectionConfig = NON_PROV_SECTIONS;
    unlockedKeys = [
      "title_of_invention",
      "background_of_invention",
      "abstract",
    ];
  } else if (localDraftType === "normal_search") {
    addonKey = "searchStatus";
    displayTitle = "Patent Search Report";
    sectionConfig = SEARCH_SECTIONS;
    unlockedKeys = []; // Everything is locked for search preview
  }

  const handleUnlock = () => {
    navigate(`/checkout/${id}?addon=${addonKey}`);
  };

  if (isLoading || !currentDraft) {
    return (
      <div className="preview-page-wrapper">
        <Header />
        <div
          style={{
            height: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  // Safely extract draft data based on backend schema
  const draftData =
    currentDraft?.draftType === "nonprovisional"
      ? currentDraft?.nonProvisional
      : currentDraft?.provisional;
  const sections = draftData?.basic_sections || {};

  const unlockedItems = sectionConfig.filter((s) =>
    unlockedKeys.includes(s.id),
  );
  const lockedItems = sectionConfig.filter((s) => !unlockedKeys.includes(s.id));

  return (
    <div className="preview-page-wrapper">
      <Header />

      <main className="preview-main">
        <h1 className="preview-page-title">
          Your {displayTitle} Is Ready To Unlock.
        </h1>

        <div className="preview-layout">
          {/* LEFT COLUMN: Document */}
          <div className="preview-document-col">
            <div className="document-header">
              {getGlobalProjectTitle(currentDraft)}
            </div>

            <div className="document-body custom-scrollbar">
              {/* --- SEARCH PREVIEW UI --- */}
              {localDraftType === "normal_search" ? (
                <div className="doc-section">
                  <h3
                    className="doc-section-title"
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "12px",
                    }}
                  >
                    Identified Patent References
                  </h3>

                  <div className="blurred-section-wrapper mt-8">
                    <div className="blurred-content">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e4e4e7",
                            borderRadius: "8px",
                            padding: "20px",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "1.1rem",
                              marginBottom: "8px",
                              color: "#18181b",
                            }}
                          >
                            Result {i}: patent/US20230{i}123A1/en
                          </div>
                          <div
                            style={{
                              display: "inline-block",
                              backgroundColor: "#f0fdf4",
                              color: "#16a34a",
                              border: "1px solid #bbf7d0",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              marginBottom: "12px",
                            }}
                          >
                            MAPPING SCORE: HIGH
                          </div>
                          <p
                            style={{
                              color: "#71717a",
                              fontSize: "0.95rem",
                              margin: 0,
                              lineHeight: 1.6,
                            }}
                          >
                            This reference considerably covers the core
                            technical components and functional mechanism
                            described in the invention. The specification
                            details a parallel processing method that closely
                            maps to the claimed features.
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="lock-overlay">
                      <div className="lock-modal">
                        <h2>View Full Search Report</h2>
                        <p>
                          Unlock to view all novelty-defeating references,
                          comparison matrices, verbatim excerpts, and mapping
                          scores.
                        </p>
                        <button
                          className="btn-unlock-purple"
                          onClick={handleUnlock}
                        >
                          Unlock full report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- STANDARD DRAFT PREVIEW UI --- */
                <>
                  {unlockedItems.map((sec) => {
                    const content =
                      sections[sec.id]?.content || "Content generating...";
                    return (
                      <div className="doc-section" key={sec.id}>
                        <span className="doc-section-label">
                          Section {sec.num}
                        </span>
                        <h3 className="doc-section-title">{sec.label}</h3>
                        <div
                          className="doc-section-text"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      </div>
                    );
                  })}

                  <div className="blurred-section-wrapper mt-8">
                    <div className="blurred-content">
                      {lockedItems.slice(0, 2).map((sec) => (
                        <div className="doc-section" key={sec.id}>
                          <span className="doc-section-label">
                            Section {sec.num}
                          </span>
                          <h3 className="doc-section-title">{sec.label}</h3>
                          <div className="doc-section-text">
                            <p>
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit. Sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="lock-overlay">
                      <div className="lock-modal">
                        <h2>{lockedItems.length} More Sections Locked</h2>
                        <p>
                          Unlock to access full claims, detailed description,
                          advantages, and alternative draft variants.
                        </p>
                        <button
                          className="btn-unlock-purple"
                          onClick={handleUnlock}
                        >
                          Unlock full draft
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Checklist & Addons */}
          <div className="preview-sidebar-col">
            <div className="checklist-container">
              {sectionConfig.map((sec) => {
                const isUnlocked = unlockedKeys.includes(sec.id);
                return (
                  <div
                    className={`checklist-item ${isUnlocked ? "unlocked" : "locked"}`}
                    key={sec.id}
                  >
                    {isUnlocked ? (
                      <Check size={16} strokeWidth={3} className="list-icon" />
                    ) : (
                      <Lock size={14} className="list-icon" />
                    )}
                    <span>{sec.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Add Ons Card */}
            <div className="addons-card">
              <span className="addons-tag">Add Ons</span>
              <h3 className="addons-title">Enhance Your Protection</h3>
              <p className="addons-desc">
                Translate to 13 languages, generate flowcharts, and discover 20+
                potential licensees.
              </p>
              <button className="btn-white-outline" onClick={handleUnlock}>
                Choose add ons
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreviewPage;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  CheckCircle2,
  FileText,
  SearchCode,
} from "lucide-react";

// RTK Query Mutation
import { useGenerateDeepSearchMutation } from "../../store/slices/patentApi";
import "../../styles/dashboard/DeepSearchGenerator.css";

// Helper to safely parse the Markdown Table from the AI response
const parseMarkdownTable = (mdString) => {
  if (!mdString) return null;
  try {
    const rows = mdString.split("\n").filter((r) => r.trim().startsWith("|"));
    if (rows.length < 3) return null; // Needs header, separator, and data

    const headers = rows[0]
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean);
    const dataRows = rows.slice(2).map((row) =>
      row
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean),
    );

    return (
      <div className="table-wrapper custom-scrollbar">
        <table className="analyzer-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  let cellClass = "";
                  const lowerCell = cell.toLowerCase();
                  if (lowerCell.includes("considerable"))
                    cellClass = "cell-high";
                  else if (lowerCell.includes("partial"))
                    cellClass = "cell-mid";

                  return (
                    <td key={j} className={cellClass}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (error) {
    console.error("Failed to parse matrix", error);
    return <p>Matrix data unavailable or malformed.</p>;
  }
};

const DeepSearchGenerator = ({ patentData, isUnlocked }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generateDeepSearch] = useGenerateDeepSearchMutation();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const [expandedCards, setExpandedCards] = useState({});

  // Safely extract Deep Search Data from Redux
  const deepSearchStatus =
    patentData?.searchData?.deep_search_status || "not-started";
  const rawData = patentData?.searchData?.deep_search_sections;

  // The JSON provided is an array with one object, or just an object. Safely handle both.
  const deepSearchData = Array.isArray(rawData) ? rawData[0] : rawData || {};

  const comparisons = deepSearchData.comparisons || [];
  const searchQueries = deepSearchData.searchQueries || [];

  const visibleResults = isUnlocked ? comparisons : comparisons.slice(0, 3);
  const lockedCount = Math.max(0, comparisons.length - 3);

  // Trigger Generation if unlocked and not started
  useEffect(() => {
    if (!id || !patentData) return;

    const triggerGeneration = async () => {
      if (isUnlocked && deepSearchStatus === "not-started") {
        setLoading(true);
        try {
          await generateDeepSearch(id).unwrap();
          toast.success("Deep Search analysis started. Please wait...");
        } catch (error) {
          toast.error(error?.data?.message || "Failed to start Deep Search.");
        } finally {
          setLoading(false);
        }
      }
    };

    triggerGeneration();
  }, [id, patentData, isUnlocked, deepSearchStatus, generateDeepSearch]);

  const handleUnlock = () => {
    navigate(`/checkout/${id}?addon=deepSearchStatus`);
  };

  const toggleCard = (cardId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // 1. LOADING STATE
  if (
    loading ||
    deepSearchStatus === "processing" ||
    deepSearchStatus === "generating"
  ) {
    return (
      <div className="search-container" style={{ padding: "40px" }}>
        <div className="search-loading-box">
          <div className="spinner-blue"></div>
          <h3>Performing Deep Novelty Analysis</h3>
          <p>
            Scrutinizing full patent specifications and building comparison
            matrices...
          </p>
        </div>
      </div>
    );
  }

  // 2. EMPTY STATE
  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="search-container" style={{ padding: "40px" }}>
        <div className="search-loading-box">
          <Target size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
          <h3>No Deep Search Data Found</h3>
          <p>
            {isUnlocked
              ? "We couldn't generate a deep analysis for this invention."
              : "Unlock the Deep Search add-on to view exhaustive 1-on-1 prior art comparisons."}
          </p>
          {!isUnlocked && (
            <button className="btn-unlock-search mt-4" onClick={handleUnlock}>
              Unlock Deep Search ($39)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="search-container animate-fade-in">
      {/* --- HEADER PREVIEW ALERT --- */}
      {!isUnlocked ? (
        <div className="search-preview-alert">
          <h2 className="preview-title">Deep Search Preview</h2>
          <p className="preview-subtitle">
            Preview shows the top 3 exhaustive comparisons. Unlock the full $39
            Deep Search output to view all {comparisons.length} matrices,
            verbatim excerpts, and full strategy logs.
          </p>
          <button className="btn-unlock-search-sm" onClick={handleUnlock}>
            Unlock Full Analysis
          </button>
        </div>
      ) : (
        <div className="search-preview-alert unlocked-alert">
          <CheckCircle2 size={24} color="#16a34a" />
          <div>
            <h2 className="preview-title" style={{ color: "#166534" }}>
              Complete Novelty Analysis
            </h2>
            <p className="preview-subtitle" style={{ color: "#15803d" }}>
              Exhaustive 1-on-1 matrices for the top {comparisons.length}{" "}
              novelty-defeating candidates.
            </p>
          </div>
        </div>
      )}

      {/* --- LOCAL TABS --- */}
      <div className="analysis-tabs-container">
        <div className="analysis-tabs-inner">
          <div className="analysis-tabs">
            <button
              className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
              onClick={() => setActiveTab("analysis")}
            >
              <Target size={16} /> Detailed Analysis
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT: ANALYSIS --- */}
      {activeTab === "analysis" && (
        <div className="search-results-list mt-4">
          {visibleResults.map((result, idx) => {
            const isExpanded = expandedCards[result.patentId];
            const details = result.details || {};

            return (
              <div className="patent-card" key={result.patentId || idx}>
                <div className="patent-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span className="rank-badge">
                      Rank {result.rank || idx + 1}
                    </span>
                    <a
                      href={details.patent_link}
                      target="_blank"
                      rel="noreferrer"
                      className="patent-link"
                    >
                      {details.publication_number ||
                        result.patentId
                          .replace("patent/", "")
                          .replace("/en", "")}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <div className="meta-tag">
                    <strong>Score:</strong>{" "}
                    {result.metrics?.considerable * 2 +
                      result.metrics?.partial || "N/A"}
                  </div>
                </div>

                <div className="patent-body">
                  <h4 className="patent-title">
                    {details.title || "Unknown Title"}
                  </h4>

                  <div className="meta-grid mb-4">
                    <div className="meta-item">
                      <strong>Assignee:</strong> {details.assignee || "N/A"}
                    </div>
                    <div className="meta-item">
                      <strong>Date:</strong> {details.filing_date || "N/A"}
                    </div>
                    <div className="meta-item">
                      <strong>Words Analyzed:</strong>{" "}
                      {result.descriptionWordCount || "N/A"}
                    </div>
                  </div>

                  {result.foundSummary && (
                    <div className="coverage-box">
                      <strong>AI Summary: </strong>
                      {result.foundSummary}
                    </div>
                  )}

                  <button
                    className="matrix-toggle-btn"
                    onClick={() => toggleCard(result.patentId)}
                  >
                    {isExpanded
                      ? "Hide Comparison Matrix"
                      : "View Comparison Matrix & Excerpts"}
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="expanded-section animate-fade-in">
                      {parseMarkdownTable(result.matrix)}

                      {result.excerpts && (
                        <div className="excerpts-box mt-4">
                          <h6>Relevant Excerpts from Prior Art</h6>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: result.excerpts.replace(
                                /<h2>|<\/h2>/g,
                                "",
                              ),
                            }}
                            style={{
                              fontSize: "0.9rem",
                              color: "#475569",
                              lineHeight: "1.6",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* --- LOCKED STATE UI --- */}
          {!isUnlocked && lockedCount > 0 && (
            <div className="locked-references-container">
              <h4 className="locked-title">
                {lockedCount} more exhaustive matrices locked
              </h4>
              <div className="locked-list">
                {Array.from({ length: lockedCount }).map((_, i) => {
                  const displayRank = i + 4;
                  const formattedRank =
                    displayRank < 10 ? `0${displayRank}` : displayRank;

                  return (
                    <div className="locked-row" key={i}>
                      <span className="locked-rank">#{formattedRank}</span>
                      <div className="locked-skeleton-line"></div>
                      <div className="locked-badge">
                        <Lock size={14} />
                        <span>Locked</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeepSearchGenerator;

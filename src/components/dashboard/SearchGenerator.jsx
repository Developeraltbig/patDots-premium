import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Lock, FileText, ChevronDown, CheckCircle2 } from "lucide-react";

// RTK Query Mutation
import { useGenerateNormalSearchMutation } from "../../store/slices/patentApi";
import "../../styles/dashboard/SearchGenerator.css";

const SearchGenerator = ({ patentData, isUnlocked }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generateNormalSearch] = useGenerateNormalSearchMutation();

  const [loading, setLoading] = useState(false);

  // Extract Search Data from Redux patentData
  const searchData = patentData?.searchData?.normal_search_sections || [];
  const searchStatus =
    patentData?.searchData?.normal_search_status || "not-started";

  // If locked, we only show the first 3. If unlocked, show all.
  const visibleResults = isUnlocked ? searchData : searchData.slice(0, 3);
  const lockedCount = Math.max(0, searchData.length - 3);

  // Trigger Generation if not started
  useEffect(() => {
    if (!id || !patentData) return;

    const triggerGeneration = async () => {
      // If the user purchased it but it hasn't started yet, generate it
      if (isUnlocked && searchStatus === "not-started") {
        setLoading(true);
        try {
          await generateNormalSearch(id).unwrap();
          toast.success("Search generation started. Please wait...");
        } catch (error) {
          toast.error(
            error?.data?.message || "Failed to start search generation.",
          );
        } finally {
          setLoading(false);
        }
      }
    };

    triggerGeneration();
  }, [id, patentData, isUnlocked, searchStatus, generateNormalSearch]);

  const handleUnlock = () => {
    navigate(`/checkout/${id}?addon=searchStatus`);
  };

  // 1. LOADING STATE
  if (
    loading ||
    searchStatus === "processing" ||
    searchStatus === "generating"
  ) {
    return (
      <div className="search-container" style={{ padding: "40px" }}>
        <div className="search-loading-box">
          <div className="spinner-blue"></div>
          <h3>Performing AI Patent Search</h3>
          <p>
            Analyzing key features and mapping prior art across global
            databases...
          </p>
        </div>
      </div>
    );
  }

  // 2. EMPTY STATE (Not generated and not locked preview)
  if (!searchData || searchData.length === 0) {
    return (
      <div className="search-container" style={{ padding: "40px" }}>
        <div className="search-loading-box">
          <FileText
            size={48}
            color="#94a3b8"
            style={{ marginBottom: "16px" }}
          />
          <h3>No Search Results Found</h3>
          <p>
            {isUnlocked
              ? "We couldn't find any relevant results for this invention."
              : "Unlock the Patent Search add-on to view novelty-defeating prior art."}
          </p>
          {!isUnlocked && (
            <button className="btn-unlock-search mt-4" onClick={handleUnlock}>
              Unlock Patent Search ($29)
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. MAIN UI
  return (
    <div className="search-container">
      {/* --- HEADER PREVIEW ALERT --- */}
      {!isUnlocked && (
        <div className="search-preview-alert">
          <h2 className="preview-title">Search Preview</h2>
          <p className="preview-subtitle">
            Preview shows the first 3 ranked patent references. Unlock the full
            $29 Search output to view all {searchData.length} references with
            Summary & Coverage points and Mapping Score* labels.
          </p>
          <button className="btn-unlock-search-sm" onClick={handleUnlock}>
            Unlock Full Report
          </button>
        </div>
      )}

      {isUnlocked && (
        <div className="search-preview-alert unlocked-alert">
          <CheckCircle2 size={24} color="#16a34a" />
          <div>
            <h2 className="preview-title" style={{ color: "#166534" }}>
              Complete Search Report
            </h2>
            <p className="preview-subtitle" style={{ color: "#15803d" }}>
              Showing all {searchData.length} ranked references based on novelty
              analysis.
            </p>
          </div>
        </div>
      )}

      <h3 className="section-main-title">Identified patent references</h3>

      {/* --- PATENT REFERENCE CARDS --- */}
      <div className="search-results-list">
        {visibleResults.map((result, idx) => {
          // Clean up the coverage points (remove the "1. ", "2. " prefixes if they exist so we can use CSS lists)
          const cleanCoverage = result.coverageFound.map((pt) =>
            pt.replace(/^\d+\.\s*/, ""),
          );

          // Determine Badge Color Class
          const scoreClass = result.mappingScore?.toLowerCase() || "medium";

          return (
            <div className="search-ref-card" key={result.patentId || idx}>
              {/* Card Header (Black Top Border) */}
              <div className="ref-card-header">
                Result {result.rank}: {result.publicationNumber}
              </div>

              {/* Card Body */}
              <div className="ref-card-body">
                {/* Title & Badge Row */}
                <div className="ref-title-row">
                  <h4 className="ref-patent-title">{result.title}</h4>
                  <div className={`mapping-score-badge ${scoreClass}`}>
                    <span className="badge-label">MAPPING SCORE*</span>
                    <span className="badge-value">{result.mappingScore}</span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="ref-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">ASSIGNEE</span>
                    <span className="meta-value">{result.assignee}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">INVENTOR</span>
                    <span className="meta-value">{result.inventor}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">PRIORITY DATE</span>
                    <span className="meta-value">
                      {result.priorityOrFilingDate}
                    </span>
                  </div>
                </div>

                {/* Summary & Coverage Box */}
                <div className="ref-coverage-box">
                  <h5 className="coverage-title">Summary & Coverage</h5>
                  <ol className="coverage-list">
                    {cleanCoverage.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- LOCKED STATE FOOTER --- */}
      {!isUnlocked && lockedCount > 0 && (
        <div className="locked-references-container">
          <h4 className="locked-title">
            {lockedCount} more ranked references locked
          </h4>
          <div className="locked-list">
            {Array.from({ length: lockedCount }).map((_, i) => {
              const displayRank = i + 4; // Starts from #04
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
  );
};

export default SearchGenerator;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

// RTK Query Hooks 
import {
  useDownloadLicenseeReportMutation,
  useGenerateLicenseesMutation,
} from "../../store/slices/patentApi";

// Sockets & UI loading states
import { setIsFetchLicenseReport } from "../../store/slices/patentSlice";
import "../../styles/dashboard/LicenseeGenerator.css";

// Icons
const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ChevronDown = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const LicenseeGenerator = ({ patentData }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  // --- RTK QUERY MUTATIONS ---
  const [downloadReport, { isLoading: isDownloading }] =
    useDownloadLicenseeReportMutation();
  const [generateLicensees] = useGenerateLicenseesMutation();

  // Redux state
  const { currentDraft, isFetchingLicenseReport } = useSelector(
    (state) => state.patent,
  );

  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(0);

  // The source of truth is always Redux
  const report = currentDraft?.licenseeReport || null;

  useEffect(() => {
    if (!id || !patentData) return;

    // Check if report already exists in DB
    if (patentData?.licenseeReport?.companies?.length > 0) {
      dispatch(setIsFetchLicenseReport(false));
    } else if (patentData?.licenseReportstatus === "processing") {
      // If the backend worker is already generating it, just show the loader
      dispatch(setIsFetchLicenseReport(true));
    } else {
      // Otherwise, trigger the generation via the backend BullMQ queue
      generateReport();
    }
  }, [patentData, id, dispatch]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Trigger the backend BullMQ job via RTK Query mutation
      await generateLicensees(id).unwrap();
      dispatch(setIsFetchLicenseReport(true));
    } catch (error) {
      toast.error(error?.data?.message || "Analysis failed. Please try again.");
      dispatch(setIsFetchLicenseReport(false));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadReport(patentData.publicId || id).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Potential_Licensees_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error(error?.data?.message || "Download failed. Please try again.");
    }
  };

  const toggleExpand = (index) => {
    setExpandedId(expandedId === index ? null : index);
  };

  // Show loaders if explicitly loading or if Redux says it's fetching/processing
  if (
    loading ||
    isFetchingLicenseReport ||
    patentData?.licenseReportstatus === "processing"
  ) {
    return (
      <div className="licensee-container" style={{ padding: "40px" }}>
        <div className="licensee-loading">
          <div className="spinner-blue"></div>
          <h3>Identifying Licensing Opportunities</h3>
          <p>
            AI is analyzing your invention and matching it with 20+ corporate
            portfolios...
          </p>
        </div>
      </div>
    );
  }

  if (!report || !report.companies || report.companies.length === 0)
    return null;

  return (
    <div className="licensee-container" style={{ padding: "20px 0" }}>
      {/* HEADER */}
      <div className="licensee-header-card">
        <div className="licensee-header-info">
          <h2>Potential Licensees</h2>
          <p>
            {report.companies.length} companies identified based on technical
            fit
          </p>
        </div>
        <button
          className="btn-download-report"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          <DownloadIcon />{" "}
          {isDownloading ? "Downloading..." : "Download Report"}
        </button>
      </div>

      {/* INDUSTRIES */}
      <div className="industries-card">
        <span className="section-label">Target Industries</span>
        <div className="industry-tags">
          {report.industries.map((ind, i) => (
            <span key={i} className="industry-tag">
              {ind}
            </span>
          ))}
        </div>
      </div>

      {/* COMPANIES LIST */}
      <div className="companies-card">
        <div className="companies-header">Top Recommended Licensees</div>

        {report.companies.map((company, index) => (
          <div
            key={index}
            className={`company-item ${expandedId === index ? "expanded" : ""}`}
          >
            <div
              className="company-summary"
              onClick={() => toggleExpand(index)}
            >
              <span className="rank-badge">{index + 1}</span>
              <span className="company-name">{company.company}</span>
              <div className="expand-icon">
                <ChevronDown />
              </div>
            </div>

            <div className="company-details">
              <p className="fit-text">{company.fit}</p>
              <div className="products-row">
                <span className="prod-label">RELEVANT PRODUCTS:</span>
                {company.products.map((prod, i) => (
                  <span key={i} className="prod-tag">
                    {prod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LicenseeGenerator;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Edit3, FileText } from "lucide-react";
import { patentApi } from "../store/slices/patentApi";
import "../styles/MyDrafts.css";
import { getGlobalProjectTitle } from "../utils/stringHelpers";

const MyDrafts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // RTK Query hook to fetch user drafts
  const { data, isLoading } = patentApi.useGetUserDraftsQuery();
  const projects = data?.patents || [];

  const handleEdit = (id) => navigate(`/draft/${id}`);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredProjects = projects.filter((p) => {
    const title = getGlobalProjectTitle(p);
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="drafts-content-inner">
      <div className="drafts-header-row">
        <h1 className="page-title">My Projects</h1>
        <div className="search-bar-container">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
          <h3>No projects found</h3>
          <p>You haven't created any drafts yet or none match your search.</p>
        </div>
      ) : (
        <div className="projects-list-container">
          {filteredProjects.map((p) => {
            const cleanTitle = getGlobalProjectTitle(p);

            const isPaid =
              p.payments?.status === "completed" ||
              p.payment?.status === "completed" ||
              p.paymentStatus === "paid";

            const typeLabel =
              p.draftType === "nonprovisional"
                ? "Non-Provisional"
                : p.draftType === "normal_search"
                  ? "Search Report"
                  : "Provisional";

            return (
              <div className="project-list-card" key={p._id}>
                <div className="card-top-row">
                  <div className="card-title-group">
                    <h3 className="card-title">{cleanTitle}</h3>

                    {/* Payment Status Badge */}
                    <span
                      className={`status-badge-${isPaid ? "paid" : "draft"}`}
                    >
                      {isPaid ? "Unlocked" : "Preview"}
                    </span>

                    {/* Draft Type Badge */}
                    <span
                      className="status-badge-draft"
                      style={{ textTransform: "capitalize" }}
                    >
                      {typeLabel}
                    </span>
                  </div>
                  <div className="card-actions">
                    <button
                      className="action-btn btn-blue"
                      onClick={() => handleEdit(p.publicId)}
                      title="Open Project"
                    >
                      <Edit3 size={14} color="white" />
                    </button>
                  </div>
                </div>
                <div className="card-description">
                  <p className="card-date">
                    Created on {formatDate(p.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDrafts;

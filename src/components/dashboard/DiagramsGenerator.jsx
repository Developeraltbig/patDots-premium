import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import plantumlEncoder from "plantuml-encoder";
import { usePatentSocket } from "../../store/slices/usePatentSocket";
import {
  diagramGenerate,
  setIsFetchFlowDiagramReport,
  setIsFetchBlockDiagramReport,
} from "../../store/slices/patentSlice";
import "../../styles/dashboard/DiagramsGenerator.css";

// Icons
const ImageIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);
const SparklesIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </svg>
);
const GridIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);
const FlowIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3v12"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="6" r="3"></circle>
    <path d="M18 9a9 9 0 0 1-9 9"></path>
  </svg>
);
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
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
const ExpandIcon = () => (
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
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);
const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const MinusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const DiagramModal = ({ isOpen, onClose, imageUrl, title }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.2));

  if (!isOpen) return null;

  return (
    <div className="diagram-modal-overlay" onClick={onClose}>
      <div
        className="diagram-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="diagram-modal-header">
          <h3>{title}</h3>
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={handleZoomOut}>
              <MinusIcon />
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="zoom-btn" onClick={handleZoomIn}>
              <PlusIcon />
            </button>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div
          className="diagram-modal-body"
          onWheel={(e) => {
            const delta = e.deltaY * -0.002;
            setZoom((prev) => Math.min(Math.max(prev + delta, 0.2), 4));
          }}
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragStart({
              x: e.clientX - position.x,
              y: e.clientY - position.y,
            });
          }}
          onMouseMove={(e) => {
            if (isDragging)
              setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
              });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            position: "relative",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              draggable="false"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                transformOrigin: "center center",
                userSelect: "none",
              }}
            />
          ) : (
            <p style={{ color: "#64748b" }}>No diagram generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DiagramsGenerator = ({ patentData }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Activate socket listener for updates
  usePatentSocket(id);

  const {
    currentDraft,
    isFetchingFlowDiagramReport,
    isFetchingBlockDiagramReport,
  } = useSelector((state) => state.patent);

  const [activeType, setActiveType] = useState("block");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive status/data from Redux State
  const diagrams = {
    block: currentDraft?.diagrams?.blockDiagram || null,
    flow: currentDraft?.diagrams?.flowChart || null,
  };

  const isGeneratingBlock =
    isFetchingBlockDiagramReport ||
    patentData?.blockDiagramstatus === "processing";
  const isGeneratingFlow =
    isFetchingFlowDiagramReport || patentData?.flowChartstatus === "processing";

  // Trigger generation logic (auto triggers if not found)
  useEffect(() => {
    if (!id || !patentData) return;

    const alreadyExists =
      (activeType === "block" && diagrams.block) ||
      (activeType === "flow" && diagrams.flow);
    const isAlreadyGenerating =
      (activeType === "block" && isGeneratingBlock) ||
      (activeType === "flow" && isGeneratingFlow);

    if (alreadyExists || isAlreadyGenerating) return;

    // Set UI loading state immediately
    if (activeType === "block") {
      dispatch(setIsFetchBlockDiagramReport(true));
    } else {
      dispatch(setIsFetchFlowDiagramReport(true));
    }

    // Call backend API which triggers the BullMQ job
    dispatch(diagramGenerate({ id, activeType }))
      .unwrap()
      .catch(() => {
        toast.error("Failed to start diagram generation");
        if (activeType === "block")
          dispatch(setIsFetchBlockDiagramReport(false));
        else dispatch(setIsFetchFlowDiagramReport(false));
      });
  }, [activeType, id, patentData, dispatch]);

  const getImageUrl = (code) => {
    if (!code) return null;
    try {
      const encoded = plantumlEncoder.encode(code);
      return `https://www.plantuml.com/plantuml/svg/${encoded}`;
    } catch {
      return null;
    }
  };

  const currentCode = activeType === "block" ? diagrams.block : diagrams.flow;
  const imageUrl = getImageUrl(currentCode);
  const isLoading =
    activeType === "block" ? isGeneratingBlock : isGeneratingFlow;

  const handleDownload = async () => {
    if (!imageUrl) return;
    toast.info("Downloading...");
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Patent_${activeType}_diagram.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="diagrams-container" style={{ padding: "20px 0" }}>
      {/* HEADER */}
      <div className="diagrams-header-card">
        <div className="diagrams-header-info">
          <div className="diagram-icon-box">
            <ImageIcon />
          </div>
          <div className="diagrams-title">
            <h2>Invention Diagrams</h2>
            <p>Visual representations of your invention</p>
          </div>
        </div>
        <div className="addon-badge">
          <SparklesIcon /> Add-on Included
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="diagrams-grid">
        <div className="diagram-selection-col">
          <div
            className={`diagram-card ${activeType === "block" ? "active" : ""}`}
            onClick={() => setActiveType("block")}
          >
            <div className="card-top">
              <div className="card-icon">
                <GridIcon />
              </div>
              <div className="card-text">
                <h3>Block Diagram</h3>
                <p>High-level component overview of your invention</p>
              </div>
            </div>
            <div className="features-list-diagram">
              <div className="feature-item-d">
                <CheckIcon /> Component relationships
              </div>
              <div className="feature-item-d">
                <CheckIcon /> System architecture
              </div>
              <div className="feature-item-d">
                <CheckIcon /> Data flow overview
              </div>
            </div>
            <button
              className="btn-download-diagram"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={!diagrams.block}
            >
              <DownloadIcon /> Download SVG
            </button>
          </div>

          <div
            className={`diagram-card ${activeType === "flow" ? "active" : ""}`}
            onClick={() => setActiveType("flow")}
          >
            <div className="card-top">
              <div className="card-icon">
                <FlowIcon />
              </div>
              <div className="card-text">
                <h3>Flowchart</h3>
                <p>Step-by-step process flow of your invention</p>
              </div>
            </div>
            <div className="features-list-diagram">
              <div className="feature-item-d">
                <CheckIcon /> Process steps
              </div>
              <div className="feature-item-d">
                <CheckIcon /> Decision points
              </div>
              <div className="feature-item-d">
                <CheckIcon /> Input/output flow
              </div>
            </div>
            <button
              className="btn-download-diagram"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={!diagrams.flow}
            >
              <DownloadIcon /> Download SVG
            </button>
          </div>
        </div>

        <div className="diagram-preview-container">
          <div className="preview-header">
            <h3>
              {activeType === "block"
                ? "Block Diagram Preview"
                : "Flowchart Preview"}
            </h3>
            <button
              className="btn-expand"
              onClick={() => setIsModalOpen(true)}
              disabled={!imageUrl}
            >
              <ExpandIcon /> Expand
            </button>
          </div>

          <div className="canvas-area">
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div className="spinner-blue"></div>
                <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Generating diagram with AI...
                </div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Diagram"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div style={{ color: "#64748b" }}>
                Failed to load diagram. Click button to regenerate.
              </div>
            )}
          </div>
        </div>
      </div>

      <DiagramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={imageUrl}
        title={
          activeType === "block"
            ? "Block Diagram"
            : "Flowchart Activity Diagram"
        }
      />
    </div>
  );
};

export default DiagramsGenerator;

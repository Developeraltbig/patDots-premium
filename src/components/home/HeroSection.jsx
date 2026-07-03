import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paperclip, ArrowRight, X } from "lucide-react";
import { toast } from "react-toastify";

// 1. Import UI State Action
import { setIsGenerating } from "../../store/slices/patentSlice";

// 2. Import RTK Query Mutation (Replaces generateDraftAction)
import { useGenerateDraftMutation } from "../../store/slices/patentApi";

import { usePatentSocket } from "../../store/slices/usePatentSocket";
import GenerateLoader from "../../pages/GenerateLoader.jsx";
import "../../styles/home/HeroSection.css";

const HeroSection = () => {
  const dispatch = useDispatch();
  const { isGenerating } = useSelector((state) => state.patent);

  // --- RTK QUERY MUTATION ---
  const [generateDraft] = useGenerateDraftMutation();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("Provisional");
  const [inventionText, setInventionText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const fileInputRef = useRef(null);

  // --- SOCKET INTEGRATION ---
  // This custom hook listens to the room.
  // When the backend finishes, it triggers navigate(`/preview/${roomId}`)
  usePatentSocket(roomId);

  // --- HANDLERS ---
  const handleTabClick = (tab) => setActiveTab(tab);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "text/plain",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        return toast.error("Only TXT, PDF, DOC, DOCX files allowed");
      }
      if (file.size > 10 * 1024 * 1024) {
        return toast.error("File size must be under 10MB");
      }
      setUploadedFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!inventionText.trim() && !uploadedFile) {
      return toast.info("Please provide a description or upload a file.");
    }

    // Map UI tab to backend draftType
    let draftType = "provisional";
    if (activeTab === "Non-Provisional") {
      draftType = "nonprovisional";
    } else if (activeTab === "Search") {
      draftType = "normal_search";
    }

    const formData = new FormData();
    formData.append("inventionText", inventionText);
    formData.append("draftType", draftType);
    if (uploadedFile) {
      formData.append("file", uploadedFile);
    }

    dispatch(setIsGenerating(true));

    try {
      // Use RTK Query mutation instead of dispatching the old thunk
      const result = await generateDraft(formData).unwrap();

      if (result.success) {
        // Setting the roomId activates the usePatentSocket hook!
        setRoomId(result.draftId);
      } else {
        dispatch(setIsGenerating(false));
        toast.error(result.error || "Generation failed.");
      }
    } catch (error) {
      dispatch(setIsGenerating(false));
      toast.error(
        error?.data?.message ||
          error.message ||
          "An unexpected error occurred.",
      );
    }
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-glow"></div>

        <div className="hero-content">
          <h1 className="hero-title">
            Search Or Draft Your
            <br />
            Invention From Plain English.
          </h1>
          <p className="hero-subtitle">
            Start With Search, Provisional Draft, Or Non-Provisional Draft. Need
            Figures, An NDA, Or A Licensee Report Instead? Open The + Menu And
            Use The Same Invention Brief For That Module Too.
          </p>

          <div className="hero-widget">
            {/* WIDGET HEADER */}
            <div className="widget-header">
              {/* File Upload Button */}
              <div className="attachment-wrapper">
                <input
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  className="btn-attachment"
                  aria-label="Attach file"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Paperclip size={18} strokeWidth={2.5} />
                </button>

                {/* Show Selected File */}
                {uploadedFile && (
                  <div className="selected-file-badge">
                    <span>{uploadedFile.name}</span>
                    <button onClick={() => setUploadedFile(null)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="widget-tabs">
                {["Search", "Provisional", "Non-Provisional"].map((tab) => (
                  <button
                    key={tab}
                    className={`widget-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => handleTabClick(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* WIDGET BODY */}
            <div className="widget-body">
              <textarea
                className="invention-input"
                placeholder="Describe your invention in plain language..."
                value={inventionText}
                onChange={(e) => setInventionText(e.target.value)}
                spellCheck="false"
              />

              <div className="widget-footer">
                <button
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={
                    (!inventionText.trim() && !uploadedFile) || isGenerating
                  }
                >
                  {isGenerating ? "Connecting..." : "Generate"}
                  {!isGenerating && <ArrowRight size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RENDER FULL-SCREEN LOADER IF GENERATING */}
      {isGenerating && <GenerateLoader draftType={activeTab} />}
    </>
  );
};

export default HeroSection;

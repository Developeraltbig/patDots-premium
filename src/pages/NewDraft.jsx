import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paperclip, ArrowRight, X } from "lucide-react";
import { toast } from "react-toastify";

import { setIsGenerating } from "../store/slices/patentSlice";
import { useGenerateDraftMutation } from "../store/slices/patentApi";
import { usePatentSocket } from "../store/slices/usePatentSocket";
import { addPendingDraft } from "../utils/draftqueueHelper";
import GenerateLoader from "./GenerateLoader.jsx";

// Reuse the hero widget core styling, but adapt to dashboard background
import "../styles/home/HeroSection.css";
import "../styles/dashboard/NewDraft.css";

const NewDraft = () => {
  const dispatch = useDispatch();
  const { isGenerating } = useSelector((state) => state.patent);
  const [generateDraft] = useGenerateDraftMutation();

  const [activeTab, setActiveTab] = useState("Provisional");
  const [inventionText, setInventionText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const fileInputRef = useRef(null);

  // Hook handles redirection once the server finishes generating
  usePatentSocket(roomId);

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
      const result = await generateDraft(formData).unwrap();
      if (result.success) {
        addPendingDraft(result.draftId, draftType);
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
    <div className="new-draft-dashboard-page">
      <div className="new-draft-container">
        <div className="new-draft-header">
          <h1>Start a New Project</h1>
          <p>
            Select your module, describe your invention, and let AI do the heavy
            lifting.
          </p>
        </div>

        {/* Uses HeroSection CSS classes, overridden slightly by dashboard-widget-variant */}
        <div className="hero-widget dashboard-widget-variant">
          <div className="widget-header">
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

              {uploadedFile && (
                <div className="selected-file-badge">
                  <span>{uploadedFile.name}</span>
                  <button onClick={() => setUploadedFile(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="widget-tabs">
              {["Search", "Provisional", "Non-Provisional"].map((tab) => (
                <button
                  key={tab}
                  className={`widget-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

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
                {isGenerating ? "Connecting..." : "Generate Project"}
                {!isGenerating && <ArrowRight size={16} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isGenerating && <GenerateLoader draftType={activeTab} />}
    </div>
  );
};

export default NewDraft;

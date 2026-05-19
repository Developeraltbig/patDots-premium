import React from "react";
import { Check, Edit2 } from "lucide-react";
import "../../styles/home/DemoSection.css";

// --- DATA ARRAYS FOR CLEANER JSX ---
const statsData = [
  { value: "1,200+", label: "Drafts Generated" },
  { value: "15,000+", label: "Patent Claims Written" },
  { value: "$2.4M+", label: "Saved Vs Attorneys" },
  { value: "98%", label: "Cheaper Than Law Firms" },
];

const generatedList = [
  "Title",
  "Background",
  "Abstract",
  "Field Of Invention",
  "Summary",
  "Detailed Description",
  "Advantages",
  "Claims (10-15)",
  "USPTO Filing Forms",
];

const mockDraftData = [
  {
    section: "Section 01",
    title: "Title",
    text: "Power amplifier with selectable parallel chains for respective power ranges",
  },
  {
    section: "Section 02",
    title: "Abstract",
    text: "Concepts and technologies disclosed herein are directed to a linear power amplifier apparatus supporting multiple radio technologies. The power amplifier includes multiple parallel chains coupled to a common amplifier stage. Each chain is configured for a respective range of output power levels and is independently selectable, allowing the apparatus to dynamically adapt its amplification characteristics...",
  },
  {
    section: "Section 03",
    title: "Background",
    text: "The present disclosure relates to the field of electronics, and more specifically to wireless communication systems. Power amplifiers (PAs) are essential components in radio frequency (RF) transceivers, responsible for boosting signal power to levels suitable for transmission. Modern wireless standards such as 5G NR, LTE-Advanced, and Wi-Fi 6E demand amplifiers capable of operating across multiple frequency bands...",
  },
  {
    section: "Section 04",
    title: "Claims",
    text: "An apparatus comprising: a linear power amplifier for multi-technology radio frequency applications, the amplifier comprising: a common amplifier stage configured to receive and amplify a first RF input signal; multiple chains coupled in parallel to an output of the common amplifier stage, each chain configured to amplify the first RF input signal...",
  },
];

const DemoSection = () => {
  return (
    <section className="demo-section">
      {/* --- TOP STATS ROW --- */}
      <div className="stats-wrapper">
        <div className="stats-container">
          {statsData.map((stat, index) => (
            <div className="stat-item" key={index}>
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-container">
        {/* --- HEADER --- */}
        <div className="demo-header">
          <div className="header-left">
            <h2>
              One Description In.
              <br />A Complete Patent Application Out.
            </h2>
          </div>
          <div className="header-right">
            <p>
              Every draft includes all required sections, formatted per USPTO
              conventions. Non-provisional applications include additional
              sections for formal claims and drawings references.
            </p>
          </div>
        </div>

        {/* --- SPLIT CONTENT GRID --- */}
        <div className="demo-grid">
          {/* LEFT COLUMN: Input & Checklist */}
          <div className="demo-col-left">
            <h4 className="section-purple-label">Your Input</h4>

            <div className="input-card">
              <div className="input-body">
                <p>
                  "A power amplifier design that uses multiple parallel
                  amplification chains, where each chain is optimized for a
                  specific output power range. The chains share a common input
                  amplifier stage and a switching network selects the
                  appropriate chain..."
                </p>
              </div>
              <div className="input-footer">
                <div className="icon-box">
                  <Edit2 size={14} color="#a1a1aa" />
                </div>
                <span>47 Words · Plain English</span>
              </div>
            </div>

            <h4 className="section-purple-label mt-8">PatDots Generates</h4>
            <div className="generate-list">
              {generatedList.map((item, index) => (
                <div className="generate-item" key={index}>
                  <Check size={16} strokeWidth={3} className="check-icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Output Document Mockup */}
          <div className="demo-col-right">
            <h4 className="section-purple-label">
              Your Generated Patent Draft
            </h4>

            {/* The scrolling container */}
            <div className="output-card-wrapper">
              <div className="output-card-scrollable custom-scrollbar">
                {mockDraftData.map((section, index) => (
                  <div className="mock-section" key={index}>
                    <span className="mock-section-label">
                      {section.section}
                    </span>
                    <h5 className="mock-section-title">{section.title}</h5>
                    <p className="mock-section-text">{section.text}</p>
                  </div>
                ))}
                {/* Extra dummy content to force scrolling */}
                <div className="mock-section">
                  <span className="mock-section-label">Section 05</span>
                  <h5 className="mock-section-title">Detailed Description</h5>
                  <p className="mock-section-text">
                    FIG. 1 is a schematic block diagram illustrating an
                    exemplary wireless communication device...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;

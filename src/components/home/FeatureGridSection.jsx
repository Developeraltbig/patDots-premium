import React from "react";
import "../../styles/home/FeatureGridSection.css";

const featuresData = [
  {
    num: "01",
    title: "Unmatched Simplicity",
    desc: "One text input — no complex forms, no drawings needed. upload a document or type a description. our ai handles structure and patent language.",
  },
  {
    num: "02",
    title: "USPTO-Ready Format",
    desc: "All required sections and filing forms included. sb/16, micro entity, and poa auto-filled. non-provisional adds ads, declaration, and ids.",
  },
  {
    num: "03",
    title: "Risk-Free Start",
    desc: "Preview your entire draft structure before paying. no credit card required to generate. pay only when you are satisfied with the output.",
  },
  {
    num: "04",
    title: "Powerful AI Engine",
    desc: "Advanced models trained on patent formats generate accurate, comprehensive drafts with proper claim structure, specification, and abstracts.",
  },
  {
    num: "05",
    title: "Bank-Level Security",
    desc: "256-bit encryption in transit and at rest. your invention is never shared or used for ai training. delete on demand. your ip stays yours.",
  },
  {
    num: "06",
    title: "Expert Option",
    desc: "Upgrade to professional for attorney review. add nda generation, invention diagrams, licensee reports, and draft translations in 13 languages.",
  },
];

const FeatureGridSection = () => {
  return (
    <section className="feature-grid-section">
      <div className="feature-grid-container">
        {/* Main Grid */}
        <div className="feature-grid">
          {/* Header Block (Spans 2 columns on desktop) */}
          <div className="feature-cell header-cell">
            <h2 className="grid-header-title">
              Everything You Need To
              <br />
              Protect Your Invention.
            </h2>
          </div>

          {/* Feature Blocks */}
          {featuresData.map((feature, index) => (
            <div className="feature-cell" key={index}>
              <div className="feature-title-row">
                <span className="feature-num">{feature.num}</span>
                <h3 className="feature-title">{feature.title}</h3>
              </div>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGridSection;

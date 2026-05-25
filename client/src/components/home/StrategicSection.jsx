import React from "react";
import { Scale, Shield, Scan, Check } from "lucide-react";
import "../../styles/home/StrategicSection.css";

const strategicCards = [
  {
    tag: "Primary",
    title: "Balanced",
    icon: <Scale size={22} strokeWidth={2} />,
    description:
      "Optimizes Both Claim Breadth And Technical Detail. The Default Starting Point — Suitable For Most Inventions.",
    features: [
      "Moderate Claim Scope",
      "Good Specification Depth",
      "Balanced Independent & Dependent Claims",
    ],
  },
  {
    tag: "Variant A",
    title: "Broad Protection",
    icon: <Shield size={22} strokeWidth={2} />,
    description:
      "Wider Independent Claims With Functional, High-Level Language. Maximizes The Scope Of Your Patent Coverage.",
    features: [
      "Widest Independent Claims",
      "Functional Language",
      "Abstract Phrasing For Maximum Scope",
    ],
  },
  {
    tag: "Variant B",
    title: "Technical Detail",
    icon: <Scan size={22} strokeWidth={2} />,
    description:
      "Deep Technical Specification With Comprehensive Dependent Claims. Strongest Defensibility In Litigation.",
    features: [
      "Deep Embodiment Descriptions",
      "Maximum Dependent Claims",
      "Specific Technical Language",
    ],
  },
];

const StrategicSection = () => {
  return (
    <section className="strategic-section">
      {/* Background glow specific to this section */}
      <div className="strategic-glow"></div>

      <div className="strategic-container">
        {/* --- HEADER --- */}
        <div className="strategic-header">
          <h2>Three Strategic Angles. Your Pick.</h2>
          <p>
            Every Draft Includes All Required Sections, Formatted Per USPTO
            Conventions. Non-Provisional Applications Include Additional
            Sections For Formal Claims And Drawings References.
          </p>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="strategic-grid">
          {strategicCards.map((card, index) => (
            <div className="strategy-card" key={index}>
              {/* Card Header (Icon + Titles) */}
              <div className="strategy-card-header">
                <div className="strategy-icon-box">{card.icon}</div>
                <div className="strategy-title-group">
                  <span className="strategy-tag">{card.tag}</span>
                  <h3 className="strategy-title">{card.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="strategy-desc">{card.description}</p>

              {/* Checklist */}
              <ul className="strategy-features">
                {card.features.map((feature, idx) => (
                  <li key={idx}>
                    <Check
                      size={16}
                      strokeWidth={3}
                      className="check-icon-purple"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* --- FOOTER NOTE --- */}
        <div className="strategic-footer-note">
          <p>
            All Three Variants Are Independently Editable And Downloadable.
            Compare Claims Side-By-Side In Your Dashboard.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StrategicSection;

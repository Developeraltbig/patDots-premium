import React from "react";
import { FileText } from "lucide-react";
import "../../styles/home/SampleSection.css";

// Data array to keep the component clean and maintainable
const sampleCards = [
  {
    title: "Search",
    icon: <FileText size={24} strokeWidth={1.5} />,
    description:
      "Closest Patent References, Relevance Mapping, And The First Signals Of Overlap.",
    includesText:
      "Full Report Adds The Complete Ranked List, Deeper Coverage Notes, And Downloadable Report.",
  },
  {
    title: "Provisional Draft",
    icon: <FileText size={24} strokeWidth={1.5} />,
    description:
      "A Title, Abstract Sample, Claim Sample, And One Visible Draft Section.",
    includesText:
      "Full Result Adds Complete Provisional Sections And Editable Download-Style Files.",
  },
  {
    title: "Non-Provisional Draft",
    icon: <FileText size={24} strokeWidth={1.5} />,
    description:
      "Formal Title, Independent Claim Sample, And Application-Style Section Preview.",
    includesText:
      "Full Result Adds Formal Draft Sections, Claims, Detailed Description, And Downloads.",
  },
];

const SampleSection = () => {
  return (
    <section className="sample-section">
      <div className="sample-container">
        {/* --- HEADER --- */}
        <div className="sample-header">
          <div className="header-left">
            <h2>See A Useful Sample Before You Pay.</h2>
          </div>
          <div className="header-right">
            <p>
              patdots shows proof that your invention was understood before
              asking you to unlock the complete downloadable result.
            </p>
          </div>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="sample-grid">
          {sampleCards.map((card, index) => (
            <div className="sample-card" key={index}>
              {/* Card Top */}
              <div className="card-top">
                <div className="card-header">
                  <div className="card-icon-box">{card.icon}</div>
                  <h3 className="card-title">{card.title}</h3>
                </div>
                <p className="card-desc">{card.description}</p>
              </div>

              {/* Card Bottom */}
              <div className="card-bottom">
                <div className="inner-box">
                  <span className="inner-label">Complete Result Includes</span>
                  <p className="inner-text">{card.includesText}</p>
                </div>
                <button className="btn-try-now">Try Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SampleSection;

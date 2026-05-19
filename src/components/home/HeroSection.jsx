import React, { useState } from "react";
import { Paperclip, ArrowRight } from "lucide-react";
import "../../styles/home/HeroSection.css";

const HeroSection = () => {
  // We'll use this state to manage the active tab visually
  const [activeTab, setActiveTab] = useState("Provisional");
  // State for the textarea input
  const [inventionText, setInventionText] = useState("");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <section className="hero-section">
      {/* The purple glow effect behind the text */}
      <div className="hero-glow"></div>

      <div className="hero-content">
        <h1 className="hero-title">
          Search Or Draft Your
          <br />
          Invention From Plain English.
        </h1>
        <p className="hero-subtitle">
          Start With Search, Provisional Draft, Or Non-Provisional Draft. Need
          Figures, An NDA, Or A Licensee Report Instead? Open The + Menu And Use
          The Same Invention Brief For That Module Too.
        </p>

        {/* The Main Input Widget */}
        <div className="hero-widget">
          {/* Widget Header (Dark) */}
          <div className="widget-header">
            <button className="btn-attachment" aria-label="Attach file">
              <Paperclip size={18} strokeWidth={2.5} />
            </button>

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

          {/* Widget Body (White) */}
          <div className="widget-body">
            <textarea
              className="invention-input"
              placeholder="Describe your invention in plain language..."
              value={inventionText}
              onChange={(e) => setInventionText(e.target.value)}
              spellCheck="false"
            />

            <div className="widget-footer">
              <button className="btn-generate" disabled={!inventionText.trim()}>
                Generate <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

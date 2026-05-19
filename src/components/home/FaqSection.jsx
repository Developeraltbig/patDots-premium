import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import "../../styles/home/FaqSection.css";

const faqData = [
  {
    question: "How Simple Is The Input Really?",
    answer:
      "Just one text field. Paste or type your technical disclosure in plain English. No drawings, no multiple forms, no legal jargon. Our AI handles structure, formatting, and patent language automatically.",
  },
  {
    question: "What Is The Difference Between Provisional And Non-Provisional?",
    answer:
      "A provisional application secures your filing date and gives you 'Patent Pending' status for 12 months with fewer formal requirements. A non-provisional is the formal application examined by the USPTO that can mature into a granted patent. We generate both.",
  },
  {
    question: "What Are The Three Draft Variants?",
    answer:
      "For every application, our AI generates three versions: 'Balanced' (standard optimization), 'Broad Protection' (wider independent claims), and 'Technical Detail' (comprehensive dependent claims). You choose the one that best fits your strategy.",
  },
  {
    question: "What Is Included In The Generated Draft?",
    answer:
      "Every draft includes all required sections: Title, Background, Abstract, Summary, Detailed Description, Advantages, and Claims. You also receive ready-to-file USPTO forms like the Transmittal, Application Data Sheet (ADS), Micro-Entity, and POA.",
  },
  {
    question: "Is My Invention Safe?",
    answer:
      "Absolutely. We use 256-bit SSL encryption. Your data is processed in memory and never used to train our AI models. We do not claim any IP rights over your input or generated output.",
  },
  {
    question: "How Is This Different From Using ChatGPT?",
    answer:
      "Standard LLMs like ChatGPT do not understand strict USPTO formatting rules, claim hierarchies, or the statutory requirements of patent sections. PatDots uses proprietary multi-pass legal reasoning to ensure compliance and technical defensibility.",
  },
  {
    question: "Can I Edit The Draft After Generation?",
    answer:
      "Yes. Once generated, your draft is saved to a secure dashboard where you can make unlimited text edits, compare variants side-by-side, and regenerate specific sections before downloading.",
  },
  {
    question: "Can I Upgrade My Plan Or Add Features Later?",
    answer:
      "Yes. You can start with a basic provisional draft and later upgrade to a non-provisional draft, add block diagrams, or purchase translated copies and NDA agreements directly from your dashboard.",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    // If clicking the currently open item, close it. Otherwise, open the new one.
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-header">
          <h2>Common Questions</h2>
        </div>

        <div className="faq-list">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div className={`faq-item ${isOpen ? "open" : ""}`} key={index}>
                <button
                  className="faq-question"
                  onClick={() => handleToggle(index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <ChevronDown size={20} className="faq-icon" strokeWidth={2} />
                </button>

                
                <div className="faq-answer-wrapper">
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

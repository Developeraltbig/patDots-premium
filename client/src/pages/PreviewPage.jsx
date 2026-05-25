import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Check, Lock } from "lucide-react";
import Header from "../components/home/Header";
import { fetchDraft } from "../store/slices/patentSlice";
import "../styles/home/PreviewPage.css";

// Configure section order and labels
const SECTION_ORDER = [
  { id: "title", label: "Title", num: "01" },
  { id: "background", label: "Background", num: "02" },
  { id: "abstract", label: "Abstract", num: "03" },
  { id: "field", label: "Field Of Invention", num: "04" },
  { id: "summary", label: "Summary", num: "05" },
  { id: "description", label: "Detailed Description", num: "06" },
  { id: "advantages", label: "Advantages", num: "07" },
  { id: "claims", label: "Claims (10-15)", num: "08" },
];

const UNLOCKED_SECTIONS = ["title", "background", "abstract"];

const PreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const { currentDraft } = useSelector((state) => state.patent);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        setIsLoading(true);
        const res = await dispatch(fetchDraft(id)).unwrap();
        if (!res.success) {
          toast.error("Draft not found");
          navigate("/");
        }
      } catch (err) {
        toast.error("Failed to load draft data.");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadDraft();
  }, [id, dispatch, navigate]);

  const handleUnlock = () => {
    navigate(`/checkout/${id}`);
  };

  if (isLoading) {
    return (
      <div className="preview-page-wrapper">
        <Header />
        <div
          style={{
            height: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  // Safely extract draft data based on backend schema
  const draftData =
    currentDraft?.draftType === "nonprovisional"
      ? currentDraft?.nonProvisional
      : currentDraft?.provisional;
  const sections = draftData?.basic_sections || {};

  const unlockedItems = SECTION_ORDER.filter((s) =>
    UNLOCKED_SECTIONS.includes(s.id),
  );
  const lockedItems = SECTION_ORDER.filter(
    (s) => !UNLOCKED_SECTIONS.includes(s.id),
  );

  return (
    <div className="preview-page-wrapper">
      <Header />

      <main className="preview-main">
        <h1 className="preview-page-title">
          Your{" "}
          {currentDraft?.draftType === "nonprovisional"
            ? "Non-Provisional"
            : "Provisional"}{" "}
          Draft Is Ready To Unlock.
        </h1>

        <div className="preview-layout">
          {/* LEFT COLUMN: Document */}
          <div className="preview-document-col">
            <div className="document-header">
              {/* Strip HTML tags for the header title */}
              {(sections?.title?.content || "Untitled Patent").replace(
                /<[^>]+>/g,
                "",
              )}
            </div>

            <div className="document-body custom-scrollbar">
              {/* --- UNLOCKED SECTIONS --- */}
              {unlockedItems.map((sec) => {
                const content =
                  sections[sec.id]?.content || "Content generating...";
                return (
                  <div className="doc-section" key={sec.id}>
                    <span className="doc-section-label">Section {sec.num}</span>
                    <h3 className="doc-section-title">{sec.label}</h3>
                    <div
                      className="doc-section-text"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                );
              })}

              {/* --- LOCKED/BLURRED SECTIONS --- */}
              <div className="blurred-section-wrapper mt-8">
                <div className="blurred-content">
                  {lockedItems.slice(0, 2).map((sec) => (
                    <div className="doc-section" key={sec.id}>
                      <span className="doc-section-label">
                        Section {sec.num}
                      </span>
                      <h3 className="doc-section-title">{sec.label}</h3>
                      <div className="doc-section-text">
                        <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Sed do eiusmod tempor incididunt ut labore et
                          dolore magna aliqua. Ut enim ad minim veniam, quis
                          nostrud exercitation ullamco laboris nisi ut aliquip
                          ex ea commodo consequat.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* THE DARK LOCK OVERLAY */}
                <div className="lock-overlay">
                  <div className="lock-modal">
                    <h2>5 More Sections Locked</h2>
                    <p>
                      field, summary, description, advantages, and claims. plus
                      2 alternative draft variants.
                    </p>
                    <button
                      className="btn-unlock-purple"
                      onClick={handleUnlock}
                    >
                      Unlock full draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Checklist & Addons */}
          <div className="preview-sidebar-col">
            <div className="checklist-container">
              {SECTION_ORDER.map((sec) => {
                const isUnlocked = UNLOCKED_SECTIONS.includes(sec.id);
                return (
                  <div
                    className={`checklist-item ${isUnlocked ? "unlocked" : "locked"}`}
                    key={sec.id}
                  >
                    {isUnlocked ? (
                      <Check size={16} strokeWidth={3} className="list-icon" />
                    ) : (
                      <Lock size={14} className="list-icon" />
                    )}
                    <span>{sec.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Add Ons Card */}
            <div className="addons-card">
              <span className="addons-tag">Add Ons</span>
              <h3 className="addons-title">Enhance Your Protection</h3>
              <p className="addons-desc">
                Translate to 13 languages, generate flowcharts, and discover 20+
                potential licensees.
              </p>
              <button className="btn-white-outline" onClick={handleUnlock}>
                Choose add ons
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreviewPage;

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { generateAndDownloadNDA } from "../../utils/ndaDocumentGenerator";
import "../../styles/dashboard/NdaGenerator.css";

// RTK Query Hooks
import {
  useSaveNdaMutation,
  useTranslateArrayMutation,
} from "../../store/slices/patentApi";
import {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
} from "../../store/slices/paymentApi";

// --- ICONS ---
const FileIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2563eb"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);
const SaveIcon = () => (
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
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);
const CalendarIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const PenIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const MailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);
const PhoneIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
const UserGrayIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
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
const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- DYNAMICALLY LOAD RAZORPAY SCRIPT ---
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// New Language List
const ALL_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese (Traditional)", flag: "🇹🇼" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "he", label: "Hebrew", flag: "🇮🇱" },
];

const NdaGenerator = ({ patentData, setPatentData }) => {
  const { user } = useSelector((state) => state.auth);

  // --- RTK QUERY MUTATIONS ---
  const [saveNda, { isLoading: isSaving }] = useSaveNdaMutation();
  const [translateArray] = useTranslateArrayMutation();
  const [createOrder] = useCreateOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const dropdownRef = useRef(null);

  const [showAddLangModal, setShowAddLangModal] = useState(false);
  const [selectedNewLangs, setSelectedNewLangs] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    effectiveDate: new Date().toISOString().split("T")[0],
    disclosingName: "",
    disclosingEmail: "",
    disclosingPhone: "",
    disclosingAddress: "",
    receivingName: "",
    receivingEmail: "",
    receivingPhone: "",
    receivingAddress: "",
    disclosingSigName: "",
    disclosingSig: "",
    disclosingSigDate: new Date().toISOString().split("T")[0],
    receivingSigName: "",
    receivingSig: "",
    receivingSigDate: new Date().toISOString().split("T")[0],
  });

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (patentData?.nda) {
      setFormData((prev) => ({ ...prev, ...patentData.nda }));
    }
  }, [patentData]);

  useEffect(() => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(
      (val) => val && val.trim() !== "",
    ).length;
    setProgress(Math.round((filledFields / totalFields) * 100));
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LANGUAGE CALCULATIONS ---
  const purchasedNdaLangs = patentData?.addons?.ndaTranslations || [];

  const availableNdaLanguages = ALL_LANGUAGES.filter(
    (lang) => lang.code === "en" || purchasedNdaLangs.includes(lang.code),
  );

  const unpurchasedLanguages = ALL_LANGUAGES.filter(
    (lang) => lang.code !== "en" && !purchasedNdaLangs.includes(lang.code),
  );

  const purchasedLabels = ALL_LANGUAGES.filter((lang) =>
    purchasedNdaLangs.includes(lang.code),
  )
    .map((l) => l.label)
    .join(", ");

  // --- HANDLE PURCHASE TRANSLATIONS ---
  const handlePurchaseLangs = async () => {
    if (selectedNewLangs.length === 0) return;
    setIsProcessingPayment(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Failed to load Razorpay SDK. Check your connection.");
      setIsProcessingPayment(false);
      return;
    }

    try {
      // 1. Create Order via RTK Query
      const orderRes = await createOrder({
        draftId: patentData.draftId,
        addons: { ndaTranslations: selectedNewLangs },
      }).unwrap();

      const { id: order_id, amount, currency } = orderRes;

      // 2. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "PatDots",
        description: `NDA Translations (${selectedNewLangs.length} languages)`,
        order_id,
        handler: async function (response) {
          try {
            // 3. Verify Payment via RTK Query
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              draftId: patentData.draftId,
              userEmail: user?.email || patentData.userEmail,
              userName: user?.name || "",
            }).unwrap();

            if (verifyRes.success) {
              toast.success("Languages purchased successfully!");
              // Refresh Redux State via the prop passed from Draft.jsx
              if (typeof setPatentData === "function") {
                setPatentData();
              }
              setShowAddLangModal(false);
              setSelectedNewLangs([]);
            }
          } catch (err) {
            toast.error("Payment verification failed.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || patentData.userEmail,
        },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setIsProcessingPayment(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (res) => {
        toast.error(res.error.description);
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.data?.message || "Could not initiate payment.");
      setIsProcessingPayment(false);
    }
  };

  const toggleNewLang = (code) => {
    setSelectedNewLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSave = async () => {
    try {
      await saveNda({ id: patentData.draftId, data: formData }).unwrap();
      if (typeof setPatentData === "function") {
        setPatentData(); // Refreshes the Redux State
      }
      toast.success("NDA progress saved!");
    } catch (error) {
      toast.error("Failed to save progress");
    }
  };

  const handleLanguageDownload = async (langCode) => {
    if (progress < 10) {
      toast.warning("Please fill in some details before downloading.");
      return;
    }

    setIsGenerating(true);
    setShowLangMenu(false);
    toast.info(`Preparing ${langCode.toUpperCase()} NDA...`);

    try {
      // 1. Save state
      await saveNda({ id: patentData.draftId, data: formData }).unwrap();

      // 2. If English, direct generation
      if (langCode === "en") {
        await generateAndDownloadNDA(formData, "en");
        toast.success("NDA downloaded successfully!");
        setIsGenerating(false);
        return;
      }

      // 3. Translate User Inputs via Backend
      const inputsToTranslate = [
        formData.disclosingName || "",
        formData.disclosingAddress || "",
        formData.receivingName || "",
        formData.receivingAddress || "",
        formData.disclosingSigName || "",
        formData.receivingSigName || "",
        formData.purpose || "Evaluation of the invention",
      ];

      const res = await translateArray({
        texts: inputsToTranslate,
        targetLanguage: langCode,
      }).unwrap();

      if (!res.success) throw new Error("Translation failed");

      // 4. Construct Translated Data Object
      const translatedData = {
        ...formData,
        disclosingName: res.translations[0],
        disclosingAddress: res.translations[1],
        receivingName: res.translations[2],
        receivingAddress: res.translations[3],
        disclosingSigName: res.translations[4],
        receivingSigName: res.translations[5],
        purpose: res.translations[6],
      };

      // 5. Generate with Translated Data
      await generateAndDownloadNDA(formData, langCode, translatedData);

      toast.success(`${langCode.toUpperCase()} NDA downloaded!`);
    } catch (error) {
      toast.error("Failed to generate document.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="nda-container">
      {/* HEADER */}
      <div className="nda-header-card">
        <div className="nda-header-info">
          <div className="nda-icon-box">
            <FileIcon />
          </div>
          <div className="nda-title">
            <h2>Non-Disclosure Agreement</h2>
            <p>Generate a customized NDA for your invention disclosure</p>
          </div>
        </div>
        <div className="nda-actions">
          <span className="progress-badge">{progress}% Complete</span>
          <button
            className="btn-save-nda"
            onClick={handleSave}
            disabled={isSaving}
          >
            <SaveIcon /> {isSaving ? "Saving..." : "Save Progress"}
          </button>
          <div className="nda-sidebar">
            <div className="nda-download-card">
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className="btn-download-nda docx"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  disabled={isGenerating}
                >
                  <DownloadIcon />{" "}
                  {isGenerating ? "Processing..." : "Download DOCX"}
                </button>

                {showLangMenu && (
                  <div className="language-menu-nda">
                    {/* Render Available (Purchased) Languages */}
                    {availableNdaLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        className="lang-item-nda"
                        onClick={() => handleLanguageDownload(lang.code)}
                      >
                        <span className="lang-code-abbr">
                          {lang.code === "en"
                            ? "US"
                            : lang.code.substring(0, 2).toUpperCase()}
                        </span>
                        <span className="lang-label-text">{lang.label}</span>
                      </div>
                    ))}

                    {/* Render "+ Add more languages" Option */}
                    {unpurchasedLanguages.length > 0 && (
                      <div
                        className="lang-item-nda add-more-langs"
                        onClick={() => {
                          setShowLangMenu(false);
                          setShowAddLangModal(true);
                        }}
                      >
                        <span className="add-more-icon">+</span>
                        <span className="add-more-text">
                          Add more languages ($19)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---  ADD TRANSLATIONS MODAL --- */}
      {showAddLangModal && (
        <div className="nda-lang-modal-overlay">
          <div className="nda-lang-modal">
            <div className="nda-lang-modal-header">
              <div>
                <h3>Add NDA Translations</h3>
                <p>
                  Select languages to translate.{" "}
                  <strong>$19 per language.</strong>
                </p>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setShowAddLangModal(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="nda-lang-modal-body">
              {purchasedLabels && (
                <div className="nda-purchased-box">
                  Already purchased: {purchasedLabels}
                </div>
              )}

              <div className="nda-avail-langs-section">
                <h4>AVAILABLE LANGUAGES</h4>
                <div className="nda-lang-pills">
                  {unpurchasedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`nda-lang-pill ${selectedNewLangs.includes(lang.code) ? "selected" : ""}`}
                      onClick={() => toggleNewLang(lang.code)}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="nda-lang-modal-footer">
              <div className="nda-footer-left">
                <p className="nda-selected-text">
                  Selected:{" "}
                  {selectedNewLangs.length > 0
                    ? selectedNewLangs
                        .map(
                          (code) =>
                            ALL_LANGUAGES.find((l) => l.code === code).label,
                        )
                        .join(", ")
                    : "None"}
                </p>
                <h3 className="nda-total-price">
                  ${(selectedNewLangs.length * 19).toFixed(2)}
                </h3>
              </div>
              <div className="nda-footer-right">
                <button
                  className="btn-cancel-modal"
                  onClick={() => setShowAddLangModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-purchase-modal"
                  onClick={handlePurchaseLangs}
                  disabled={
                    selectedNewLangs.length === 0 || isProcessingPayment
                  }
                >
                  {isProcessingPayment
                    ? "Processing..."
                    : "Purchase & Translate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="nda-layout-grid">
        <div className="nda-form-col">
          {/* Card 1: Agreement Details */}
          <div className="nda-card">
            <div className="nda-card-header">
              <CalendarIcon /> Agreement Details
            </div>
            <div className="form-group" style={{ maxWidth: "350px" }}>
              <label>
                Effective Date <span>*</span>
              </label>
              <input
                type="date"
                name="effectiveDate"
                className="form-control-nda no-icon"
                value={formData.effectiveDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Card 2: Disclosing */}
          <div className="nda-card">
            <div className="nda-card-header">
              <UserIcon /> Disclosing Party (Inventor/Owner)
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Full Name <span>*</span>
                </label>
                <div className="form-input-wrapper">
                  <span className="input-icon">
                    <UserGrayIcon />
                  </span>
                  <input
                    type="text"
                    name="disclosingName"
                    placeholder="Enter your full legal name"
                    className="form-control-nda"
                    value={formData.disclosingName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="form-input-wrapper">
                  <span className="input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="text"
                    name="disclosingEmail"
                    placeholder="contact@example.com"
                    className="form-control-nda"
                    value={formData.disclosingEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="form-full">
              <div className="form-group" style={{ maxWidth: "50%" }}>
                <label>Phone</label>
                <div className="form-input-wrapper">
                  <span className="input-icon">
                    <PhoneIcon />
                  </span>
                  <input
                    type="text"
                    name="disclosingPhone"
                    placeholder="9876543210"
                    className="form-control-nda"
                    value={formData.disclosingPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="form-full">
              <div className="form-group">
                <label>
                  Complete Address <span>*</span>
                </label>
                <input
                  type="text"
                  name="disclosingAddress"
                  placeholder="Street address, City, State, ZIP, Country"
                  className="form-control-nda no-icon"
                  value={formData.disclosingAddress}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Receiving */}
          <div className="nda-card">
            <div className="nda-card-header">
              <UserIcon /> Receiving Party
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Full Name <span>*</span>
                </label>
                <div className="form-input-wrapper">
                  <span className="input-icon">
                    <UserGrayIcon />
                  </span>
                  <input
                    type="text"
                    name="receivingName"
                    placeholder="Enter your full legal name"
                    className="form-control-nda"
                    value={formData.receivingName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="form-input-wrapper">
                  <span className="input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="text"
                    name="receivingEmail"
                    placeholder="contact@example.com"
                    className="form-control-nda"
                    value={formData.receivingEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="form-full">
              <div className="form-group" style={{ maxWidth: "50%" }}>
                <label>Phone</label>
                <div className="form-input-wrapper">
                  <span className="input-icon">
                    <PhoneIcon />
                  </span>
                  <input
                    type="text"
                    name="receivingPhone"
                    placeholder="9876543210"
                    className="form-control-nda"
                    value={formData.receivingPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="form-full">
              <div className="form-group">
                <label>
                  Complete Address <span>*</span>
                </label>
                <input
                  type="text"
                  name="receivingAddress"
                  placeholder="Street address, City, State, ZIP, Country"
                  className="form-control-nda no-icon"
                  value={formData.receivingAddress}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Signatures */}
          <div className="nda-card">
            <div className="nda-card-header">
              <PenIcon /> Signatures
            </div>
            <div className="form-row">
              <div className="signature-col">
                <label className="sig-header">Disclosing Party</label>
                <div className="form-group mb-4">
                  <label>Printed Name</label>
                  <input
                    type="text"
                    name="disclosingSigName"
                    placeholder="Your full name"
                    className="form-control-nda no-icon"
                    value={formData.disclosingSigName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-4">
                  <label>E-Signature</label>
                  <input
                    type="text"
                    name="disclosingSig"
                    placeholder="/Your Full Name/"
                    className="form-control-nda no-icon"
                    value={formData.disclosingSig}
                    onChange={handleChange}
                  />
                  <div className="helper-text">
                    Type your name between forward slashes
                  </div>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="disclosingSigDate"
                    className="form-control-nda no-icon"
                    value={formData.disclosingSigDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="signature-col">
                <label className="sig-header">Receiving Party</label>
                <div className="form-group mb-4">
                  <label>Printed Name</label>
                  <input
                    type="text"
                    name="receivingSigName"
                    placeholder="Recipient's full name"
                    className="form-control-nda no-icon"
                    value={formData.receivingSigName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-4">
                  <label>E-Signature</label>
                  <input
                    type="text"
                    name="receivingSig"
                    placeholder="/Full Name/"
                    className="form-control-nda no-icon"
                    value={formData.receivingSig}
                    onChange={handleChange}
                  />
                  <div className="helper-text">
                    To be signed by receiving party
                  </div>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="receivingSigDate"
                    className="form-control-nda no-icon"
                    value={formData.receivingSigDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NdaGenerator;

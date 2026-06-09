import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Lock, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../store/axios";
import { setAuthUser } from "../store/slices/authSlice";
import Header from "../components/home/Header";
import "../styles/home/CheckoutPage.css";

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

const CheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state to auto-verify if the user is already logged in
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // --- PRICING & ADDONS STATE ---
  const [searchParams] = useSearchParams();
  const targetAddon = searchParams.get("addon") || "provisionalDraftStatus";
  const languageParam = searchParams.get("lang"); // optional e.g., ?addon=ndaTranslations&lang=Hindi

  const PRICING_MAP = {
    provisionalDraftStatus: {
      label: "Premium Provisional Draft",
      price: 149.0,
    },
    nonprovisionalDraftStatus: {
      label: "Non-Provisional Draft Upgrade",
      price: 29.0,
    },
    Diagrams: { label: "Diagrams (Block & Flow)", price: 19.0 },
    licenseeReport: { label: "Potential Licensees Report", price: 49.0 },
    searchStatus: { label: "Patent Search", price: 29.0 },
    deepSearchStatus: { label: "Deep Search", price: 39.0 },
    formFillingStatus: { label: "USPTO Form Filling", price: 19.0 },
    AttorneyReviewStatus: { label: "Attorney Review", price: 149.0 },
    ndaTranslations: {
      label: `NDA Translation (${languageParam})`,
      price: 19.0,
    },
    draftTranslations: {
      label: `Draft Translation (${languageParam})`,
      price: 29.0,
    },
  };

  // Initialize addons state dynamically based on the requested addon
  const initialAddons = {};
  if (
    targetAddon === "ndaTranslations" ||
    targetAddon === "draftTranslations"
  ) {
    // Backend expects an array for translations
    initialAddons[targetAddon] = languageParam ? [languageParam] : [];
  } else {
    // Standard boolean addons
    initialAddons[targetAddon] = true;
  }

  const [addons, setAddons] = useState(initialAddons);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = Object.keys(addons).reduce((sum, key) => {
    if (addons[key] === true) {
      return sum + (PRICING_MAP[key]?.price || 0);
    } else if (Array.isArray(addons[key])) {
      return sum + addons[key].length * (PRICING_MAP[key]?.price || 0);
    }
    return sum;
  }, 0);

  const toggleAddon = (addonKey) => {
    setAddons((prev) => {
      const next = { ...prev };
      if (next[addonKey]) {
        delete next[addonKey];
      } else {
        next[addonKey] = true;
      }
      return next;
    });
  };

  // --- AUTH / OTP STATE ---
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("input"); // 'input' | 'verify' | 'verified'
  const [otpCode, setOtpCode] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // Auto-verify if user is already logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setStep("verified");
    }
  }, [user]);

  // --- 1. SEND OTP ---
  const handleSendOtp = async () => {
    if (!email || !email.includes("@") || !email.includes(".")) {
      return toast.error("Please enter a valid email address.");
    }
    setEmailLoading(true);
    try {
      const res = await axios.post("/api/auth/send-otp", { email });
      if (res.data.success) {
        setStep("verify");
        toast.info("Verification code sent to your email.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send code.");
    } finally {
      setEmailLoading(false);
    }
  };

  // --- 2. VERIFY OTP ---
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      return toast.error("Please enter the 6-digit code.");
    }
    setEmailLoading(true);
    try {
      const res = await axios.post("/api/auth/verify-otp", {
        email,
        otp: otpCode,
      });
      if (res.data.success) {
        setStep("verified");
        toast.success("Email verified successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired code.");
    } finally {
      setEmailLoading(false);
    }
  };

  // --- 3. PROCESS PAYMENT ---
  const handlePayment = async () => {
    setIsProcessing(true);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      toast.error(
        "Failed to load payment gateway. Please check your connection.",
      );
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create Order on Backend
      const orderResponse = await axios.post("/api/payments/create-order", {
        draftId: id,
        addons: addons,
      });

      const { id: order_id, amount, currency } = orderResponse.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "PatDots.ai",
        description: `Patent Service - ${PRICING_MAP[targetAddon]?.label || "Addon"}`,
        order_id: order_id,
        prefill: { email: email, name: user?.name || "" },
        theme: { color: "#8b5cf6" },
        handler: async function (response) {
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              draftId: id,
              userEmail: email,
              userName: user?.name || "",
            };

            const verifyResponse = await axios.post(
              "/api/payments/verify-payment",
              verifyPayload,
            );

            if (verifyResponse.data.success) {
              toast.success("Payment Successful! Securing your dashboard...");

              // Immediately authenticate the user in Redux
              // The backend has already set the HTTP-only JWT cookie in the browser
              if (!isAuthenticated && verifyResponse.data.user) {
                dispatch(setAuthUser(verifyResponse.data.user));
              }

              // Smooth redirect to the Protected Dashboard
              setTimeout(() => {
                navigate(`/draft/${id}`, { replace: true });
              }, 1500);
            }
          } catch (err) {
            toast.error(
              "Payment verification failed. If money was deducted, please contact support.",
            );
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        toast.error(response.error.description);
        setIsProcessing(false);
      });
      paymentObject.open();
    } catch (error) {
      toast.error("An error occurred during checkout initiation.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      <Header />

      <main className="checkout-main">
        <div className="checkout-header">
          <h1 className="checkout-title">Complete Your Order</h1>
          <p className="checkout-subtitle">
            Verify your email and secure your invention with premium
            documentation.
          </p>
        </div>

        <div className="checkout-grid">
          <div className="checkout-card summary-card">
            <div className="checkout-card mb-6">
              {step === "verified" ? (
                <div className="verified-badge-modern">
                  <div className="verified-info">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span className="verified-email">{email}</span>
                  </div>
                  {!user && (
                    <button
                      className="btn-change-email-link"
                      onClick={() => {
                        setStep("input");
                        setOtpCode("");
                      }}
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (
                <div className="verification-flow">
                  {/* LABEL AND INPUT */}
                  <div className="input-group">
                    <label>Account Email Address</label>
                    <input
                      type="email"
                      className="checkout-input email-field"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={step === "verify" || emailLoading}
                    />
                  </div>

                  {/* VERIFY BUTTON (Only visible before OTP is sent) */}
                  {step === "input" && (
                    <button
                      className="btn-verify-dark"
                      onClick={handleSendOtp}
                      disabled={emailLoading || !email}
                    >
                      {emailLoading ? "Sending..." : "Verify"}
                    </button>
                  )}

                  {/* OTP VERIFICATION BOX (Matches your screenshot) */}
                  {step === "verify" && (
                    <div className="otp-verification-box animate-fade-in">
                      <input
                        type="text"
                        className="checkout-input otp-input-field"
                        placeholder="E n t e r  6 - d i g i t  c o d e"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, ""))
                        }
                        disabled={emailLoading}
                      />
                      <div className="otp-action-row">
                        <button
                          className="btn-verify-success"
                          onClick={handleVerifyOtp}
                          disabled={emailLoading || otpCode.length !== 6}
                        >
                          {emailLoading ? "Checking..." : "Confirm Code"}
                        </button>
                        <button
                          className="btn-change-email-link"
                          onClick={() => {
                            setStep("input");
                            setOtpCode("");
                          }}
                        >
                          Change Email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Locked Payment Placeholder (The dashed box) */}
            {step !== "verified" && (
              <div className="locked-payment-placeholder animate-fade-in">
                Verify email to unlock payment
              </div>
            )}

            <h2 className="card-heading">Order Summary</h2>

            <div className="summary-list">
              <div className="summary-item">
                <span className="item-name">
                  {PRICING_MAP[targetAddon]?.label || targetAddon}
                </span>
                <span className="item-price">
                  $
                  {(Array.isArray(addons[targetAddon])
                    ? PRICING_MAP[targetAddon]?.price *
                      addons[targetAddon].length
                    : PRICING_MAP[targetAddon]?.price || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="summary-divider"></div>

              {["Diagrams", "licenseeReport"].map((optKey) => {
                if (targetAddon === optKey) return null; // Don't show in optionals if it's the main item being bought
                return (
                  <React.Fragment key={optKey}>
                    <div className="summary-item addon-item">
                      <span className="item-name">
                        {PRICING_MAP[optKey].label}
                      </span>
                      <div className="addon-action">
                        {!addons[optKey] ? (
                          <button
                            className="btn-add-addon"
                            onClick={() => toggleAddon(optKey)}
                          >
                            Add +
                          </button>
                        ) : (
                          <button
                            className="btn-remove-addon"
                            onClick={() => toggleAddon(optKey)}
                          >
                            Remove <X size={12} />
                          </button>
                        )}
                        <span className="item-price">
                          ${PRICING_MAP[optKey].price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="summary-divider"></div>
                  </React.Fragment>
                );
              })}

              <div className="summary-total">
                <span className="total-label">TOTAL</span>
                <span className="total-price">${totalAmount.toFixed(2)}</span>
              </div>

              {step === "verified" ? (
                <div className="payment-actions animate-fade-in">
                  <div className="terms-checkbox-group">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={isTermsAccepted}
                      onChange={(e) => setIsTermsAccepted(e.target.checked)}
                    />
                    <label htmlFor="terms">
                      I agree to the{" "}
                      <a href="/terms" target="_blank">
                        terms of service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" target="_blank">
                        privacy policy
                      </a>
                      .
                    </label>
                  </div>

                  <button
                    className="btn-pay-now"
                    onClick={handlePayment}
                    disabled={isProcessing || !isTermsAccepted}
                  >
                    {isProcessing
                      ? "Processing Securely..."
                      : `Pay $${totalAmount.toFixed(0)}`}
                  </button>
                </div>
              ) : (
                <button className="btn-pay-now disabled-placeholder" disabled>
                  Awaiting Verification
                </button>
              )}

              <div className="privacy-assurance mt-4">
                <ShieldCheck size={16} className="shield-icon" />
                <span>
                  Your invention details are confidential. We never share
                  content with third parties.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;

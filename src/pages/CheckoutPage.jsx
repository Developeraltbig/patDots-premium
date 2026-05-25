import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Lock, ShieldCheck, X } from "lucide-react";
import { toast } from "react-toastify";
// import axios from "../features/api/axios"; // Assuming axios is set up
import { setCredentials } from "../features/auth/authSlice";
import Header from "../components/home/Header";
import "../styles/home/CheckoutPage.css";

// --- DYNAMICALLY LOAD RAZORPAY SCRIPT ---
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
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

  // --- STATE ---
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Add-ons State
  const [addons, setAddons] = useState({
    nda: false,
    diagram: false,
  });

  // OTP Auth State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // --- PRICING LOGIC ---
  const basePrice = 149.0;
  const ndaPrice = 19.0;
  const diagramPrice = 58.0;

  const totalAmount =
    basePrice +
    (addons.nda ? ndaPrice : 0) +
    (addons.diagram ? diagramPrice : 0);

  const toggleAddon = (addon) => {
    setAddons((prev) => ({ ...prev, [addon]: !prev[addon] }));
  };

  // --- PAYMENT FLOW ---
  const handlePayment = async () => {
    if (!email || !email.includes("@")) {
      return toast.error("Please enter a valid email for your receipt.");
    }

    setIsProcessing(true);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      toast.error("Failed to load payment gateway.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create Order on Backend (Mocked API call)
      // const { data: order } = await axios.post("/api/payments/create-order", { draftId: id, totalAmount, addons });

      // Mocking Razorpay Order ID for demonstration
      const mockOrderId = "order_mock12345";

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mockkey",
        amount: totalAmount * 100, // Razorpay works in smallest currency unit (paise/cents)
        currency: "USD",
        name: "PatDots.ai",
        description: "Premium Patent Draft & Add-ons",
        order_id: mockOrderId,
        prefill: { email: email },
        theme: { color: "#8b5cf6" },
        handler: async function (response) {
          // 2. Payment Success -> Verify on Backend
          // await axios.post("/api/payments/verify", response);

          toast.success("Payment Successful! Securing your account...");

          // 3. Trigger OTP Email & Show Modal
          // await axios.post("/api/auth/send-otp", { email });
          setShowOtpModal(true);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (error) {
      toast.error("An error occurred during checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- OTP VERIFICATION FLOW ---
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6)
      return toast.error("Please enter the 6-digit code.");

    setIsVerifying(true);
    try {
      // 1. Verify OTP and Auto-Create User on Backend
      // const { data } = await axios.post("/api/auth/verify-otp-and-login", { email, otpCode, draftId: id });

      // Mocking successful auth response
      const mockUser = { email: email, id: "user123" };
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR...";

      // 2. Save globally in Redux
      dispatch(setCredentials({ user: mockUser, token: mockToken }));

      toast.success("Account verified! Redirecting to your dashboard...");
      setShowOtpModal(false);

      // 3. Redirect to the protected dashboard
      setTimeout(() => navigate(`/draft/${id}`), 1500);
    } catch (error) {
      toast.error("Invalid OTP code.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      <Header />

      <main className="checkout-main">
        <div className="checkout-header">
          <h1 className="checkout-title">Add USPTO-Form</h1>
          <p className="checkout-subtitle">
            Secure your invention with premium documentation and analysis.
          </p>
        </div>

        <div className="checkout-grid">
          {/* LEFT COLUMN: Payment Details */}
          <div className="checkout-card">
            <h2 className="card-heading">Payment Details</h2>

            <div className="input-group">
              <label>Email For Receipt</label>
              <input
                type="email"
                className="checkout-input"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Visual Card Inputs (Since Razorpay handles actual processing, 
                we make these visually match the design but read-only/decorative) */}
            <div className="input-group mt-6">
              <label>Card</label>
              <div className="card-input-wrapper">
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="0000 0000 0000 0000"
                  disabled
                />
              </div>
              <div className="card-split-inputs mt-4">
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="MM/YY"
                  disabled
                />
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="CVC"
                  disabled
                />
              </div>
            </div>

            <div className="secure-badge mt-6">
              <Lock size={14} className="lock-icon" />
              <span>Secure Payment. Protected by 256-bit encryption.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="checkout-card summary-card">
            <h2 className="card-heading">Order Summary</h2>

            <div className="summary-list">
              <div className="summary-item">
                <span className="item-name">Potential Licensees Report</span>
                <span className="item-price">${basePrice.toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-item addon-item">
                <span className="item-name">NDA</span>
                <div className="addon-action">
                  {!addons.nda ? (
                    <button
                      className="btn-add-addon"
                      onClick={() => toggleAddon("nda")}
                    >
                      Add +
                    </button>
                  ) : (
                    <button
                      className="btn-remove-addon"
                      onClick={() => toggleAddon("nda")}
                    >
                      Remove <X size={12} />
                    </button>
                  )}
                  <span className="item-price">${ndaPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-item addon-item">
                <span className="item-name">Diagram</span>
                <div className="addon-action">
                  {!addons.diagram ? (
                    <button
                      className="btn-add-addon"
                      onClick={() => toggleAddon("diagram")}
                    >
                      Add +
                    </button>
                  ) : (
                    <button
                      className="btn-remove-addon"
                      onClick={() => toggleAddon("diagram")}
                    >
                      Remove <X size={12} />
                    </button>
                  )}
                  <span className="item-price">${diagramPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="total-label">TOTAL</span>
                <span className="total-price">${totalAmount.toFixed(2)}</span>
              </div>

              <button
                className="btn-pay-now"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Processing..."
                  : `Pay $${totalAmount.toFixed(0)}`}
              </button>

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

      {/* --- OTP MODAL OVERLAY --- */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-card">
            <h2>Verify Your Email</h2>
            <p>
              We sent a 6-digit secure code to <strong>{email}</strong>. Enter
              it below to access your unlocked draft.
            </p>

            <input
              type="text"
              maxLength={6}
              className="otp-input"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            />

            <button
              className="btn-verify-otp"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpCode.length !== 6}
            >
              {isVerifying ? "Verifying..." : "Verify & Access Dashboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

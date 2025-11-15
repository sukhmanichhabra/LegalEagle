import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Check,
  X,
  Crown,
  Zap,
  FileText,
  MessageSquare,
  Shield,
  Loader2,
  CreditCard,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import * as api from "../../services/api";
import "./Pricing.css";
import Navbar from "../../components/Navbar";

const Pricing = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(
    () => localStorage.getItem("userId") || null
  );
  const [userName] = useState(() => localStorage.getItem("userName") || "User");
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toast, setToast] = useState(null);

  // Check for toast message from navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toastMessage = params.get("toast");
    if (toastMessage) {
      setToast({
        type: "warning",
        message: decodeURIComponent(toastMessage),
      });
      // Clear the URL parameter
      window.history.replaceState({}, "", "/pricing");
      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    }
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        localStorage.setItem("userId", session.user.id);
      }
    };

    checkAuth();
  }, [navigate]);

  // Load user status
  const loadUserStatus = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const status = await api.getUserStatus(userId);
      setUserStatus(status);
    } catch (err) {
      console.error("Failed to load user status:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserStatus();
    }
  }, [userId, loadUserStatus]);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle payment
  const handlePayment = async () => {
    setIsProcessingPayment(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Please try again.");
      }

      const orderResponse = await api.createPaymentOrder(userId);

      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "LegalEagle",
        description: "Premium Upgrade - 100 AI Queries",
        order_id: orderResponse.order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: userId,
            });

            if (verifyResponse.status === "success") {
              setToast({
                type: "success",
                message: "🎉 Payment successful! You are now a premium user!",
              });
              await loadUserStatus();
              setTimeout(() => {
                navigate("/chat");
              }, 2000);
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            setToast({
              type: "error",
              message: "Payment verification failed. Please contact support.",
            });
          }
        },
        prefill: {
          name: userName,
        },
        theme: {
          color: "#ff4d00",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to initiate payment. Please try again.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const freeFeatures = [
    { text: "2 Chat Sessions", included: true },
    { text: "2 Document Uploads", included: true },
    { text: "Basic Legal Analysis", included: true },
    { text: "Community Support", included: true },
    { text: "Unlimited AI Queries", included: false },
    { text: "Priority Support", included: false },
    { text: "Advanced Templates", included: false },
  ];

  const premiumFeatures = [
    { text: "Unlimited Chat Sessions", included: true },
    { text: "Unlimited Document Uploads", included: true },
    { text: "Unlimited AI Queries", included: true },
    { text: "Advanced Legal Analysis", included: true },
    { text: "Priority Support", included: true },
    { text: "All Premium Templates", included: true },
    { text: "Export & Download Reports", included: true },
  ];

  return (
    <div className="pricing-page">
      <Navbar />
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="pricing-content">
        <div className="pricing-hero">
          <h1>Choose Your Plan</h1>
          <p>
            Get the most out of LegalEagle with our flexible pricing options
          </p>
        </div>

        {/* Current Usage Banner */}
        {userStatus && !userStatus.is_premium && (
          <div className="usage-banner">
            <div className="usage-banner-content">
              <Zap size={24} />
              <div className="usage-banner-text">
                <strong>Your Current Usage</strong>
                <span>
                  {userStatus.chat_count}/{userStatus.chat_limit} chats •{" "}
                  {userStatus.document_count}/{userStatus.document_limit}{" "}
                  documents
                </span>
              </div>
            </div>
            {(userStatus.chat_count >= userStatus.chat_limit ||
              userStatus.document_count >= userStatus.document_limit) && (
              <div className="usage-warning">
                <span>⚠️ You've reached your free tier limit</span>
              </div>
            )}
          </div>
        )}

        {/* Premium User Banner */}
        {userStatus?.is_premium && (
          <div className="premium-banner">
            <Crown size={24} />
            <div className="premium-banner-text">
              <strong>You're a Premium User!</strong>
              <span>Unlimited queries available</span>
            </div>
            <Link to="/chat" className="premium-cta">
              Continue to Chat
            </Link>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="pricing-cards">
          {/* Free Plan */}
          <div className="pricing-card free">
            <div className="card-header">
              <div className="plan-icon free-icon">
                <Zap size={28} />
              </div>
              <h2>Free</h2>
              <p className="plan-description">
                Perfect for trying out LegalEagle
              </p>
            </div>
            <div className="card-price">
              <span className="price-amount">₹0</span>
              <span className="price-period">forever</span>
            </div>
            <ul className="feature-list">
              {freeFeatures.map((feature, index) => (
                <li
                  key={index}
                  className={feature.included ? "included" : "excluded"}
                >
                  {feature.included ? (
                    <Check size={18} className="feature-icon check" />
                  ) : (
                    <X size={18} className="feature-icon cross" />
                  )}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <button className="plan-button free-button" disabled>
              {userStatus?.is_premium ? "Previous Plan" : "Current Plan"}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="pricing-card premium">
            <div className="popular-badge">
              <Sparkles size={14} />
              <span>Most Popular</span>
            </div>
            <div className="card-header">
              <div className="plan-icon premium-icon">
                <Crown size={28} />
              </div>
              <h2>Premium</h2>
              <p className="plan-description">
                For professionals who need more power
              </p>
            </div>
            <div className="card-price">
              <span className="price-amount">₹499</span>
              <span className="price-period">one-time</span>
            </div>
            <ul className="feature-list">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="included">
                  <Check size={18} className="feature-icon check" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            {userStatus?.is_premium ? (
              <button className="plan-button premium-button" disabled>
                <Crown size={18} />
                <span>Active Plan</span>
              </button>
            ) : (
              <button
                className="plan-button premium-button"
                onClick={handlePayment}
                disabled={isProcessingPayment || isLoading}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Upgrade Now</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Features Comparison */}
        <section className="features-section">
          <h2>What's Included</h2>
          <div className="features-grid">
            <div className="feature-card">
              <MessageSquare size={32} />
              <h3>AI Chat Sessions</h3>
              <p>
                Engage in intelligent conversations about your legal documents
                with our AI assistant.
              </p>
            </div>
            <div className="feature-card">
              <FileText size={32} />
              <h3>Document Analysis</h3>
              <p>
                Upload PDFs and get instant analysis, summaries, and insights
                from your legal documents.
              </p>
            </div>
            <div className="feature-card">
              <Shield size={32} />
              <h3>Secure & Private</h3>
              <p>
                Your documents are encrypted and never shared. We prioritize
                your privacy and security.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Are there any query limits for premium users?</h4>
              <p>
                No! Premium users enjoy unlimited AI queries. Chat as much as
                you need with no restrictions. Your chat history and documents
                remain accessible forever.
              </p>
            </div>
            <div className="faq-item">
              <h4>Is my payment secure?</h4>
              <p>
                Yes! We use Razorpay, India's leading payment gateway, which is
                PCI DSS compliant and uses bank-grade security.
              </p>
            </div>
            <div className="faq-item">
              <h4>Can I get a refund?</h4>
              <p>
                If you're not satisfied within 7 days of purchase and haven't
                used more than 10 queries, we offer a full refund.
              </p>
            </div>
            <div className="faq-item">
              <h4>What types of documents can I upload?</h4>
              <p>
                Currently, we support PDF documents up to 50MB. We're working on
                adding support for more formats.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;

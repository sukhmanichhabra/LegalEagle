import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSearch,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight,
  Scale,
  Building,
  Users,
  Briefcase,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Lock,
} from "lucide-react";
import "./Features.css";

const Features = () => {
  const [activeUseCase, setActiveUseCase] = useState(0);

  const mainFeatures = [
    {
      icon: <FileSearch size={28} />,
      title: "Document Analysis Engine",
      description:
        "Upload contracts, agreements, or any legal document. Our AI extracts key clauses, identifies risks, and provides comprehensive summaries in seconds.",
      link: "/chat",
      visual: "primary",
      visualContent: (
        <div className="visual-demo visual-demo-analysis">
          <div className="demo-card demo-card-main">
            <div className="demo-card-header">
              <FileText size={20} />
              <span>Contract_Agreement.pdf</span>
            </div>
            <div className="demo-card-body">
              <div className="demo-line"></div>
              <div className="demo-line short"></div>
              <div className="demo-line"></div>
              <div className="demo-highlight">
                <AlertTriangle size={14} />
                <span>Risk clause detected</span>
              </div>
              <div className="demo-line"></div>
              <div className="demo-line short"></div>
            </div>
          </div>
          <div className="demo-floating demo-floating-1">
            <CheckCircle size={16} />
            <span>98% Analyzed</span>
          </div>
          <div className="demo-floating demo-floating-2">
            <BarChart3 size={16} />
            <span>12 Key Clauses</span>
          </div>
        </div>
      ),
    },
    {
      icon: <MessageSquare size={28} />,
      title: "Intelligent Q&A",
      description:
        "Ask questions in plain English about your documents. Get accurate, context-aware answers backed by specific citations from your uploaded files.",
      link: "/chat",
      visual: "secondary",
      visualContent: (
        <div className="visual-demo visual-demo-qa">
          <div className="demo-chat">
            <div className="demo-message demo-message-user">
              <span>What are the termination clauses?</span>
            </div>
            <div className="demo-message demo-message-ai">
              <span>
                Based on Section 8.2, the contract can be terminated with 30
                days written notice...
              </span>
              <div className="demo-citation">
                <FileText size={12} />
                <span>Page 12, Section 8.2</span>
              </div>
            </div>
          </div>
          <div className="demo-input-preview">
            <Search size={16} />
            <span>Ask anything about your document...</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Shield size={28} />,
      title: "Compliance Checker",
      description:
        "Automatically verify documents against regulatory requirements. Stay compliant with real-time alerts and detailed compliance reports.",
      link: "/chat",
      visual: "primary",
      visualContent: (
        <div className="visual-demo visual-demo-compliance">
          <div className="demo-compliance-card">
            <div className="demo-compliance-header">
              <Shield size={20} />
              <span>Compliance Report</span>
            </div>
            <div className="demo-compliance-stats">
              <div className="demo-stat-item demo-stat-pass">
                <CheckCircle size={18} />
                <div>
                  <span className="stat-number">24</span>
                  <span className="stat-label">Passed</span>
                </div>
              </div>
              <div className="demo-stat-item demo-stat-warn">
                <AlertTriangle size={18} />
                <div>
                  <span className="stat-number">3</span>
                  <span className="stat-label">Warnings</span>
                </div>
              </div>
              <div className="demo-stat-item demo-stat-secure">
                <Lock size={18} />
                <div>
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Secure</span>
                </div>
              </div>
            </div>
          </div>
          <div className="demo-floating demo-floating-3">
            <span className="compliance-badge">GDPR Ready</span>
          </div>
        </div>
      ),
    },
  ];

  const useCases = [
    {
      icon: <Scale size={24} />,
      title: "Law Firms",
      shortDesc: "Streamline contract review",
      description:
        "Accelerate contract review, due diligence, and legal research. Give your team more time to focus on high-value strategic work.",
    },
    // {
    //   icon: <Building size={24} />,
    //   title: "Enterprises",
    //   shortDesc: "Manage legal risk at scale",
    // },
    {
      icon: <Users size={24} />,
      title: "Legal Teams",
      shortDesc: "Collaborate efficiently",
    },
    {
      icon: <Briefcase size={24} />,
      title: "Consultants",
      shortDesc: "Deliver faster insights",
    },
  ];

  const useCaseDetails = [
    {
      description:
        "Accelerate contract review, due diligence, and legal research. Give your team more time to focus on high-value strategic work with AI-powered document analysis. ",
      projects: ["Baker McKenzie", "Latham & Watkins", "DLA Piper"],
      stat: "90%",
      statDesc: "Faster Review",
    },
    {
      description:
        "Manage thousands of contracts across departments. Identify risks, ensure compliance, and maintain visibility over your entire legal portfolio.",
      projects: ["Microsoft", "Google", "Amazon"],
      stat: "10K+",
      statDesc: "Contracts Managed",
    },
    {
      description:
        "Enable seamless collaboration between legal and business teams. Share insights, track changes, and maintain version control with ease.",
      projects: ["Stripe Legal", "Coinbase", "Shopify"],
      stat: "5x",
      statDesc: "Team Efficiency",
    },
    {
      description:
        "Deliver comprehensive legal analysis to clients faster than ever. Stand out with AI-enhanced insights and detailed reports.",
      projects: ["Deloitte Legal", "PwC", "EY Law"],
      stat: "24hr",
      statDesc: "Turnaround Time",
    },
  ];

  return (
    <>
      <section className="features dotted-bg">
        <div className="container">
          <div className="features-header">
            <h2 className="features-title">
              More Is More.
              <br />
              Go Horizontal.
            </h2>
            <p className="features-subtitle">
              Powerful features that transform how you work with legal documents
            </p>
          </div>

          {mainFeatures.map((feature, index) => (
            <div key={index} className="feature-row">
              <div
                className={`feature-visual feature-visual-${feature.visual}`}
              >
                <div className="feature-visual-content">
                  {feature.visualContent}
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link to={feature.link} className="feature-link">
                  Learn More <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="use-cases dotted-bg">
        <div className="container">
          <div className="use-cases-header">
            <h2 className="use-cases-title">
              Bringing Legal
              <br />
              Intelligence Everywhere
            </h2>
          </div>

          <div className="use-cases-grid">
            <div className="use-case-list">
              {useCases.map((useCase, index) => (
                <div
                  key={index}
                  className={`use-case-item ${
                    activeUseCase === index ? "active" : ""
                  }`}
                  onClick={() => setActiveUseCase(index)}
                >
                  <div className="use-case-icon">{useCase.icon}</div>
                  <h4>{useCase.title}</h4>
                  <p>{useCase.shortDesc}</p>
                </div>
              ))}
            </div>

            <div className="use-case-detail">
              <div className="use-case-detail-content">
                <p>{useCaseDetails[activeUseCase].description}</p>
              </div>
              <div className="use-case-visual">
                <div className="use-case-stat">
                  <span className="stat-big">
                    {useCaseDetails[activeUseCase].stat || "90%"}
                  </span>
                  <span className="stat-desc">
                    {useCaseDetails[activeUseCase].statDesc || "Time Saved"}
                  </span>
                </div>
              </div>
              <div className="use-case-projects">
                <span>Trusted by leading organizations</span>
                <div className="project-logos">
                  {useCaseDetails[activeUseCase].projects.map(
                    (project, idx) => (
                      <span key={idx} className="project-logo">
                        {project}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;

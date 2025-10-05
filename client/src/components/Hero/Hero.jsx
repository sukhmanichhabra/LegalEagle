import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero dotted-bg">
      <div className="container">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span>The Smart</span>
              <span>Legal</span>
              <span>Assistant</span>
            </h1>
            <p className="hero-description">
              LegalEagle is an AI-powered platform that analyzes legal
              documents, answers complex questions, and helps you navigate the
              legal landscape with confidence.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Start Analyzing
                <ArrowRight size={20} />
              </Link>
              <Link to="/docs" className="btn btn-secondary btn-lg">
                <Play size={18} />
                Learn More
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-cards-wrapper">
              <div className="hero-card-gradient"></div>
              <div className="hero-card-info">
                <p>
                  Upload any legal document and get instant AI-powered analysis.
                  From contracts to compliance documents, LegalEagle understands
                  the nuances of legal language.
                </p>
                <div className="hero-info-buttons">
                  <Link to="/chat" className="btn btn-primary">
                    Try Now
                  </Link>
                  <Link to="/docs" className="btn btn-outline">
                    Read Docs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import { Link } from "react-router-dom";
import {
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  MessageCircle,
} from "lucide-react";
import "./Footer.css";

const Footer = () => {
  const socialLinks = [
    {
      icon: <MessageCircle size={22} />,
      url: "https://discord.com",
      label: "Discord",
    },
    {
      icon: <Twitter size={22} />,
      url: "https://twitter.com",
      label: "Twitter",
    },
    { icon: <Github size={22} />, url: "https://github.com", label: "GitHub" },
    {
      icon: <Linkedin size={22} />,
      url: "https://linkedin.com",
      label: "LinkedIn",
    },
    {
      icon: <Youtube size={22} />,
      url: "https://youtube.com",
      label: "YouTube",
    },
    {
      icon: <Instagram size={22} />,
      url: "https://instagram.com",
      label: "Instagram",
    },
  ];

  const footerLinks = [
    { name: "Chat", path: "/chat" },
    { name: "Pricing", path: "/pricing" },
    { name: "Docs", path: "/docs" },
  ];

  return (
    <footer className="footer dotted-bg">
      <div className="container">
        <div className="footer-container">
          <div className="footer-cta">
            <div className="footer-cta-logo">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 4L4 36h32L20 4z" fill="#ff4d00" />
                <path d="M20 12L10 32h20L20 12z" fill="#171717" />
              </svg>
              <span>LegalEagle</span>
            </div>
            <h3>
              The Fastest-Growing
              <br />
              Legal AI Platform
            </h3>
            <Link to="/chat" className="btn btn-primary">
              Try It Now
            </Link>
          </div>

          <div className="footer-main">
            <div className="footer-social">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            <div className="footer-links-container">
              <nav className="footer-links">
                {footerLinks.map((link, index) => (
                  <Link key={index} to={link.path} className="footer-link">
                    {link.name}
                  </Link>
                ))}
              </nav>
              <p className="footer-copyright">
                LegalEagle 2025 © All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

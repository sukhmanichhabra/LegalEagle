import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Github,
  Twitter,
  MessageCircle,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import "./Navbar.css";

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("userToken");
    const name = localStorage.getItem("userName");

    if (token && name) {
      setIsAuthenticated(true);
      setUserName(name);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    setUserName(null);
    navigate("/");
  };

  const navLinks = [
    { name: "Docs", path: "/docs" },
    { name: "Pricing", path: "/pricing" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="navbar-header">
        <Link
          to="/"
          className="navbar-brand"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="navbar-logo">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 4L4 36h32L20 4z" fill="#ff4d00" />
              <path d="M20 12L10 32h20L20 12z" fill="#fff" />
            </svg>
          </div>
          LegalEagle
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle navigation"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="navbar-menu">
        <span className="navbar-divider"></span>

        <ul className="navbar-nav">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`navbar-link ${isActive(link.path) ? "active" : ""}`}
                onClick={() => setIsMobileOpen(false)}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <span className="navbar-divider"></span>

        <div className="navbar-social">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-social-link"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-social-link"
            aria-label="Twitter"
          >
            <Twitter size={18} />
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-social-link"
            aria-label="Discord"
          >
            <MessageCircle size={18} />
          </a>
        </div>

        <span className="navbar-divider"></span>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link
                to="/chat"
                className="navbar-chat-btn"
                onClick={() => setIsMobileOpen(false)}
              >
                <MessageSquare size={18} />
                <span>Chat</span>
              </Link>
              <div className="navbar-user">
                <User size={18} />
                <span>{userName}</span>
              </div>
              <button onClick={handleLogout} className="navbar-logout">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="navbar-cta"
              onClick={() => setIsMobileOpen(false)}
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

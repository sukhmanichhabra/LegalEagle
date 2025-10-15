import { useState } from "react";
import {
  Book,
  Zap,
  Upload,
  MessageSquare,
  Shield,
  Settings,
  Code,
  FileText,
  ChevronRight,
  ExternalLink,
  Search,
  Brain,
  Database,
  Lock,
  Terminal,
  Layers,
  CheckCircle,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import "./Docs.css";

const Docs = () => {
  const [activeSection, setActiveSection] = useState("introduction");
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tableOfContents = [
    { id: "introduction", label: "Introduction", icon: Book },
    { id: "getting-started", label: "Getting Started", icon: Zap },
    { id: "how-it-works", label: "How It Works", icon: Settings },
    { id: "features", label: "Features", icon: Layers },
    { id: "uploading-docs", label: "Uploading Documents", icon: Upload },
    { id: "chat-interface", label: "Chat Interface", icon: MessageSquare },
    { id: "tech-stack", label: "Technology Stack", icon: Code },
    { id: "api-reference", label: "API Reference", icon: Terminal },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "faq", label: "FAQ", icon: FileText },
  ];

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="docs-page">
      {/* Hero Section */}
      <section className="docs-hero">
        <div className="docs-hero-content">
          <div className="docs-badge">
            <Book size={16} />
            Documentation
          </div>
          <h1>LegalEagle Documentation</h1>
          <p className="docs-hero-description">
            Everything you need to understand and use LegalEagle's AI-powered
            legal document analysis platform. From quick start guides to
            advanced API references.
          </p>
          <div className="docs-hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => scrollToSection("getting-started")}
            >
              Get Started
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => scrollToSection("api-reference")}
            >
              API Reference
              <Code size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="docs-container">
        {/* Sidebar Navigation */}
        <aside className="docs-sidebar">
          <nav className="docs-nav">
            <div className="docs-nav-header">
              <Search size={16} />
              <span>Quick Navigation</span>
            </div>
            <ul className="docs-nav-list">
              {tableOfContents.map((item) => (
                <li key={item.id}>
                  <button
                    className={`docs-nav-link ${
                      activeSection === item.id ? "active" : ""
                    }`}
                    onClick={() => scrollToSection(item.id)}
                  >
                    <item.icon size={16} />
                    {item.label}
                    <ChevronRight size={14} className="chevron" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Documentation Content */}
        <main className="docs-content">
          {/* Introduction */}
          <section id="introduction" className="docs-section">
            <div className="section-header">
              <Book className="section-icon" />
              <h2>Introduction</h2>
            </div>
            <p className="section-lead">
              LegalEagle is an advanced AI-powered platform designed to
              revolutionize how legal professionals and individuals interact
              with legal documents. Using cutting-edge natural language
              processing and retrieval-augmented generation (RAG), LegalEagle
              provides instant, accurate insights from your legal documents.
            </p>
            <div className="info-card">
              <div className="info-card-icon">
                <Brain size={24} />
              </div>
              <div className="info-card-content">
                <h4>AI-Powered Analysis</h4>
                <p>
                  Our system uses state-of-the-art language models combined with
                  vector databases to understand and retrieve information from
                  your documents with unprecedented accuracy.
                </p>
              </div>
            </div>
            <div className="highlight-box">
              <h4>What LegalEagle Can Do</h4>
              <ul className="feature-list">
                <li>
                  <CheckCircle size={16} />
                  Analyze contracts, agreements, and legal briefs instantly
                </li>
                <li>
                  <CheckCircle size={16} />
                  Answer specific questions about document contents
                </li>
                <li>
                  <CheckCircle size={16} />
                  Extract key clauses, dates, and obligations
                </li>
                <li>
                  <CheckCircle size={16} />
                  Summarize lengthy legal documents
                </li>
                <li>
                  <CheckCircle size={16} />
                  Compare multiple documents for discrepancies
                </li>
              </ul>
            </div>
          </section>

          {/* Getting Started */}
          <section id="getting-started" className="docs-section">
            <div className="section-header">
              <Zap className="section-icon" />
              <h2>Getting Started</h2>
            </div>
            <p className="section-lead">
              Get up and running with LegalEagle in just a few minutes. Follow
              these simple steps to start analyzing your legal documents.
            </p>

            <div className="steps-container">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Create an Account</h4>
                  <p>
                    Sign up for a free account using your email or continue with
                    Google/GitHub authentication. No credit card required.
                  </p>
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Upload Your Documents</h4>
                  <p>
                    Upload PDF documents directly to your secure workspace.
                    Supported formats include PDF, DOC, DOCX, and TXT files.
                  </p>
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Start Chatting</h4>
                  <p>
                    Ask questions about your documents in natural language. Get
                    instant, accurate responses powered by AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span>Quick Start Example</span>
                <button
                  className="copy-btn"
                  onClick={() =>
                    copyToClipboard(
                      "What are the key obligations in this contract?",
                      "quick-start"
                    )
                  }
                >
                  {copiedCode === "quick-start" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <pre>
                <code>
                  {`// Example query after uploading a contract
User: "What are the key obligations in this contract?"

LegalEagle: "Based on the uploaded contract, the key obligations include:
1. Payment terms: Net 30 days from invoice date
2. Delivery: Within 14 business days of order
3. Confidentiality: 2-year non-disclosure period
4. Liability cap: Limited to contract value..."`}
                </code>
              </pre>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="docs-section">
            <div className="section-header">
              <Settings className="section-icon" />
              <h2>How It Works</h2>
            </div>
            <p className="section-lead">
              LegalEagle employs a sophisticated RAG (Retrieval-Augmented
              Generation) pipeline to provide accurate, context-aware responses
              to your legal queries.
            </p>

            <div className="architecture-diagram">
              <div className="arch-step">
                <div className="arch-icon">
                  <Upload size={24} />
                </div>
                <div className="arch-label">Document Upload</div>
                <div className="arch-desc">
                  PDF/DOC files are securely uploaded
                </div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step">
                <div className="arch-icon">
                  <FileText size={24} />
                </div>
                <div className="arch-label">Text Extraction</div>
                <div className="arch-desc">Content parsed & chunked</div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step">
                <div className="arch-icon">
                  <Database size={24} />
                </div>
                <div className="arch-label">Vector Storage</div>
                <div className="arch-desc">Embeddings stored in ChromaDB</div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step">
                <div className="arch-icon">
                  <Brain size={24} />
                </div>
                <div className="arch-label">AI Processing</div>
                <div className="arch-desc">LLM generates responses</div>
              </div>
            </div>

            <div className="process-details">
              <div className="process-card">
                <h4>
                  <FileText size={18} /> Document Processing
                </h4>
                <p>
                  When you upload a document, our system extracts the text using
                  advanced OCR and parsing techniques. The content is then split
                  into meaningful chunks that preserve context and semantic
                  meaning.
                </p>
              </div>
              <div className="process-card">
                <h4>
                  <Database size={18} /> Vector Embeddings
                </h4>
                <p>
                  Each chunk is converted into a high-dimensional vector using
                  Google's Gemini embedding model. These embeddings capture the
                  semantic meaning of the text and are stored in ChromaDB for
                  efficient retrieval.
                </p>
              </div>
              <div className="process-card">
                <h4>
                  <Brain size={18} /> Intelligent Retrieval
                </h4>
                <p>
                  When you ask a question, the system finds the most relevant
                  document chunks using semantic similarity search. This context
                  is then passed to the LLM along with your query.
                </p>
              </div>
              <div className="process-card">
                <h4>
                  <MessageSquare size={18} /> Response Generation
                </h4>
                <p>
                  The Gemini LLM generates accurate, contextual responses based
                  on the retrieved information. Responses include citations and
                  references to specific document sections.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="docs-section">
            <div className="section-header">
              <Layers className="section-icon" />
              <h2>Features</h2>
            </div>
            <p className="section-lead">
              Discover the powerful capabilities that make LegalEagle the go-to
              platform for legal document analysis.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon primary">
                  <Brain size={24} />
                </div>
                <h4>AI-Powered Analysis</h4>
                <p>
                  Advanced natural language understanding for complex legal
                  terminology and concepts.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon secondary">
                  <MessageSquare size={24} />
                </div>
                <h4>Natural Conversations</h4>
                <p>
                  Chat naturally with your documents. Ask follow-up questions
                  and get contextual responses.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon success">
                  <Zap size={24} />
                </div>
                <h4>Instant Responses</h4>
                <p>
                  Get answers in seconds, not hours. Our optimized pipeline
                  delivers lightning-fast results.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon warning">
                  <Shield size={24} />
                </div>
                <h4>Enterprise Security</h4>
                <p>
                  Bank-level encryption and security measures protect your
                  sensitive legal documents.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon primary">
                  <Upload size={24} />
                </div>
                <h4>Multi-Format Support</h4>
                <p>
                  Upload PDFs, Word documents, text files, and more. We handle
                  the conversion automatically.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon secondary">
                  <Database size={24} />
                </div>
                <h4>Document Library</h4>
                <p>
                  Organize and manage all your documents in one secure,
                  searchable workspace.
                </p>
              </div>
            </div>
          </section>

          {/* Uploading Documents */}
          <section id="uploading-docs" className="docs-section">
            <div className="section-header">
              <Upload className="section-icon" />
              <h2>Uploading Documents</h2>
            </div>
            <p className="section-lead">
              Learn how to upload and manage your legal documents effectively.
            </p>

            <div className="info-card">
              <div className="info-card-icon">
                <FileText size={24} />
              </div>
              <div className="info-card-content">
                <h4>Supported File Types</h4>
                <p>
                  LegalEagle currently supports PDF documents with a maximum
                  file size of 10MB. Support for DOC, DOCX, and TXT files is
                  coming soon.
                </p>
              </div>
            </div>

            <h3>Upload Methods</h3>
            <div className="method-cards">
              <div className="method-card">
                <h4>
                  <Upload size={18} /> Drag & Drop
                </h4>
                <p>
                  Simply drag your PDF files directly into the chat interface.
                  Multiple files can be uploaded at once.
                </p>
              </div>
              <div className="method-card">
                <h4>
                  <FileText size={18} /> File Browser
                </h4>
                <p>
                  Click the upload button to open your system's file browser and
                  select documents.
                </p>
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span>API Upload Example</span>
                <button
                  className="copy-btn"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST "https://api.legaleagle.com/upload" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@contract.pdf" \\
  -F "chat_id=your_chat_id"`,
                      "upload-api"
                    )
                  }
                >
                  {copiedCode === "upload-api" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <pre>
                <code>
                  {`curl -X POST "https://api.legaleagle.com/upload" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@contract.pdf" \\
  -F "chat_id=your_chat_id"`}
                </code>
              </pre>
            </div>
          </section>

          {/* Chat Interface */}
          <section id="chat-interface" className="docs-section">
            <div className="section-header">
              <MessageSquare className="section-icon" />
              <h2>Chat Interface</h2>
            </div>
            <p className="section-lead">
              Master the chat interface to get the most out of your document
              analysis sessions.
            </p>

            <h3>Effective Prompting</h3>
            <p>
              Getting the best results from LegalEagle depends on how you phrase
              your questions. Here are some tips:
            </p>

            <div className="tips-grid">
              <div className="tip-card good">
                <div className="tip-header">
                  <CheckCircle size={16} />
                  Good Practice
                </div>
                <p>
                  "What are the termination clauses in this agreement, and what
                  are the notice periods required?"
                </p>
              </div>
              <div className="tip-card bad">
                <div className="tip-header">
                  <ExternalLink size={16} />
                  Can Be Improved
                </div>
                <p>"Tell me about termination"</p>
              </div>
            </div>

            <h3>Chat Commands</h3>
            <div className="commands-table">
              <div className="command-row header">
                <span>Command</span>
                <span>Description</span>
              </div>
              <div className="command-row">
                <code className="code">/summarize</code>
                <span>Generate a summary of the current document</span>
              </div>
              <div className="command-row">
                <code className="code">/extract [type]</code>
                <span>Extract specific elements (dates, parties, amounts)</span>
              </div>
              <div className="command-row">
                <code className="code">/compare</code>
                <span>Compare two uploaded documents</span>
              </div>
              <div className="command-row">
                <code className="code">/export</code>
                <span>Export the conversation as PDF or Markdown</span>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section id="tech-stack" className="docs-section">
            <div className="section-header">
              <Code className="section-icon" />
              <h2>Technology Stack</h2>
            </div>
            <p className="section-lead">
              LegalEagle is built on modern, robust technologies to ensure
              performance, scalability, and reliability.
            </p>

            <div className="tech-grid">
              <div className="tech-category">
                <h4>Frontend</h4>
                <ul>
                  <li>
                    <span className="tech-name">React 18</span>
                    <span className="tech-desc">UI Framework</span>
                  </li>
                  <li>
                    <span className="tech-name">Vite</span>
                    <span className="tech-desc">Build Tool</span>
                  </li>
                  <li>
                    <span className="tech-name">React Router</span>
                    <span className="tech-desc">Navigation</span>
                  </li>
                  <li>
                    <span className="tech-name">Lucide Icons</span>
                    <span className="tech-desc">Icon Library</span>
                  </li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>Backend</h4>
                <ul>
                  <li>
                    <span className="tech-name">FastAPI</span>
                    <span className="tech-desc">API Framework</span>
                  </li>
                  <li>
                    <span className="tech-name">Python 3.11+</span>
                    <span className="tech-desc">Runtime</span>
                  </li>
                  <li>
                    <span className="tech-name">Supabase</span>
                    <span className="tech-desc">Database & Auth</span>
                  </li>
                  <li>
                    <span className="tech-name">Pydantic</span>
                    <span className="tech-desc">Data Validation</span>
                  </li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>AI & ML</h4>
                <ul>
                  <li>
                    <span className="tech-name">Google Gemini</span>
                    <span className="tech-desc">LLM Provider</span>
                  </li>
                  <li>
                    <span className="tech-name">ChromaDB</span>
                    <span className="tech-desc">Vector Database</span>
                  </li>
                  <li>
                    <span className="tech-name">LangChain</span>
                    <span className="tech-desc">LLM Framework</span>
                  </li>
                  <li>
                    <span className="tech-name">PyPDF2</span>
                    <span className="tech-desc">PDF Processing</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section id="api-reference" className="docs-section">
            <div className="section-header">
              <Terminal className="section-icon" />
              <h2>API Reference</h2>
            </div>
            <p className="section-lead">
              Integrate LegalEagle into your applications using our RESTful API.
            </p>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="method post">POST</span>
                <code>/chats</code>
              </div>
              <p>Create a new chat session</p>
              <div className="code-block">
                <div className="code-header">
                  <span>Request Body</span>
                  <button
                    className="copy-btn"
                    onClick={() =>
                      copyToClipboard(
                        `{
  "user_id": "uuid",
  "title": "Contract Review Session"
}`,
                        "create-chat"
                      )
                    }
                  >
                    {copiedCode === "create-chat" ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <pre>
                  <code>
                    {`{
  "user_id": "uuid",
  "title": "Contract Review Session"
}`}
                  </code>
                </pre>
              </div>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="method post">POST</span>
                <code>/query</code>
              </div>
              <p>Query documents in a chat session</p>
              <div className="code-block">
                <div className="code-header">
                  <span>Request Body</span>
                  <button
                    className="copy-btn"
                    onClick={() =>
                      copyToClipboard(
                        `{
  "chat_id": "uuid",
  "query": "What are the payment terms?",
  "prompt_template": "legal_analysis"
}`,
                        "query-api"
                      )
                    }
                  >
                    {copiedCode === "query-api" ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <pre>
                  <code>
                    {`{
  "chat_id": "uuid",
  "query": "What are the payment terms?",
  "prompt_template": "legal_analysis"
}`}
                  </code>
                </pre>
              </div>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/chats/{"{chat_id}"}/history</code>
              </div>
              <p>Retrieve chat history with all messages</p>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="method post">POST</span>
                <code>/upload</code>
              </div>
              <p>Upload a document to a chat session</p>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="docs-section">
            <div className="section-header">
              <Shield className="section-icon" />
              <h2>Security & Privacy</h2>
            </div>
            <p className="section-lead">
              Your legal documents contain sensitive information. Here's how we
              keep them secure.
            </p>

            <div className="security-grid">
              <div className="security-card">
                <Lock size={24} />
                <h4>End-to-End Encryption</h4>
                <p>
                  All documents are encrypted in transit using TLS 1.3 and at
                  rest using AES-256 encryption.
                </p>
              </div>
              <div className="security-card">
                <Shield size={24} />
                <h4>SOC 2 Compliant</h4>
                <p>
                  Our infrastructure meets SOC 2 Type II compliance standards
                  for security and privacy.
                </p>
              </div>
              <div className="security-card">
                <Database size={24} />
                <h4>Data Isolation</h4>
                <p>
                  Each user's documents are stored in isolated environments with
                  strict access controls.
                </p>
              </div>
              <div className="security-card">
                <FileText size={24} />
                <h4>GDPR Compliant</h4>
                <p>
                  Full compliance with GDPR, including data portability and
                  right to deletion.
                </p>
              </div>
            </div>

            <div className="highlight-box warning">
              <h4>Data Retention Policy</h4>
              <p>
                Documents are automatically deleted 30 days after your last
                interaction. You can manually delete documents at any time
                through the dashboard. Chat history is retained for 90 days
                unless you request earlier deletion.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="docs-section">
            <div className="section-header">
              <FileText className="section-icon" />
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="faq-list">
              <div className="faq-item">
                <h4>What types of legal documents can I analyze?</h4>
                <p>
                  LegalEagle can analyze virtually any legal document including
                  contracts, agreements, NDAs, terms of service, privacy
                  policies, legal briefs, court filings, and more. Our AI is
                  trained to understand complex legal terminology and structure.
                </p>
              </div>
              <div className="faq-item">
                <h4>How accurate are the AI responses?</h4>
                <p>
                  Our AI achieves over 95% accuracy in document analysis tasks.
                  However, we always recommend having a qualified legal
                  professional review any critical findings. LegalEagle is
                  designed to assist, not replace, legal expertise.
                </p>
              </div>
              <div className="faq-item">
                <h4>Can I use LegalEagle for court submissions?</h4>
                <p>
                  LegalEagle is a research and analysis tool. While it can help
                  you understand documents and prepare for legal proceedings,
                  all court submissions should be reviewed by a licensed
                  attorney in your jurisdiction.
                </p>
              </div>
              <div className="faq-item">
                <h4>Is my data used to train AI models?</h4>
                <p>
                  No. Your documents are never used to train our AI models. Your
                  data remains private and is only used to generate responses
                  during your active sessions.
                </p>
              </div>
              <div className="faq-item">
                <h4>What happens if I exceed my document limit?</h4>
                <p>
                  If you reach your plan's document limit, you can either
                  upgrade to a higher tier or delete older documents to make
                  room for new uploads. We'll notify you when you're approaching
                  your limit.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="docs-cta">
            <div className="cta-content">
              <h3>Ready to Get Started?</h3>
              <p>
                Join thousands of legal professionals using LegalEagle to
                streamline their document analysis workflow.
              </p>
              <div className="cta-buttons">
                <a href="/signup" className="btn btn-primary">
                  Start Free Trial
                  <ArrowRight size={18} />
                </a>
                <a href="/chat" className="btn btn-secondary">
                  Try Demo
                  <MessageSquare size={18} />
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Docs;

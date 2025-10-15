import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Send,
  Paperclip,
  Pin,
  Trash2,
  MoreVertical,
  FileText,
  X,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Home,
  LogOut,
  User,
  Edit2,
  RefreshCw,
  Crown,
  Wrench,
  ChevronDown,
  Scale,
  FileSearch,
  BookOpen,
  Shield,
  Gavel,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import * as api from "../../services/api";
import "./Chat.css";

const Chat = () => {
  const navigate = useNavigate();

  // User state
  const [userId, setUserId] = useState(
    () => localStorage.getItem("userId") || null
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || "User"
  );

  // Premium/Payment state
  const [userStatus, setUserStatus] = useState(null);

  // Chat state
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatData, setActiveChatData] = useState(null);
  const [messages, setMessages] = useState([]);

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showChatMenu, setShowChatMenu] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedTool, setSelectedTool] = useState("general");
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  // Available tools
  const tools = [
    {
      id: "general",
      name: "General Q&A",
      icon: MessageSquare,
      description: "Ask any question about your document",
    },
    {
      id: "summarize",
      name: "Summarize",
      icon: FileSearch,
      description: "Get a concise summary of key points",
    },
    {
      id: "clauses",
      name: "Clause Analysis",
      icon: BookOpen,
      description: "Identify and explain important clauses",
    },
    {
      id: "risks",
      name: "Risk Assessment",
      icon: Shield,
      description: "Identify potential risks and concerns",
    },
    {
      id: "obligations",
      name: "Obligations",
      icon: Gavel,
      description: "List parties' obligations and duties",
    },
    {
      id: "comparison",
      name: "Legal Comparison",
      icon: Scale,
      description: "Compare against standard practices",
    },
  ];

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Document state
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  // Error state
  const [error, setError] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const toolsMenuRef = useRef(null);

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target)
      ) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==================== Authentication ====================

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // Get user ID from Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        localStorage.setItem("userId", session.user.id);
      } else if (!userId) {
        // Fallback: generate a user ID if not available
        const generatedId = `user_${Date.now()}`;
        setUserId(generatedId);
        localStorage.setItem("userId", generatedId);
      }
    };

    checkAuth();
  }, [navigate, userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    navigate("/");
  };

  // ==================== Load Chats ====================

  const loadUserStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const status = await api.getUserStatus(userId);
      setUserStatus(status);
    } catch (err) {
      console.error("Failed to load user status:", err);
    }
  }, [userId]);

  const loadChats = useCallback(async () => {
    if (!userId) return;

    setIsLoadingChats(true);
    setError(null);

    try {
      const response = await api.getUserChats(userId);
      setChats(response.chats || []);

      // Select first chat if none is active
      if (!activeChat && response.chats?.length > 0) {
        selectChat(response.chats[0].id);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
      setError("Failed to load chats. Please try again.");
    } finally {
      setIsLoadingChats(false);
    }
  }, [userId, activeChat]);

  useEffect(() => {
    if (userId) {
      loadChats();
      loadUserStatus();
    }
  }, [userId, loadChats, loadUserStatus]);

  // ==================== Auto-scroll Messages ====================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==================== Chat Operations ====================

  const redirectToPricing = (message) => {
    const encodedMessage = encodeURIComponent(message);
    navigate(`/pricing?toast=${encodedMessage}`);
  };

  const createNewChat = async () => {
    if (!userId) return;

    // Check if user can create chat
    if (userStatus && !userStatus.can_create_chat) {
      redirectToPricing(
        "You've reached your free chat limit. Upgrade to Premium for unlimited chats!"
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.createChat(userId, "New Chat");
      const newChat = response;

      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat.id);
      setActiveChatData(newChat);
      setMessages([]);
      setUploadedDocuments([]);
      setShowChatMenu(null);

      // Refresh user status
      await loadUserStatus();
    } catch (err) {
      console.error("Failed to create chat:", err);
      if (err.message?.includes("403") || err.message?.includes("limit")) {
        redirectToPricing(
          "You've reached your free chat limit. Upgrade to Premium for unlimited chats!"
        );
      } else {
        setError("Failed to create new chat. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectChat = async (chatId) => {
    if (chatId === activeChat) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load chat history from backend
      const response = await api.getChatHistory(chatId);

      setActiveChat(chatId);
      setActiveChatData(response.chat);
      setMessages(response.messages || []);

      // Load documents for this chat
      const docsResponse = await api.getChatDocuments(chatId);
      setUploadedDocuments(docsResponse.documents || []);
    } catch (err) {
      console.error("Failed to load chat:", err);
      setError("Failed to load chat history.");
    } finally {
      setIsLoading(false);
    }

    setShowChatMenu(null);
  };

  const deleteChatHandler = async (chatId, e) => {
    e.stopPropagation();

    try {
      await api.deleteChat(chatId);

      const updatedChats = chats.filter((c) => c.id !== chatId);
      setChats(updatedChats);

      if (activeChat === chatId) {
        if (updatedChats.length > 0) {
          selectChat(updatedChats[0].id);
        } else {
          setActiveChat(null);
          setActiveChatData(null);
          setMessages([]);
          setUploadedDocuments([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      setError("Failed to delete chat.");
    }

    setShowChatMenu(null);
  };

  const togglePinChat = (chatId, e) => {
    e.stopPropagation();
    // Note: Pin functionality is client-side only for now
    // You could extend the backend to support pinning
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
      )
    );
    setShowChatMenu(null);
  };

  const startRenameChat = (chatId, currentTitle, e) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setShowChatMenu(null);
  };

  const saveRename = async (chatId) => {
    if (editingTitle.trim()) {
      try {
        await api.updateChat(chatId, { title: editingTitle.trim() });

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat
          )
        );

        if (activeChat === chatId) {
          setActiveChatData((prev) => ({
            ...prev,
            title: editingTitle.trim(),
          }));
        }
      } catch (err) {
        console.error("Failed to rename chat:", err);
        setError("Failed to rename chat.");
      }
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const cancelRename = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleRenameKeyPress = (e, chatId) => {
    if (e.key === "Enter") {
      saveRename(chatId);
    } else if (e.key === "Escape") {
      cancelRename();
    }
  };

  // ==================== File Upload ====================

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    // Check if user can upload
    if (userStatus && !userStatus.can_upload_document) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      redirectToPricing(
        "You've reached your free document upload limit. Upgrade to Premium for unlimited uploads!"
      );
      return;
    }

    // Check if it's a PDF
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed. Please upload a PDF document.");
      return;
    }

    // Check file size (max 50MB to match backend)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await api.uploadDocument(activeChat, file);

      // Add to uploaded documents list
      const newDoc = {
        id: response.document_id,
        filename: response.filename,
        num_chunks: response.chunks,
        uploaded_at: new Date().toISOString(),
      };

      setUploadedDocuments((prev) => [...prev, newDoc]);

      // Update chat in list to show it has a document
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat ? { ...chat, hasDocument: true } : chat
        )
      );

      // Refresh user status
      await loadUserStatus();
    } catch (err) {
      console.error("Upload failed:", err);
      if (err.message?.includes("403") || err.message?.includes("limit")) {
        redirectToPricing(
          "You've reached your free document upload limit. Upgrade to Premium for unlimited uploads!"
        );
      } else {
        setError(err.message || "Failed to upload document. Please try again.");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeDocument = async (docId) => {
    // Note: The backend doesn't have a single document delete endpoint
    // Documents are deleted when the chat is deleted
    // For now, we'll just remove it from the UI
    setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  // ==================== Send Message ====================

  // Get tool-specific prompt prefix
  const getToolPrompt = (toolId, query) => {
    const toolPrompts = {
      general: query,
      summarize: `Please provide a comprehensive summary of the document, highlighting the key points and main takeaways. Focus on: ${
        query || "the entire document"
      }`,
      clauses: `Analyze and explain the important clauses in this document. Identify any unusual or noteworthy provisions. ${
        query ? `Specifically focus on: ${query}` : ""
      }`,
      risks: `Conduct a risk assessment of this document. Identify potential legal risks, liabilities, and concerns that should be addressed. ${
        query ? `Pay special attention to: ${query}` : ""
      }`,
      obligations: `List and explain all obligations, duties, and responsibilities of each party mentioned in this document. ${
        query ? `Focus on: ${query}` : ""
      }`,
      comparison: `Compare this document against standard legal practices and templates. Highlight any deviations or unusual terms. ${
        query ? `Specifically regarding: ${query}` : ""
      }`,
    };
    return toolPrompts[toolId] || query;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat || isSending) return;

    // Check if user can query
    if (userStatus && !userStatus.can_query) {
      redirectToPricing(
        "You've used all your queries. Upgrade to Premium for 100 more AI queries!"
      );
      return;
    }

    const userQuery = inputMessage.trim();
    const query = getToolPrompt(selectedTool, userQuery);
    setInputMessage("");
    setIsSending(true);
    setError(null);

    // Get selected tool info for display
    const selectedToolInfo = tools.find((t) => t.id === selectedTool);

    // Optimistically add user message to UI
    const tempUserMessage = {
      id: `temp_${Date.now()}`,
      chat_id: activeChat,
      role: "user",
      content: userQuery,
      tool: selectedTool !== "general" ? selectedToolInfo?.name : null,
      sources: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await api.askQuestion(activeChat, query);

      // Replace temp message with real one and add assistant response
      setMessages((prev) => {
        // Remove the temp message
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);

        // Add the real user message and assistant response
        return [
          ...filtered,
          {
            id: `user_${response.message_id}`,
            chat_id: activeChat,
            role: "user",
            content: userQuery,
            tool: selectedTool !== "general" ? selectedToolInfo?.name : null,
            sources: [],
            created_at: new Date().toISOString(),
          },
          {
            id: response.message_id,
            chat_id: activeChat,
            role: "assistant",
            content: response.answer,
            sources: response.sources || [],
            created_at: new Date().toISOString(),
          },
        ];
      });

      // Update chat title if it's the first message
      const currentChat = chats.find((c) => c.id === activeChat);
      if (currentChat?.title === "New Chat") {
        const newTitle =
          userQuery.slice(0, 30) + (userQuery.length > 30 ? "..." : "");
        try {
          await api.updateChat(activeChat, { title: newTitle });
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat ? { ...chat, title: newTitle } : chat
            )
          );
          setActiveChatData((prev) => ({ ...prev, title: newTitle }));
        } catch (err) {
          console.error("Failed to update chat title:", err);
        }
      }

      // Refresh user status after query
      await loadUserStatus();
    } catch (err) {
      console.error("Failed to send message:", err);
      if (err.message?.includes("403") || err.message?.includes("limit")) {
        redirectToPricing(
          "You've used all your queries. Upgrade to Premium for 100 more AI queries!"
        );
      } else {
        setError(err.message || "Failed to get response. Please try again.");
      }

      // Remove the temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ==================== Utility Functions ====================

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Clean markdown formatting from text
  const cleanMarkdown = (text) => {
    if (!text) return "";
    // Remove ** (bold markdown)
    return text.replace(/\*\*/g, "");
  };

  // ==================== Filter and Sort Chats ====================

  const filteredChats = chats
    .filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(b.updated_at || b.created_at) -
        new Date(a.updated_at || a.created_at)
      );
    });

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const regularChats = filteredChats.filter((c) => !c.isPinned);

  // ==================== Render ====================

  return (
    <div className="chat-page">
      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="chat-navbar">
        <div className="chat-navbar-left">
          <Link to="/" className="chat-navbar-brand">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="chat-navbar-logo"
            >
              <path d="M20 4L4 36h32L20 4z" fill="#ff4d00" />
              <path d="M20 12L10 32h20L20 12z" fill="#fff" />
            </svg>
            <span>LegalEagle</span>
          </Link>
        </div>
        <div className="chat-navbar-right">
          {/* User Status Badge */}
          {userStatus && (
            <div
              className={`user-status-badge ${
                userStatus.is_premium ? "premium" : "free"
              }`}
            >
              {userStatus.is_premium ? (
                <>
                  <Crown size={16} />
                  <span>Unlimited queries</span>
                </>
              ) : (
                <>
                  <span>
                    {userStatus.chat_count}/{userStatus.chat_limit} chats
                  </span>
                  <Link to="/pricing" className="upgrade-btn-small">
                    Upgrade
                  </Link>
                </>
              )}
            </div>
          )}
          <Link to="/" className="chat-navbar-link">
            <Home size={18} />
            <span>Home</span>
          </Link>
          <div className="chat-navbar-user">
            <User size={18} />
            <span>{userName}</span>
          </div>
          <button className="chat-navbar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="chat-content">
        {/* Sidebar */}
        <aside className={`chat-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Chats</h2>
            <button
              className="new-chat-btn"
              onClick={createNewChat}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} className="spin" />
              ) : (
                <Plus size={20} />
              )}
              <span>New Chat</span>
            </button>
          </div>

          <div className="sidebar-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="chat-list">
            {isLoadingChats ? (
              <div className="loading-chats">
                <Loader2 size={24} className="spin" />
                <span>Loading chats...</span>
              </div>
            ) : (
              <>
                {pinnedChats.length > 0 && (
                  <div className="chat-group">
                    <div className="chat-group-header">
                      <Pin size={14} />
                      <span>Pinned</span>
                    </div>
                    {pinnedChats.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={activeChat === chat.id}
                        onClick={() => selectChat(chat.id)}
                        onDelete={(e) => deleteChatHandler(chat.id, e)}
                        onPin={(e) => togglePinChat(chat.id, e)}
                        onRename={(e) =>
                          startRenameChat(chat.id, chat.title, e)
                        }
                        showMenu={showChatMenu === chat.id}
                        onMenuToggle={(e) => {
                          e.stopPropagation();
                          setShowChatMenu(
                            showChatMenu === chat.id ? null : chat.id
                          );
                        }}
                        formatDate={formatDate}
                        isEditing={editingChatId === chat.id}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSaveRename={() => saveRename(chat.id)}
                        onCancelRename={cancelRename}
                        onRenameKeyPress={(e) =>
                          handleRenameKeyPress(e, chat.id)
                        }
                      />
                    ))}
                  </div>
                )}

                {regularChats.length > 0 && (
                  <div className="chat-group">
                    {pinnedChats.length > 0 && (
                      <div className="chat-group-header">
                        <MessageSquare size={14} />
                        <span>Recent</span>
                      </div>
                    )}
                    {regularChats.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={activeChat === chat.id}
                        onClick={() => selectChat(chat.id)}
                        onDelete={(e) => deleteChatHandler(chat.id, e)}
                        onPin={(e) => togglePinChat(chat.id, e)}
                        onRename={(e) =>
                          startRenameChat(chat.id, chat.title, e)
                        }
                        showMenu={showChatMenu === chat.id}
                        onMenuToggle={(e) => {
                          e.stopPropagation();
                          setShowChatMenu(
                            showChatMenu === chat.id ? null : chat.id
                          );
                        }}
                        formatDate={formatDate}
                        isEditing={editingChatId === chat.id}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSaveRename={() => saveRename(chat.id)}
                        onCancelRename={cancelRename}
                        onRenameKeyPress={(e) =>
                          handleRenameKeyPress(e, chat.id)
                        }
                      />
                    ))}
                  </div>
                )}

                {filteredChats.length === 0 && !isLoadingChats && (
                  <div className="empty-chats">
                    <MessageSquare size={48} strokeWidth={1} />
                    <p>No chats yet</p>
                    <span>Start a new conversation</span>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-main">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <header className="chat-header">
                <div className="chat-header-info">
                  <h3>{activeChatData?.title || "Chat"}</h3>
                  {uploadedDocuments.length > 0 && (
                    <div className="chat-header-document">
                      <FileText size={14} />
                      <span>{uploadedDocuments.length} document(s)</span>
                    </div>
                  )}
                </div>
                <div className="chat-header-actions">
                  {uploadedDocuments.length === 0 && (
                    <button
                      className="header-action-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Document"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 size={20} className="spin" />
                      ) : (
                        <Paperclip size={20} />
                      )}
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    style={{ display: "none" }}
                  />
                </div>
              </header>

              {/* Document Banner */}
              {uploadedDocuments.length > 0 && (
                <div className="documents-banner">
                  {uploadedDocuments.map((doc) => (
                    <div key={doc.id} className="document-banner">
                      <div className="document-info">
                        <FileText size={16} />
                        <span className="document-name">{doc.filename}</span>
                      </div>
                      <button
                        className="remove-document"
                        onClick={() => removeDocument(doc.id)}
                        title="Remove from view"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages Area */}
              <div className="chat-messages">
                {isLoading && messages.length === 0 ? (
                  <div className="loading-messages">
                    <Loader2 size={32} className="spin" />
                    <span>Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-welcome">
                    <div className="welcome-icon">
                      <MessageSquare size={48} strokeWidth={1.5} />
                    </div>
                    <h3>Start a Conversation</h3>
                    <p>
                      Upload a legal document and ask questions about it.
                      LegalEagle AI will help you understand complex legal
                      matters.
                    </p>
                    {uploadedDocuments.length === 0 && (
                      <button
                        className="upload-prompt-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 size={18} className="spin" />
                        ) : (
                          <Paperclip size={18} />
                        )}
                        Upload a PDF Document
                      </button>
                    )}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${
                        message.role === "user" ? "user" : "assistant"
                      }`}
                    >
                      <div className="message-content">
                        {message.tool && (
                          <span className="message-tool-badge">
                            <Wrench size={12} />
                            {message.tool}
                          </span>
                        )}
                        <p>{cleanMarkdown(message.content)}</p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="message-sources">
                            {/* <span className="sources-label">Sources:</span>
                            {message.sources.map((source, idx) => (
                              <span key={idx} className="source-tag">
                                {source.metadata?.source ||
                                  source.metadata?.filename ||
                                  source.source ||
                                  source.filename ||
                                  `Document ${idx + 1}`}
                                {source.metadata?.page &&
                                  ` (Page ${source.metadata.page})`}
                              </span>
                            ))} */}
                          </div>
                        )}
                        <span className="message-time">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="message assistant">
                    <div className="message-content loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="chat-input-container">
                {isUploading && (
                  <div className="uploading-indicator">
                    <Loader2 size={16} className="spin" />
                    <span>Uploading and processing document...</span>
                  </div>
                )}

                {/* Tools Selector */}
                <div className="tools-selector-container" ref={toolsMenuRef}>
                  <button
                    className={`tools-selector-btn ${
                      showToolsMenu ? "active" : ""
                    }`}
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                  >
                    <Wrench size={16} />
                    <span>
                      {tools.find((t) => t.id === selectedTool)?.name ||
                        "Select Tool"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={showToolsMenu ? "rotate" : ""}
                    />
                  </button>

                  {showToolsMenu && (
                    <div className="tools-dropdown">
                      {tools.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            className={`tool-option ${
                              selectedTool === tool.id ? "selected" : ""
                            }`}
                            onClick={() => {
                              setSelectedTool(tool.id);
                              setShowToolsMenu(false);
                            }}
                          >
                            <IconComponent size={18} />
                            <div className="tool-option-content">
                              <span className="tool-option-name">
                                {tool.name}
                              </span>
                              <span className="tool-option-desc">
                                {tool.description}
                              </span>
                            </div>
                            {selectedTool === tool.id && (
                              <Check size={16} className="tool-check" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="chat-input-wrapper">
                  <textarea
                    placeholder={
                      uploadedDocuments.length === 0
                        ? "Upload a document first to ask questions..."
                        : selectedTool === "general"
                        ? "Type your legal question..."
                        : `Ask about ${tools
                            .find((t) => t.id === selectedTool)
                            ?.name.toLowerCase()}...`
                    }
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    className="chat-input"
                    disabled={isSending}
                  />
                  <button
                    className={`send-btn ${
                      inputMessage.trim() ? "active" : ""
                    }`}
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isSending}
                  >
                    {isSending ? (
                      <Loader2 size={20} className="spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
                <p className="input-hint">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">
                <MessageSquare size={64} strokeWidth={1} />
              </div>
              <h3>Welcome to LegalEagle Chat</h3>
              <p>Select a chat or create a new one to get started</p>
              <button
                className="create-chat-btn"
                onClick={createNewChat}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <Plus size={20} />
                )}
                Create New Chat
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Chat Item Component
const ChatItem = ({
  chat,
  isActive,
  onClick,
  onDelete,
  onPin,
  onRename,
  showMenu,
  onMenuToggle,
  formatDate,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onSaveRename,
  onRenameKeyPress,
}) => {
  return (
    <div
      className={`chat-item ${isActive ? "active" : ""} ${
        chat.isPinned ? "pinned" : ""
      }`}
      onClick={onClick}
    >
      <div className="chat-item-icon">
        {chat.hasDocument ? (
          <FileText size={18} />
        ) : (
          <MessageSquare size={18} />
        )}
      </div>
      <div className="chat-item-content">
        <div className="chat-item-title">
          {chat.isPinned && <Pin size={12} className="pin-indicator" />}
          {isEditing ? (
            <input
              type="text"
              className="chat-title-input"
              value={editingTitle}
              onChange={(e) => onEditingTitleChange(e.target.value)}
              onKeyDown={onRenameKeyPress}
              onBlur={onSaveRename}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{chat.title}</span>
          )}
        </div>
        <div className="chat-item-meta">
          <span>{formatDate(chat.updated_at || chat.created_at)}</span>
        </div>
      </div>
      <div className="chat-item-actions">
        <button className="chat-menu-btn" onClick={onMenuToggle}>
          <MoreVertical size={16} />
        </button>
        {showMenu && (
          <div className="chat-menu">
            <button onClick={onRename}>
              <Edit2 size={14} />
              <span>Rename</span>
            </button>
            <button onClick={onPin}>
              <Pin size={14} />
              <span>{chat.isPinned ? "Unpin" : "Pin"}</span>
            </button>
            <button onClick={onDelete} className="delete-btn">
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

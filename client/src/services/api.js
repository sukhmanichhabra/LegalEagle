// API Service for LegalEagle Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==================== Chat API ====================

/**
 * Create a new chat session
 * @param {string} userId - User ID
 * @param {string} title - Chat title
 * @param {string} promptTemplate - Optional prompt template ID
 */
export async function createChat(
  userId,
  title = "New Chat",
  promptTemplate = "legal_general"
) {
  return apiRequest("/chats", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      title,
      prompt_template: promptTemplate,
    }),
  });
}

/**
 * Get all chats for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of chats
 */
export async function getUserChats(userId, limit = 50) {
  return apiRequest(
    `/chats?user_id=${encodeURIComponent(userId)}&limit=${limit}`
  );
}

/**
 * Get a chat with its full message history
 * @param {string} chatId - Chat ID
 */
export async function getChatHistory(chatId) {
  return apiRequest(`/chats/${chatId}`);
}

/**
 * Update chat metadata (title, prompt template)
 * @param {string} chatId - Chat ID
 * @param {object} updates - Updates object { title?, prompt_template? }
 */
export async function updateChat(chatId, updates) {
  return apiRequest(`/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a chat and all associated data
 * @param {string} chatId - Chat ID
 */
export async function deleteChat(chatId) {
  return apiRequest(`/chats/${chatId}`, {
    method: "DELETE",
  });
}

// ==================== Query/Ask API ====================

/**
 * Ask a question about uploaded documents
 * @param {string} chatId - Chat ID
 * @param {string} query - User's question
 * @param {boolean} useContext - Whether to use chat history for context
 */
export async function askQuestion(chatId, query, useContext = true) {
  return apiRequest("/ask", {
    method: "POST",
    body: JSON.stringify({
      chat_id: chatId,
      query,
      use_context: useContext,
    }),
  });
}

/**
 * Perform similarity search without LLM generation
 * @param {string} chatId - Chat ID
 * @param {string} query - Search query
 * @param {number} topK - Number of results
 */
export async function similaritySearch(chatId, query, topK = 5) {
  return apiRequest(
    `/search?chat_id=${encodeURIComponent(chatId)}&query=${encodeURIComponent(
      query
    )}&top_k=${topK}`
  );
}

// ==================== Document Upload API ====================

/**
 * Upload a PDF document to a chat
 * @param {string} chatId - Chat ID
 * @param {File} file - File to upload
 */
export async function uploadDocument(chatId, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("chat_id", chatId);

  return apiRequest("/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * Upload raw text content to a chat
 * @param {string} chatId - Chat ID
 * @param {string} text - Text content
 * @param {string} sourceName - Source name
 */
export async function uploadText(chatId, text, sourceName = "Pasted Text") {
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("text", text);
  formData.append("source_name", sourceName);

  return apiRequest("/upload/text", {
    method: "POST",
    body: formData,
  });
}

/**
 * Get all documents uploaded to a chat
 * @param {string} chatId - Chat ID
 */
export async function getChatDocuments(chatId) {
  return apiRequest(`/chats/${chatId}/documents`);
}

// ==================== Template API ====================

/**
 * Get all available prompt templates
 */
export async function getPromptTemplates() {
  return apiRequest("/templates");
}

/**
 * Get a specific prompt template
 * @param {string} templateId - Template ID
 */
export async function getPromptTemplate(templateId) {
  return apiRequest(`/templates/${templateId}`);
}

/**
 * Get prompt templates by category
 * @param {string} category - Category name
 */
export async function getTemplatesByCategory(category) {
  return apiRequest(`/templates/category/${encodeURIComponent(category)}`);
}

// ==================== Health Check API ====================

/**
 * Check API health status
 */
export async function healthCheck() {
  return apiRequest("/health");
}

// ==================== User & Payment API ====================

/**
 * Get user status including limits and premium status
 * @param {string} userId - User ID
 */
export async function getUserStatus(userId) {
  return apiRequest(`/user/status?user_id=${encodeURIComponent(userId)}`);
}

/**
 * Create a Razorpay order for premium upgrade
 * @param {string} userId - User ID
 */
export async function createPaymentOrder(userId) {
  return apiRequest("/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

/**
 * Verify Razorpay payment
 * @param {object} paymentData - Payment verification data
 */
export async function verifyPayment(paymentData) {
  return apiRequest("/payment/verify", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
}

/**
 * Get user's payment history
 * @param {string} userId - User ID
 */
export async function getPaymentHistory(userId) {
  return apiRequest(`/payment/history?user_id=${encodeURIComponent(userId)}`);
}

export default {
  createChat,
  getUserChats,
  getChatHistory,
  updateChat,
  deleteChat,
  askQuestion,
  similaritySearch,
  uploadDocument,
  uploadText,
  getChatDocuments,
  getPromptTemplates,
  getPromptTemplate,
  getTemplatesByCategory,
  healthCheck,
  getUserStatus,
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
};

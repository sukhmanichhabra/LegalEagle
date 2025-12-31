# 🦅 LegalEagle

<div align="center">

![LegalEagle Banner](https://img.shields.io/badge/LegalEagle-AI%20Legal%20Assistant-orange?style=for-the-badge&logo=scale)

**AI-Powered Legal Document Analysis & Chat Assistant**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-blue?style=flat-square)](https://www.pinecone.io/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%202.5-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup-server)
  - [Frontend Setup](#frontend-setup-client)
- [Server Deep Dive](#-server-deep-dive)
  - [Configuration](#1-configuration-configpy)
  - [Database Layer](#2-database-layer-databasepy)
  - [RAG Pipeline](#3-rag-pipeline-rag_pipelinepy)
  - [Document Processing](#4-document-processing-utilspy)
  - [Prompt Engineering](#5-prompt-templates-promptspy)
  - [API Models](#6-api-models-modelspy)
  - [Main Application](#7-main-application-mainpy)
- [API Reference](#-api-reference)
- [Payment Integration](#-payment-integration)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🔍 Overview

**LegalEagle** is a full-stack AI-powered legal document analysis platform that allows users to:

- Upload legal documents (PDFs) for intelligent analysis
- Ask natural language questions about their documents
- Get context-aware answers powered by RAG (Retrieval-Augmented Generation)
- Choose from multiple specialized AI personas (Contract Reviewer, Compliance Checker, etc.)
- Manage multiple chat sessions with separate document contexts
- Upgrade to premium for unlimited queries via Razorpay payment integration

The platform uses a modern **RAG architecture** combining:
- **Cohere embeddings** for semantic document understanding
- **Pinecone vector database** for efficient similarity search
- **Google Gemini 2.5 Flash** for intelligent response generation
- **MongoDB** for persistent data storage

---

## ✨ Features

### 🔐 User Management
- **Supabase Authentication** - Secure user sign-up and login
- **Free Tier** - 2 chats, 2 documents per chat
- **Premium Tier** - Unlimited chats, documents, and queries

### 📄 Document Processing
- **PDF Upload** - Upload legal documents up to 50MB
- **Text Paste** - Directly paste text content for analysis
- **Smart Chunking** - Documents split into optimal chunks (1000 chars with 200 overlap)
- **Per-Chat Isolation** - Each chat has its own document namespace

### 🤖 AI Analysis
- **8 Specialized Templates** - Legal Assistant, Contract Reviewer, Compliance Checker, and more
- **Context-Aware Responses** - Remembers conversation history
- **Source Citations** - Shows which pages answers came from
- **Similarity Search** - Find relevant document sections without LLM

### 💳 Payments
- **Razorpay Integration** - Secure payment processing
- **Premium Upgrade** - ₹499 for unlimited queries
- **Payment History** - Track all transactions

---

## 🛠 Tech Stack

### Backend (Server)
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async Python web framework |
| **LangChain** | LLM orchestration and RAG pipeline |
| **Google Gemini 2.5 Flash** | Large Language Model for responses |
| **Cohere embed-english-v3.0** | Text embeddings (1024 dimensions) |
| **Pinecone** | Vector database for semantic search |
| **MongoDB (Motor)** | Async document database for persistence |
| **Razorpay** | Payment gateway for India |
| **PyPDF** | PDF parsing and text extraction |

### Frontend (Client)
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite** | Fast build tool and dev server |
| **React Router** | Client-side routing |
| **Supabase** | Authentication |
| **Lucide React** | Icons |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │   Auth   │  │   Chat   │  │  Upload  │  │     Pricing      ││
│  │  Pages   │  │   Page   │  │  Modal   │  │      Page        ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘│
│       │             │             │                  │          │
│       └─────────────┴──────┬──────┴──────────────────┘          │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  API Service   │                           │
│                    │   (api.js)     │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       SERVER (FastAPI)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      main.py (API Routes)                   ││
│  │  /chats  /ask  /upload  /templates  /payment  /user        ││
│  └────────────────────────────┬────────────────────────────────┘│
│                               │                                  │
│  ┌────────────────────────────▼────────────────────────────────┐│
│  │                                                              ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      ││
│  │  │  database.py │  │ rag_pipeline │  │   utils.py   │      ││
│  │  │   MongoDB    │  │   .py        │  │  PDF Parser  │      ││
│  │  │   Handler    │  │  RAG Logic   │  │  Chunking    │      ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      ││
│  │         │                 │                  │               ││
│  │         │          ┌──────▼───────┐         │               ││
│  │         │          │  prompts.py  │         │               ││
│  │         │          │  8 Templates │         │               ││
│  │         │          └──────────────┘         │               ││
│  │         │                                   │               ││
│  └─────────┼───────────────────────────────────┼───────────────┘│
│            │                                   │                 │
└────────────┼───────────────────────────────────┼─────────────────┘
             │                                   │
    ┌────────▼────────┐                 ┌───────▼────────┐
    │    MongoDB      │                 │    Pinecone    │
    │  Atlas Cloud    │                 │  Vector DB     │
    │                 │                 │                │
    │ • chats         │                 │ • embeddings   │
    │ • messages      │                 │ • namespaces   │
    │ • documents     │                 │   per chat     │
    │ • users         │                 │                │
    │ • payments      │                 │                │
    └─────────────────┘                 └────────────────┘
```

### How RAG Works in LegalEagle

```
User Query: "What are the termination clauses?"
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. EMBEDDING                                                  │
│    Query → Cohere embed-english-v3.0 → 1024-dim vector       │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. RETRIEVAL                                                  │
│    Vector → Pinecone similarity search → Top 5 chunks        │
│    (searched within chat's namespace for isolation)          │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. AUGMENTATION                                               │
│    Prompt Template + Retrieved Chunks + Chat History         │
│    → Combined context for LLM                                │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. GENERATION                                                 │
│    Context → Google Gemini 2.5 Flash → Answer + Sources      │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
Response: "The contract includes the following termination clauses:
          1. Either party may terminate with 30 days notice...
          [Sources: Pages 5, 12]"
```

---

## 📁 Project Structure

```
LegalEagle/
├── 📁 server/                    # Backend (FastAPI)
│   ├── main.py                   # API routes and app initialization
│   ├── config.py                 # Environment configuration
│   ├── database.py               # MongoDB operations
│   ├── rag_pipeline.py           # RAG logic (retrieval + generation)
│   ├── utils.py                  # PDF processing utilities
│   ├── prompts.py                # AI prompt templates
│   ├── models.py                 # Pydantic request/response models
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   └── .env                      # Your environment variables (gitignored)
│
├── 📁 client/                    # Frontend (React + Vite)
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable UI components
│   │   │   ├── Navbar/
│   │   │   ├── Footer/
│   │   │   ├── Hero/
│   │   │   ├── Features/
│   │   │   └── Stats/
│   │   ├── 📁 pages/             # Page components
│   │   │   ├── Home/
│   │   │   ├── Auth/             # Login, Signup
│   │   │   ├── Chat/             # Main chat interface
│   │   │   ├── Pricing/          # Pricing + payment
│   │   │   └── Docs/
│   │   ├── 📁 services/          # API client
│   │   │   └── api.js
│   │   ├── 📁 styles/            # Global styles
│   │   ├── App.jsx               # Root component + routing
│   │   ├── supabaseClient.js     # Auth client
│   │   └── main.jsx              # Entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env                      # Your environment variables
│
├── .gitignore
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

1. **Python 3.10+** installed
2. **Node.js 18+** installed
3. **Accounts and API Keys for:**
   - [Google AI Studio](https://aistudio.google.com/) - For Gemini API key
   - [Pinecone](https://www.pinecone.io/) - For vector database
   - [Cohere](https://cohere.com/) - For embeddings
   - [MongoDB Atlas](https://www.mongodb.com/atlas) - For database
   - [Supabase](https://supabase.com/) - For authentication
   - [Razorpay](https://razorpay.com/) - For payments (optional)

---

### Backend Setup (Server)

#### Step 1: Navigate to server directory

```bash
cd server
```

#### Step 2: Create and activate virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi` + `uvicorn` - Web framework and server
- `langchain` ecosystem - LLM orchestration
- `langchain-google-genai` - Gemini integration
- `langchain-cohere` - Embeddings
- `langchain-pinecone` - Vector store
- `motor` - Async MongoDB driver
- `razorpay` - Payment SDK
- `pypdf` - PDF parsing
- `python-dotenv` - Environment management

#### Step 4: Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
```

**Required variables:**
```env
# Google Gemini API Key (get from https://aistudio.google.com/)
GOOGLE_API_KEY=your_google_api_key

# Pinecone (get from https://app.pinecone.io/)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=https://your-index-xxx.svc.xxx.pinecone.io

# Cohere (get from https://dashboard.cohere.com/)
COHERE_API_KEY=your_cohere_api_key

# MongoDB Atlas (get connection string from Atlas dashboard)
MONGODB_URI=mongodb+srv://user:pass@cluster.xxx.mongodb.net/legaleagle

# Razorpay (get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
```

#### Step 5: Set up Pinecone Index

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create a new index with:
   - **Name:** `legaleagle`
   - **Dimensions:** `1024` (Cohere embed-english-v3.0 dimension)
   - **Metric:** `cosine`
3. Copy the host URL to your `.env`

#### Step 6: Run the server

```bash
# Development mode
uvicorn main:app --reload --port 8000

# Or simply
python main.py
```

The API will be available at `http://localhost:8000`

**Verify it's working:**
```bash
curl http://localhost:8000/health
# {"status":"healthy","database":"connected","vector_store":"connected","llm":"ready"}
```

---

### Frontend Setup (Client)

#### Step 1: Navigate to client directory

```bash
cd client
```

#### Step 2: Install dependencies

```bash
npm install
```

#### Step 3: Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Supabase (get from https://supabase.com/dashboard)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
```

#### Step 4: Set up Supabase Authentication

1. Create a project at [Supabase](https://supabase.com/)
2. Go to **Settings** → **API**
3. Copy the **URL** and **anon/public** key
4. Enable **Email authentication** in Authentication settings

#### Step 5: Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔧 Server Deep Dive

### 1. Configuration (`config.py`)

The configuration module handles all environment variables with validation:

```python
# What it does:
# 1. Loads .env file using python-dotenv
# 2. Validates all required variables exist
# 3. Exports typed configuration constants

# Key features:
validate_env()  # Exits with helpful error if vars missing

# Configuration groups:
# - API Keys (Google, Pinecone, Cohere, MongoDB, Razorpay)
# - Pricing (FREE_CHAT_LIMIT, PREMIUM_PRICE_INR)
# - Model settings (LLM_MODEL, EMBEDDING_MODEL, temperatures)
# - Document processing (CHUNK_SIZE, CHUNK_OVERLAP)
# - Server settings (PORT, HOST, CORS_ORIGINS)
```

**Why this matters:** Centralized configuration prevents hardcoded values and makes deployment easier. The validation function ensures the app fails fast with clear errors if misconfigured.

---

### 2. Database Layer (`database.py`)

Async MongoDB handler with comprehensive data operations:

```python
class Database:
    """
    Collections managed:
    - chats: Chat sessions (user_id, title, prompt_template)
    - messages: Chat messages (chat_id, role, content, sources)
    - documents: Uploaded file metadata (chat_id, filename, chunks)
    - users: User data (premium status, usage counts)
    - payments: Razorpay transaction records
    """
```

**Key Operations:**

| Method | Purpose |
|--------|---------|
| `create_chat()` | Creates new chat with user_id and template |
| `add_message()` | Stores messages + auto-titles chat from first message |
| `add_document()` | Tracks uploaded document metadata |
| `delete_chat()` | Cascading delete: messages → documents → Pinecone namespace → chat |
| `check_user_limits()` | Enforces free tier limits (2 chats, 2 docs) |
| `upgrade_to_premium()` | Marks user as premium after payment |

**Pinecone Integration:**
```python
async def _delete_pinecone_namespace(self, namespace: str):
    """When a chat is deleted, its vectors are also removed"""
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    index.delete(delete_all=True, namespace=namespace)
```

---

### 3. RAG Pipeline (`rag_pipeline.py`)

The heart of LegalEagle - Retrieval-Augmented Generation:

```python
class RAGPipeline:
    def __init__(self):
        # Initialize embedding model
        self.embeddings = CohereEmbeddings(model="embed-english-v3.0")
        
        # Initialize Pinecone connection
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pc.Index(PINECONE_INDEX_NAME)
```

**The Query Flow:**

```python
async def query(self, query, chat_id, prompt_template, chat_history, top_k=5):
    # 1. Get vectorstore for this chat's namespace
    vectorstore = self.get_vectorstore(namespace=chat_id)
    
    # 2. Get the appropriate prompt template
    prompt = get_prompt_template(prompt_template)
    
    # 3. Format chat history for context
    history_str = self.format_chat_history(chat_history)
    
    # 4. Setup LLM (Gemini 2.5 Flash)
    llm = self.get_llm()
    
    # 5. Create LangChain RAG chain
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(
        vectorstore.as_retriever(search_kwargs={"k": top_k}),
        question_answer_chain
    )
    
    # 6. Execute and extract sources
    response = rag_chain.invoke({
        "input": query,
        "chat_history": history_str
    })
    
    # 7. Return answer + source page numbers
    return response["answer"], source_pages
```

**Why namespaces matter:**
Each chat has its own Pinecone namespace, meaning:
- Users' documents are isolated from each other
- Different chats can have different documents
- Deleting a chat cleanly removes its vectors

---

### 4. Document Processing (`utils.py`)

Handles PDF parsing, chunking, and vector storage:

```python
def process_and_store_document(file_content, filename, chat_id):
    """
    Complete document processing pipeline:
    
    1. SAVE: Write bytes to temp file
    2. LOAD: Parse PDF with PyPDFLoader
    3. METADATA: Add source filename to each page
    4. CHUNK: Split into overlapping chunks
    5. EMBED: Generate Cohere embeddings
    6. STORE: Save to Pinecone with chat_id namespace
    7. CLEANUP: Delete temp file
    """
```

**Chunking Strategy:**
```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # ~1000 characters per chunk
    chunk_overlap=200,    # 200 char overlap prevents context loss
    separators=["\n\n", "\n", " ", ""]  # Split by paragraphs first
)
```

**Why this configuration:**
- 1000 chars = ~150-200 words, ideal for legal clauses
- 200 char overlap ensures sentences aren't cut mid-thought
- Paragraph-first splitting preserves document structure

---

### 5. Prompt Templates (`prompts.py`)

8 specialized AI personas for different legal tasks:

| Template ID | Name | Best For |
|-------------|------|----------|
| `legal_assistant` | Legal Assistant | General legal Q&A |
| `contract_reviewer` | Contract Reviewer | Analyzing contracts, finding risks |
| `legal_summarizer` | Document Summarizer | Creating executive summaries |
| `compliance_checker` | Compliance Checker | Regulatory compliance analysis |
| `legal_researcher` | Legal Researcher | Finding relevant information |
| `case_analyzer` | Case Analyzer | Breaking down legal cases |
| `legal_drafter` | Document Drafter | Drafting clauses |
| `eli5_legal` | Simple Explainer | Plain language explanations |

**Template Structure:**
```python
PROMPT_TEMPLATES = {
    "contract_reviewer": {
        "name": "Contract Reviewer",
        "description": "Specialized in reviewing contracts...",
        "category": "Legal",
        "system_prompt": """You are a specialized Contract Review Assistant...
        
        YOUR RESPONSIBILITIES:
        1. Identify key contractual terms
        2. Highlight problematic clauses
        3. Point out missing provisions
        ...
        
        CONTEXT FROM DOCUMENTS:
        {context}
        
        CHAT HISTORY:
        {chat_history}"""
    }
}
```

---

### 6. API Models (`models.py`)

Pydantic models for request/response validation:

**Request Models:**
```python
class QueryRequest(BaseModel):
    chat_id: str          # Which chat to query
    query: str            # User's question
    use_context: bool     # Include chat history?

class CreateChatRequest(BaseModel):
    user_id: str
    title: str = "New Chat"
    prompt_template: str = "legal_assistant"
```

**Response Models:**
```python
class QueryResponse(BaseModel):
    answer: str           # LLM's response
    sources: List[int]    # Page numbers referenced
    chat_id: str
    message_id: str
    status: str

class UserStatusResponse(BaseModel):
    is_premium: bool
    can_create_chat: bool
    remaining_queries: int
    # ... usage limits
```

---

### 7. Main Application (`main.py`)

FastAPI application with all routes:

**Startup/Shutdown:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()  # Connect to MongoDB
    print("🦅 LegalEagle API is ready!")
    yield
    # Shutdown
    await db.disconnect()
```

**API Routes:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/chats` | POST | Create new chat |
| `/chats` | GET | List user's chats |
| `/chats/{id}` | GET | Get chat with messages |
| `/chats/{id}` | PATCH | Update chat title/template |
| `/chats/{id}` | DELETE | Delete chat + all data |
| `/ask` | POST | RAG query |
| `/upload` | POST | Upload PDF |
| `/upload/text` | POST | Upload raw text |
| `/templates` | GET | List prompt templates |
| `/user/status` | GET | Get user limits |
| `/payment/create-order` | POST | Start Razorpay payment |
| `/payment/verify` | POST | Verify & upgrade user |

---

## 📚 API Reference

### Create Chat
```bash
POST /chats
Content-Type: application/json

{
  "user_id": "uuid-here",
  "title": "Contract Analysis",
  "prompt_template": "contract_reviewer"
}
```

### Upload Document
```bash
POST /upload
Content-Type: multipart/form-data

file: <PDF file>
chat_id: "chat-uuid"
```

### Ask Question
```bash
POST /ask
Content-Type: application/json

{
  "chat_id": "chat-uuid",
  "query": "What are the termination clauses?",
  "use_context": true
}
```

**Response:**
```json
{
  "answer": "The contract contains the following termination clauses...",
  "sources": [5, 12, 13],
  "chat_id": "chat-uuid",
  "message_id": "msg-uuid",
  "status": "success"
}
```

---

## 💳 Payment Integration

LegalEagle uses **Razorpay** for payment processing (India-focused):

### Flow:
1. User clicks "Upgrade to Premium"
2. Frontend calls `/payment/create-order`
3. Backend creates Razorpay order
4. Razorpay checkout opens in browser
5. User completes payment
6. Frontend calls `/payment/verify` with signature
7. Backend verifies HMAC signature
8. User upgraded to premium

### Verification:
```python
# Server verifies Razorpay signature
generated_signature = hmac.new(
    RAZORPAY_KEY_SECRET.encode(),
    f"{order_id}|{payment_id}".encode(),
    hashlib.sha256
).hexdigest()

if generated_signature == razorpay_signature:
    # Payment valid, upgrade user
    await db.upgrade_to_premium(user_id)
```

---

## 🚀 Deployment

### Backend Deployment

**Environment Variables to Set:**
```env
# Required
GOOGLE_API_KEY=xxx
PINECONE_API_KEY=xxx
PINECONE_HOST=xxx
COHERE_API_KEY=xxx
MONGODB_URI=xxx
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=xxx

# Production settings
CORS_ORIGINS=https://your-frontend.com
DEBUG=false
PORT=8000
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend Deployment (Vercel/Netlify)

**Environment Variables:**
```env
VITE_API_URL=https://your-backend.com
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
```

**Build Command:**
```bash
npm run build
```

**Output Directory:** `dist`

---

## 🔐 Environment Variables

### Server (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key |
| `PINECONE_API_KEY` | ✅ | Pinecone API key |
| `PINECONE_HOST` | ✅ | Pinecone index host URL |
| `COHERE_API_KEY` | ✅ | Cohere API key |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret key |
| `CORS_ORIGINS` | ❌ | Allowed origins (default: *) |
| `PORT` | ❌ | Server port (default: 8000) |
| `DEBUG` | ❌ | Enable debug mode (default: false) |

### Client (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key |

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ for legal professionals**

[⬆ Back to Top](#-legaleagle)

</div>

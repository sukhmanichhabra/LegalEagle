import os
import sys
from dotenv import load_dotenv

load_dotenv()

# API Keys (Required - must be set in environment)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

# Razorpay Configuration (Required for payments)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Pinecone Configuration (Required)
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "legaleagle")
PINECONE_HOST = os.getenv("PINECONE_HOST")


# Validate required environment variables
def validate_env():
    """Validate that all required environment variables are set"""
    required_vars = {
        "GOOGLE_API_KEY": GOOGLE_API_KEY,
        "PINECONE_API_KEY": PINECONE_API_KEY,
        "COHERE_API_KEY": COHERE_API_KEY,
        "MONGODB_URI": MONGODB_URI,
        "RAZORPAY_KEY_ID": RAZORPAY_KEY_ID,
        "RAZORPAY_KEY_SECRET": RAZORPAY_KEY_SECRET,
        "PINECONE_HOST": PINECONE_HOST,
    }
    
    missing = [name for name, value in required_vars.items() if not value]
    
    if missing:
        print("❌ Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        print("\n📝 Please set these in your .env file or environment")
        print("   See .env.example for reference")
        sys.exit(1)


# Run validation on import (will exit if missing vars)
validate_env()

# Pricing Configuration (can be overridden via env)
FREE_CHAT_LIMIT = int(os.getenv("FREE_CHAT_LIMIT", "2"))
FREE_DOCUMENT_LIMIT = int(os.getenv("FREE_DOCUMENT_LIMIT", "2"))
PREMIUM_PRICE_INR = int(os.getenv("PREMIUM_PRICE_INR", "49900"))  # ₹499 in paise
PREMIUM_QUERIES_LIMIT = int(os.getenv("PREMIUM_QUERIES_LIMIT", "-1"))  # -1 = unlimited

# Pinecone additional config
PINECONE_DIMENSION = int(os.getenv("PINECONE_DIMENSION", "1024"))
PINECONE_METRIC = os.getenv("PINECONE_METRIC", "cosine")

# MongoDB Configuration
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "legaleagle")
MONGODB_CHATS_COLLECTION = os.getenv("MONGODB_CHATS_COLLECTION", "chats")
MONGODB_MESSAGES_COLLECTION = os.getenv("MONGODB_MESSAGES_COLLECTION", "messages")
MONGODB_DOCUMENTS_COLLECTION = os.getenv("MONGODB_DOCUMENTS_COLLECTION", "documents")
MONGODB_USERS_COLLECTION = os.getenv("MONGODB_USERS_COLLECTION", "users")
MONGODB_PAYMENTS_COLLECTION = os.getenv("MONGODB_PAYMENTS_COLLECTION", "payments")

# Embedding Model
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "embed-english-v3.0")

# LLM Configuration
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))

# Document Processing
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

# Server Configuration
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# CORS Configuration - comma separated origins for production
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Debug mode
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

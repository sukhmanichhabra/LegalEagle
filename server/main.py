import os
import hmac
import hashlib
from contextlib import asynccontextmanager
from typing import List
from datetime import datetime

import razorpay
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware

from config import (
    RAZORPAY_KEY_ID, 
    RAZORPAY_KEY_SECRET,
    PREMIUM_PRICE_INR,
    PREMIUM_QUERIES_LIMIT,
    CORS_ORIGINS,
    PORT,
    HOST,
    DEBUG
)
from database import db
from models import (
    CreateChatRequest,
    QueryRequest,
    UpdateChatRequest,
    ChatResponse,
    ChatListResponse,
    MessageResponse,
    ChatHistoryResponse,
    QueryResponse,
    DocumentResponse,
    UploadResponse,
    PromptTemplateResponse,
    PromptTemplatesListResponse,
    DeleteResponse,
    ErrorResponse,
    CreateOrderRequest,
    VerifyPaymentRequest,
    UserStatusResponse,
    CreateOrderResponse,
    PaymentVerifyResponse,
    PaymentHistoryResponse
)
from prompts import get_all_templates, get_templates_by_category, get_template_info
from rag_pipeline import rag_pipeline
from utils import (
    process_and_store_document,
    process_text_content,
    validate_pdf,
    get_file_size_mb
)

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ==================== APP LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    await db.connect()
    print("🦅 LegalEagle API is ready!")
    
    yield
    
    # Shutdown
    await db.disconnect()
    print("👋 LegalEagle API shutting down...")


# ==================== APP INITIALIZATION ====================

app = FastAPI(
    title="LegalEagle API",
    description="AI-powered legal document analysis and chat assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH CHECK ====================

@app.get("/", tags=["Health"])
def health_check():
    """API health check endpoint"""
    return {
        "status": "online",
        "service": "LegalEagle API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def detailed_health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "vector_store": "connected",
        "llm": "ready"
    }


# ==================== CHAT ROUTES ====================

@app.post("/chats", response_model=ChatResponse, tags=["Chats"])
async def create_chat(request: CreateChatRequest):
    """Create a new chat session"""
    try:
        # Check user limits
        limits = await db.check_user_limits(request.user_id)
        if not limits["can_create_chat"]:
            raise HTTPException(
                status_code=403, 
                detail=f"Free tier limit reached. You can only create {limits['chat_limit']} chats. Please upgrade to premium."
            )
        
        chat_id = await db.create_chat(
            user_id=request.user_id,
            title=request.title,
            prompt_template=request.prompt_template
        )
        
        # Increment user's chat count
        await db.increment_user_chat_count(request.user_id)
        
        chat = await db.get_chat(chat_id)
        
        return ChatResponse(
            id=chat["_id"],
            user_id=chat["user_id"],
            title=chat["title"],
            prompt_template=chat["prompt_template"],
            created_at=chat["created_at"],
            updated_at=chat["updated_at"],
            is_active=chat["is_active"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats", response_model=ChatListResponse, tags=["Chats"])
async def get_user_chats(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, description="Maximum number of chats to return")
):
    """Get all chats for a user"""
    try:
        chats = await db.get_user_chats(user_id, limit)
        
        return ChatListResponse(
            chats=[
                ChatResponse(
                    id=chat["_id"],
                    user_id=chat["user_id"],
                    title=chat["title"],
                    prompt_template=chat["prompt_template"],
                    created_at=chat["created_at"],
                    updated_at=chat["updated_at"],
                    is_active=chat["is_active"]
                )
                for chat in chats
            ],
            total=len(chats)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats/{chat_id}", response_model=ChatHistoryResponse, tags=["Chats"])
async def get_chat_history(chat_id: str):
    """Get a chat with its full message history"""
    try:
        chat = await db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        messages = await db.get_chat_messages(chat_id)
        
        return ChatHistoryResponse(
            chat=ChatResponse(
                id=chat["_id"],
                user_id=chat["user_id"],
                title=chat["title"],
                prompt_template=chat["prompt_template"],
                created_at=chat["created_at"],
                updated_at=chat["updated_at"],
                is_active=chat["is_active"]
            ),
            messages=[
                MessageResponse(
                    id=msg["_id"],
                    chat_id=msg["chat_id"],
                    role=msg["role"],
                    content=msg["content"],
                    sources=msg["sources"],
                    created_at=msg["created_at"]
                )
                for msg in messages
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/chats/{chat_id}", response_model=ChatResponse, tags=["Chats"])
async def update_chat(chat_id: str, request: UpdateChatRequest):
    """Update chat metadata (title, prompt template)"""
    try:
        chat = await db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        updates = {}
        if request.title is not None:
            updates["title"] = request.title
        if request.prompt_template is not None:
            # Validate template exists
            if not get_template_info(request.prompt_template):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid prompt template: {request.prompt_template}"
                )
            updates["prompt_template"] = request.prompt_template
        
        if updates:
            await db.update_chat(chat_id, updates)
        
        chat = await db.get_chat(chat_id)
        
        return ChatResponse(
            id=chat["_id"],
            user_id=chat["user_id"],
            title=chat["title"],
            prompt_template=chat["prompt_template"],
            created_at=chat["created_at"],
            updated_at=chat["updated_at"],
            is_active=chat["is_active"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chats/{chat_id}", response_model=DeleteResponse, tags=["Chats"])
async def delete_chat(chat_id: str):
    """
    Delete a chat and all associated data:
    - All messages
    - All document metadata
    - All vectors from Pinecone
    """
    try:
        chat = await db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        success = await db.delete_chat(chat_id)
        
        if success:
            return DeleteResponse(
                status="success",
                message=f"Chat {chat_id} and all associated data deleted successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete chat")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== QUERY/ASK ROUTES ====================

@app.post("/ask", response_model=QueryResponse, tags=["Query"])
async def ask_question(request: QueryRequest):
    """
    Ask a question about uploaded documents.
    Uses RAG to retrieve relevant context and generate an answer.
    """
    try:
        # 1. Validate chat exists
        chat = await db.get_chat(request.chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # 2. Check user limits
        limits = await db.check_user_limits(chat["user_id"])
        if not limits["can_query"]:
            raise HTTPException(
                status_code=403,
                detail="Query limit reached. Please upgrade to premium to continue."
            )
        
        # 3. Save user message
        user_msg_id = await db.add_message(
            chat_id=request.chat_id,
            role="user",
            content=request.query
        )
        
        # 4. Get chat history for context if requested
        chat_history = []
        if request.use_context:
            chat_history = await db.get_chat_context(request.chat_id, max_messages=10)
        
        # 5. Run RAG pipeline
        answer, sources = await rag_pipeline.query(
            query=request.query,
            chat_id=request.chat_id,
            prompt_template=chat["prompt_template"],
            chat_history=chat_history
        )
        
        # 6. Increment user query count
        await db.increment_user_query_count(chat["user_id"])
        
        # 7. Save assistant response
        assistant_msg_id = await db.add_message(
            chat_id=request.chat_id,
            role="assistant",
            content=answer,
            sources=sources
        )
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            chat_id=request.chat_id,
            message_id=assistant_msg_id,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Query Error: {e}")
        # Save error response
        await db.add_message(
            chat_id=request.chat_id,
            role="assistant",
            content="I encountered an error processing your request. Please try again.",
            metadata={"error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", tags=["Query"])
async def similarity_search(
    chat_id: str = Query(..., description="Chat ID"),
    query: str = Query(..., description="Search query"),
    top_k: int = Query(5, description="Number of results")
):
    """
    Perform similarity search without LLM generation.
    Returns raw document chunks matching the query.
    """
    try:
        results = await rag_pipeline.similarity_search(
            query=query,
            chat_id=chat_id,
            top_k=top_k
        )
        
        return {
            "status": "success",
            "results": results,
            "total": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DOCUMENT UPLOAD ROUTES ====================

@app.post("/upload", response_model=UploadResponse, tags=["Documents"])
async def upload_document(
    file: UploadFile = File(...),
    chat_id: str = Form(...)
):
    """
    Upload a PDF document to a chat.
    The document is processed, chunked, embedded, and stored in Pinecone.
    """
    try:
        # 1. Validate chat exists
        chat = await db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # 2. Check user document limits
        limits = await db.check_user_limits(chat["user_id"])
        if not limits["can_upload_document"]:
            raise HTTPException(
                status_code=403,
                detail=f"Free tier limit reached. You can only upload {limits['document_limit']} documents. Please upgrade to premium."
            )
        
        # 3. Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF files are allowed"
            )
        
        # 4. Read file content
        content = await file.read()
        
        # 5. Validate PDF
        if not validate_pdf(content):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file"
            )
        
        # 6. Check file size (max 50MB)
        file_size_mb = get_file_size_mb(content)
        if file_size_mb > 50:
            raise HTTPException(
                status_code=400,
                detail=f"File too large ({file_size_mb:.1f}MB). Maximum size is 50MB."
            )
        
        # 7. Process and store document
        num_chunks = process_and_store_document(
            content, 
            file.filename, 
            chat_id
        )
        
        # 8. Increment user document count
        await db.increment_user_document_count(chat["user_id"])
        
        # 9. Save document metadata to MongoDB
        doc_id = await db.add_document(
            chat_id=chat_id,
            filename=file.filename,
            num_chunks=num_chunks,
            file_size=len(content)
        )
        
        return UploadResponse(
            status="success",
            message=f"Document '{file.filename}' processed successfully",
            document_id=doc_id,
            filename=file.filename,
            chunks=num_chunks
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/text", tags=["Documents"])
async def upload_text(
    chat_id: str = Form(...),
    text: str = Form(...),
    source_name: str = Form("Pasted Text")
):
    """
    Upload raw text content to a chat.
    Useful for pasting content directly without file upload.
    """
    try:
        # Validate chat exists
        chat = await db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Process text
        num_chunks = process_text_content(
            text=text,
            source_name=source_name,
            chat_id=chat_id
        )
        
        # Save document metadata
        doc_id = await db.add_document(
            chat_id=chat_id,
            filename=source_name,
            num_chunks=num_chunks,
            file_size=len(text.encode())
        )
        
        return {
            "status": "success",
            "message": f"Text content processed successfully",
            "document_id": doc_id,
            "source_name": source_name,
            "chunks": num_chunks
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats/{chat_id}/documents", tags=["Documents"])
async def get_chat_documents(chat_id: str):
    """Get all documents uploaded to a chat"""
    try:
        chat = await db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        docs = await db.get_chat_documents(chat_id)
        
        # Get Pinecone stats
        stats = rag_pipeline.get_namespace_stats(chat_id)
        
        return {
            "status": "success",
            "documents": [
                DocumentResponse(
                    id=doc["_id"],
                    chat_id=doc["chat_id"],
                    filename=doc["filename"],
                    num_chunks=doc["num_chunks"],
                    file_size=doc.get("file_size", 0),
                    uploaded_at=doc["uploaded_at"]
                )
                for doc in docs
            ],
            "total_documents": len(docs),
            "total_vectors": stats.get("vector_count", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PROMPT TEMPLATE ROUTES ====================

@app.get("/templates", response_model=PromptTemplatesListResponse, tags=["Templates"])
async def list_prompt_templates():
    """Get all available prompt templates"""
    templates = get_all_templates()
    
    return PromptTemplatesListResponse(
        templates=[
            PromptTemplateResponse(
                id=t["id"],
                name=t["name"],
                description=t["description"],
                category=t["category"]
            )
            for t in templates
        ]
    )


@app.get("/templates/{template_id}", response_model=PromptTemplateResponse, tags=["Templates"])
async def get_prompt_template(template_id: str):
    """Get details of a specific prompt template"""
    template = get_template_info(template_id)
    
    if not template:
        raise HTTPException(
            status_code=404,
            detail=f"Template '{template_id}' not found"
        )
    
    return PromptTemplateResponse(
        id=template["id"],
        name=template["name"],
        description=template["description"],
        category=template["category"]
    )


@app.get("/templates/category/{category}", tags=["Templates"])
async def get_templates_by_category_route(category: str):
    """Get prompt templates filtered by category"""
    templates = get_templates_by_category(category)
    
    return {
        "category": category,
        "templates": [
            PromptTemplateResponse(
                id=t["id"],
                name=t["name"],
                description=t["description"],
                category=t["category"]
            )
            for t in templates
        ],
        "total": len(templates)
    }


# ==================== USER & PAYMENT ROUTES ====================

@app.get("/user/status", response_model=UserStatusResponse, tags=["User"])
async def get_user_status(user_id: str = Query(..., description="User ID")):
    """Get user status including limits and premium status"""
    try:
        limits = await db.check_user_limits(user_id)
        
        return UserStatusResponse(
            user_id=user_id,
            is_premium=limits["is_premium"],
            can_create_chat=limits["can_create_chat"],
            can_upload_document=limits["can_upload_document"],
            can_query=limits["can_query"],
            chat_count=limits["chat_count"],
            document_count=limits["document_count"],
            remaining_queries=limits["remaining_queries"],
            chat_limit=limits["chat_limit"],
            document_limit=limits["document_limit"],
            message=limits["message"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/payment/create-order", response_model=CreateOrderResponse, tags=["Payment"])
async def create_payment_order(request: CreateOrderRequest):
    """Create a Razorpay order for premium upgrade"""
    try:
        # Ensure user exists
        await db.get_or_create_user(request.user_id)
        
        # Create Razorpay order
        # Receipt must be <= 40 chars, so use short format
        short_user_id = str(request.user_id)[:8]  # First 8 chars of UUID
        timestamp = int(datetime.utcnow().timestamp())
        receipt = f"ord_{short_user_id}_{timestamp}"[:40]  # Ensure max 40 chars
        
        order_data = {
            "amount": PREMIUM_PRICE_INR,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "user_id": request.user_id,
                "product": "LegalEagle Premium",
                "queries": PREMIUM_QUERIES_LIMIT
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        # Store order in database
        await db.create_payment(
            user_id=request.user_id,
            razorpay_order_id=order["id"],
            amount=PREMIUM_PRICE_INR,
            currency="INR"
        )
        
        return CreateOrderResponse(
            order_id=order["id"],
            amount=PREMIUM_PRICE_INR,
            currency="INR",
            key_id=RAZORPAY_KEY_ID,
            status="created"
        )
        
    except Exception as e:
        print(f"Order Creation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/payment/verify", response_model=PaymentVerifyResponse, tags=["Payment"])
async def verify_payment(request: VerifyPaymentRequest):
    """Verify Razorpay payment and upgrade user to premium"""
    try:
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{request.razorpay_order_id}|{request.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != request.razorpay_signature:
            await db.update_payment_failed(
                request.razorpay_order_id,
                "Invalid signature"
            )
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Update payment record
        await db.update_payment_success(
            razorpay_order_id=request.razorpay_order_id,
            razorpay_payment_id=request.razorpay_payment_id,
            razorpay_signature=request.razorpay_signature
        )
        
        # Upgrade user to premium
        user = await db.upgrade_to_premium(request.user_id, PREMIUM_QUERIES_LIMIT)
        
        return PaymentVerifyResponse(
            status="success",
            message="Payment verified successfully. You are now a premium user with unlimited queries!",
            is_premium=True,
            remaining_queries=-1  # -1 indicates unlimited
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Payment Verification Error: {e}")
        await db.update_payment_failed(request.razorpay_order_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/payment/history", tags=["Payment"])
async def get_payment_history(user_id: str = Query(..., description="User ID")):
    """Get user's payment history"""
    try:
        payments = await db.get_user_payments(user_id)
        
        return {
            "status": "success",
            "payments": [
                PaymentHistoryResponse(
                    id=p["_id"],
                    razorpay_order_id=p["razorpay_order_id"],
                    razorpay_payment_id=p.get("razorpay_payment_id"),
                    amount=p["amount"],
                    currency=p["currency"],
                    status=p["status"],
                    created_at=p["created_at"]
                )
                for p in payments
            ],
            "total": len(payments)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG
    )

from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pinecone import Pinecone

from config import (
    MONGODB_URI, 
    MONGODB_DB_NAME, 
    MONGODB_CHATS_COLLECTION,
    MONGODB_MESSAGES_COLLECTION,
    MONGODB_DOCUMENTS_COLLECTION,
    MONGODB_USERS_COLLECTION,
    MONGODB_PAYMENTS_COLLECTION,
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
    FREE_CHAT_LIMIT,
    FREE_DOCUMENT_LIMIT,
    PREMIUM_QUERIES_LIMIT
)


class Database:
    """MongoDB Database Handler for Chat Persistence"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.chats = None
        self.messages = None
        self.documents = None
        self.users = None
        self.payments = None
        
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(MONGODB_URI)
        self.db = self.client[MONGODB_DB_NAME]
        self.chats = self.db[MONGODB_CHATS_COLLECTION]
        self.messages = self.db[MONGODB_MESSAGES_COLLECTION]
        self.documents = self.db[MONGODB_DOCUMENTS_COLLECTION]
        self.users = self.db[MONGODB_USERS_COLLECTION]
        self.payments = self.db[MONGODB_PAYMENTS_COLLECTION]
        
        # Create indexes for better query performance
        await self.chats.create_index("user_id")
        await self.chats.create_index("created_at")
        await self.messages.create_index("chat_id")
        await self.messages.create_index("created_at")
        await self.documents.create_index("chat_id")
        await self.users.create_index("user_id", unique=True)
        await self.payments.create_index("user_id")
        await self.payments.create_index("razorpay_order_id")
        
        print("✅ Connected to MongoDB")
        
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("🔌 Disconnected from MongoDB")
    
    # ==================== CHAT OPERATIONS ====================
    
    async def create_chat(
        self, 
        user_id: str, 
        title: str = "New Chat",
        prompt_template: str = "legal_assistant"
    ) -> str:
        """Create a new chat session"""
        chat = {
            "user_id": user_id,
            "title": title,
            "prompt_template": prompt_template,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        result = await self.chats.insert_one(chat)
        return str(result.inserted_id)
    
    async def get_chat(self, chat_id: str) -> Optional[dict]:
        """Get a single chat by ID"""
        chat = await self.chats.find_one({"_id": ObjectId(chat_id)})
        if chat:
            chat["_id"] = str(chat["_id"])
        return chat
    
    async def get_user_chats(self, user_id: str, limit: int = 50) -> List[dict]:
        """Get all chats for a user"""
        cursor = self.chats.find(
            {"user_id": user_id, "is_active": True}
        ).sort("updated_at", -1).limit(limit)
        
        chats = []
        async for chat in cursor:
            chat["_id"] = str(chat["_id"])
            chats.append(chat)
        return chats
    
    async def update_chat(self, chat_id: str, updates: dict) -> bool:
        """Update chat metadata"""
        updates["updated_at"] = datetime.utcnow()
        result = await self.chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": updates}
        )
        return result.modified_count > 0
    
    async def delete_chat(self, chat_id: str) -> bool:
        """
        Delete a chat and all associated data:
        - Messages from MongoDB
        - Documents metadata from MongoDB
        - Vectors from Pinecone (namespace = chat_id)
        """
        try:
            # 1. Delete messages
            await self.messages.delete_many({"chat_id": chat_id})
            
            # 2. Delete document metadata
            await self.documents.delete_many({"chat_id": chat_id})
            
            # 3. Delete vectors from Pinecone
            await self._delete_pinecone_namespace(chat_id)
            
            # 4. Delete the chat itself
            result = await self.chats.delete_one({"_id": ObjectId(chat_id)})
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting chat: {e}")
            return False
    
    async def _delete_pinecone_namespace(self, namespace: str):
        """Delete all vectors in a Pinecone namespace"""
        try:
            pc = Pinecone(api_key=PINECONE_API_KEY)
            index = pc.Index(PINECONE_INDEX_NAME)
            
            # Delete all vectors in the namespace
            index.delete(delete_all=True, namespace=namespace)
            print(f"✅ Deleted Pinecone namespace: {namespace}")
            
        except Exception as e:
            print(f"Error deleting Pinecone namespace: {e}")
    
    # ==================== MESSAGE OPERATIONS ====================
    
    async def add_message(
        self, 
        chat_id: str, 
        role: str, 
        content: str,
        sources: List[int] = None,
        metadata: dict = None
    ) -> str:
        """Add a message to a chat"""
        message = {
            "chat_id": chat_id,
            "role": role,  # "user" or "assistant"
            "content": content,
            "sources": sources or [],
            "metadata": metadata or {},
            "created_at": datetime.utcnow()
        }
        result = await self.messages.insert_one(message)
        
        # Update chat's updated_at timestamp
        await self.update_chat(chat_id, {})
        
        # Auto-generate chat title from first user message
        if role == "user":
            chat = await self.get_chat(chat_id)
            if chat and chat.get("title") == "New Chat":
                title = content[:50] + "..." if len(content) > 50 else content
                await self.update_chat(chat_id, {"title": title})
        
        return str(result.inserted_id)
    
    async def get_chat_messages(
        self, 
        chat_id: str, 
        limit: int = 100
    ) -> List[dict]:
        """Get all messages for a chat"""
        cursor = self.messages.find(
            {"chat_id": chat_id}
        ).sort("created_at", 1).limit(limit)
        
        messages = []
        async for msg in cursor:
            msg["_id"] = str(msg["_id"])
            messages.append(msg)
        return messages
    
    async def get_chat_context(
        self, 
        chat_id: str, 
        max_messages: int = 10
    ) -> List[dict]:
        """Get recent messages for context (for RAG)"""
        cursor = self.messages.find(
            {"chat_id": chat_id}
        ).sort("created_at", -1).limit(max_messages)
        
        messages = []
        async for msg in cursor:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Reverse to get chronological order
        return list(reversed(messages))
    
    # ==================== DOCUMENT OPERATIONS ====================
    
    async def add_document(
        self, 
        chat_id: str, 
        filename: str,
        num_chunks: int,
        file_size: int = 0
    ) -> str:
        """Track uploaded documents"""
        doc = {
            "chat_id": chat_id,
            "filename": filename,
            "num_chunks": num_chunks,
            "file_size": file_size,
            "uploaded_at": datetime.utcnow()
        }
        result = await self.documents.insert_one(doc)
        return str(result.inserted_id)
    
    async def get_chat_documents(self, chat_id: str) -> List[dict]:
        """Get all documents uploaded to a chat"""
        cursor = self.documents.find({"chat_id": chat_id})
        
        docs = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            docs.append(doc)
        return docs
    
    async def delete_document(self, document_id: str, chat_id: str) -> bool:
        """Delete a specific document from a chat"""
        try:
            # Get document info
            doc = await self.documents.find_one({"_id": ObjectId(document_id)})
            if not doc:
                return False
            
            # Delete from MongoDB
            await self.documents.delete_one({"_id": ObjectId(document_id)})
            
            # Note: For Pinecone, we'd need to track vector IDs per document
            # For simplicity, we're not implementing per-document vector deletion
            # The full namespace deletion happens on chat delete
            
            return True
            
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False

    # ==================== USER OPERATIONS ====================
    
    async def get_or_create_user(self, user_id: str) -> dict:
        """Get user or create if doesn't exist"""
        user = await self.users.find_one({"user_id": user_id})
        
        if not user:
            user = {
                "user_id": user_id,
                "is_premium": False,
                "chat_count": 0,
                "document_count": 0,
                "query_count": 0,
                "remaining_queries": 0,  # 0 for free users, -1 for premium (unlimited)
                "total_payments": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await self.users.insert_one(user)
        
        return user
    
    async def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        return await self.users.find_one({"user_id": user_id})
    
    async def increment_user_chat_count(self, user_id: str) -> dict:
        """Increment user's chat count"""
        result = await self.users.find_one_and_update(
            {"user_id": user_id},
            {
                "$inc": {"chat_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True
        )
        return result
    
    async def increment_user_document_count(self, user_id: str) -> dict:
        """Increment user's document count"""
        result = await self.users.find_one_and_update(
            {"user_id": user_id},
            {
                "$inc": {"document_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True
        )
        return result
    
    async def increment_user_query_count(self, user_id: str) -> dict:
        """Increment user's query count (premium users have unlimited queries)"""
        user = await self.get_user(user_id)
        
        update = {
            "$inc": {"query_count": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
        
        # Premium users have unlimited queries, so we don't decrement
        # remaining_queries will always be -1 for premium users
        
        result = await self.users.find_one_and_update(
            {"user_id": user_id},
            update,
            return_document=True
        )
        
        return result
    
    async def check_user_limits(self, user_id: str) -> dict:
        """Check if user has exceeded free limits"""
        user = await self.get_or_create_user(user_id)
        
        is_premium = user.get("is_premium", False)
        chat_count = user.get("chat_count", 0)
        document_count = user.get("document_count", 0)
        remaining_queries = user.get("remaining_queries", 0)
        
        if is_premium:
            return {
                "can_create_chat": True,
                "can_upload_document": True,
                "can_query": True,  # Premium users have unlimited queries
                "is_premium": True,
                "chat_count": chat_count,
                "document_count": document_count,
                "remaining_queries": -1,  # -1 indicates unlimited
                "chat_limit": None,
                "document_limit": None,
                "message": "Premium user with unlimited access"
            }
        
        can_create_chat = chat_count < FREE_CHAT_LIMIT
        can_upload = document_count < FREE_DOCUMENT_LIMIT
        
        # Free users can always query within their existing chats
        # They just can't create MORE chats beyond the limit
        return {
            "can_create_chat": can_create_chat,
            "can_upload_document": can_upload,
            "can_query": True,  # Free users can always query within their chats
            "is_premium": False,
            "chat_count": chat_count,
            "document_count": document_count,
            "remaining_queries": 0,
            "chat_limit": FREE_CHAT_LIMIT,
            "document_limit": FREE_DOCUMENT_LIMIT,
            "message": "Free tier limits apply"
        }
    
    async def upgrade_to_premium(self, user_id: str, queries: int = PREMIUM_QUERIES_LIMIT) -> dict:
        """Upgrade user to premium with unlimited queries"""
        result = await self.users.find_one_and_update(
            {"user_id": user_id},
            {
                "$set": {
                    "is_premium": True,
                    "remaining_queries": -1,  # -1 indicates unlimited
                    "updated_at": datetime.utcnow()
                },
                "$inc": {
                    "total_payments": 1
                }
            },
            return_document=True
        )
        return result

    # ==================== PAYMENT OPERATIONS ====================
    
    async def create_payment(
        self,
        user_id: str,
        razorpay_order_id: str,
        amount: int,
        currency: str = "INR"
    ) -> str:
        """Create a payment record"""
        payment = {
            "user_id": user_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": None,
            "razorpay_signature": None,
            "amount": amount,
            "currency": currency,
            "status": "created",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await self.payments.insert_one(payment)
        return str(result.inserted_id)
    
    async def update_payment_success(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """Update payment record on successful payment"""
        result = await self.payments.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {
                "$set": {
                    "razorpay_payment_id": razorpay_payment_id,
                    "razorpay_signature": razorpay_signature,
                    "status": "success",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    async def update_payment_failed(self, razorpay_order_id: str, error: str = None) -> bool:
        """Update payment record on failed payment"""
        result = await self.payments.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {
                "$set": {
                    "status": "failed",
                    "error": error,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    async def get_payment_by_order_id(self, razorpay_order_id: str) -> Optional[dict]:
        """Get payment by Razorpay order ID"""
        return await self.payments.find_one({"razorpay_order_id": razorpay_order_id})
    
    async def get_user_payments(self, user_id: str) -> List[dict]:
        """Get all payments for a user"""
        cursor = self.payments.find({"user_id": user_id}).sort("created_at", -1)
        payments = []
        async for payment in cursor:
            payment["_id"] = str(payment["_id"])
            payments.append(payment)
        return payments


# Global database instance
db = Database()

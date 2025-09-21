from typing import List, Optional, Tuple
from pinecone import Pinecone
from langchain_cohere import CohereEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

from config import (
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
    EMBEDDING_MODEL,
    LLM_MODEL,
    LLM_TEMPERATURE
)
from prompts import get_prompt_template, PROMPT_TEMPLATES


class RAGPipeline:
    """
    RAG (Retrieval-Augmented Generation) Pipeline for LegalEagle.
    Handles document retrieval and LLM-based question answering.
    """
    
    def __init__(self):
        self.embeddings = CohereEmbeddings(model=EMBEDDING_MODEL)
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pc.Index(PINECONE_INDEX_NAME)
        
    def get_vectorstore(self, namespace: str) -> PineconeVectorStore:
        """Get a vectorstore for a specific namespace (chat_id)"""
        return PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=self.embeddings,
            namespace=namespace
        )
    
    def get_llm(self, temperature: float = None) -> ChatGoogleGenerativeAI:
        """Get the LLM instance"""
        return ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            temperature=temperature or LLM_TEMPERATURE
        )
    
    def format_chat_history(self, messages: List[dict]) -> str:
        """Format chat history for inclusion in prompt"""
        if not messages:
            return "No previous conversation."
        
        formatted = []
        for msg in messages[-10:]:  # Last 10 messages for context
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        
        return "\n".join(formatted)
    
    async def query(
        self,
        query: str,
        chat_id: str,
        prompt_template: str = "legal_assistant",
        chat_history: List[dict] = None,
        top_k: int = 5
    ) -> Tuple[str, List[int]]:
        """
        Execute RAG query.
        
        Args:
            query: User's question
            chat_id: Chat ID (used as Pinecone namespace)
            prompt_template: Which prompt template to use
            chat_history: Previous messages for context
            top_k: Number of documents to retrieve
            
        Returns:
            Tuple of (answer, source_pages)
        """
        try:
            # 1. Get vectorstore for this chat's namespace
            vectorstore = self.get_vectorstore(namespace=chat_id)
            
            # 2. Get the prompt template
            prompt = get_prompt_template(prompt_template)
            
            # 3. Format chat history
            history_str = self.format_chat_history(chat_history or [])
            
            # 4. Setup LLM
            llm = self.get_llm()
            
            # 5. Create the RAG chain
            question_answer_chain = create_stuff_documents_chain(llm, prompt)
            rag_chain = create_retrieval_chain(
                vectorstore.as_retriever(search_kwargs={"k": top_k}),
                question_answer_chain
            )
            
            # 6. Execute the chain
            response = rag_chain.invoke({
                "input": query,
                "chat_history": history_str
            })
            
            # 7. Extract source pages
            source_pages = []
            if "context" in response and response["context"]:
                raw_pages = [doc.metadata.get("page", 0) for doc in response["context"]]
                source_pages = sorted(list(set(p + 1 for p in raw_pages)))
            
            return response["answer"], source_pages
            
        except Exception as e:
            print(f"RAG Query Error: {e}")
            # Return a helpful error message
            if "namespace" in str(e).lower() or "empty" in str(e).lower():
                return "I don't have any documents to reference yet. Please upload a document first.", []
            raise e
    
    async def similarity_search(
        self,
        query: str,
        chat_id: str,
        top_k: int = 5
    ) -> List[dict]:
        """
        Perform similarity search without LLM generation.
        Useful for finding relevant document sections.
        """
        vectorstore = self.get_vectorstore(namespace=chat_id)
        docs = vectorstore.similarity_search(query, k=top_k)
        
        return [
            {
                "content": doc.page_content,
                "page": doc.metadata.get("page", 0) + 1,
                "source": doc.metadata.get("source", "Unknown")
            }
            for doc in docs
        ]
    
    def check_namespace_exists(self, namespace: str) -> bool:
        """Check if a namespace has any vectors"""
        try:
            stats = self.index.describe_index_stats()
            namespaces = stats.get("namespaces", {})
            return namespace in namespaces and namespaces[namespace].get("vector_count", 0) > 0
        except Exception as e:
            print(f"Error checking namespace: {e}")
            return False
    
    def get_namespace_stats(self, namespace: str) -> dict:
        """Get statistics for a namespace"""
        try:
            stats = self.index.describe_index_stats()
            namespaces = stats.get("namespaces", {})
            
            if namespace in namespaces:
                return {
                    "exists": True,
                    "vector_count": namespaces[namespace].get("vector_count", 0)
                }
            return {"exists": False, "vector_count": 0}
            
        except Exception as e:
            print(f"Error getting namespace stats: {e}")
            return {"exists": False, "vector_count": 0, "error": str(e)}


# Global RAG pipeline instance
rag_pipeline = RAGPipeline()

"""
LegalEagle RAG Pipeline Test Suite

This script tests the complete RAG pipeline including:
- Chat creation and management
- Document upload and processing
- Question answering
- Chat history persistence
- Prompt template switching
- Chat deletion

Usage:
    python test_pipeline.py

Make sure MongoDB and the server are running before testing.
"""

import os
import sys
import time
import requests
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test_user_123"
TEST_PDF_PATH = "data/Resume.pdf"  # Put a test PDF here


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def log_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")


def log_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")


def log_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")


def log_header(msg):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}{Colors.RESET}\n")


class LegalEagleTest:
    """Test suite for LegalEagle API"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.chat_id = None
        self.user_id = TEST_USER_ID
        
    def test_health(self) -> bool:
        """Test API health endpoint"""
        log_header("Testing Health Endpoint")
        
        try:
            response = requests.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                log_success(f"API is online: {data}")
                return True
            else:
                log_error(f"Health check failed: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            log_error("Could not connect to server. Is it running?")
            return False
    
    def test_list_templates(self) -> bool:
        """Test listing prompt templates"""
        log_header("Testing Prompt Templates")
        
        response = requests.get(f"{self.base_url}/templates")
        
        if response.status_code == 200:
            data = response.json()
            templates = data.get("templates", [])
            log_success(f"Found {len(templates)} prompt templates:")
            
            for t in templates:
                print(f"   - {t['id']}: {t['name']} ({t['category']})")
            return True
        else:
            log_error(f"Failed to list templates: {response.text}")
            return False
    
    def test_create_chat(self, prompt_template: str = "legal_assistant") -> bool:
        """Test creating a new chat"""
        log_header("Testing Chat Creation")
        
        response = requests.post(
            f"{self.base_url}/chats",
            json={
                "user_id": self.user_id,
                "title": "Test Legal Chat",
                "prompt_template": prompt_template
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.chat_id = data["id"]
            log_success(f"Created chat: {self.chat_id}")
            log_info(f"Title: {data['title']}")
            log_info(f"Template: {data['prompt_template']}")
            return True
        else:
            log_error(f"Failed to create chat: {response.text}")
            return False
    
    def test_list_chats(self) -> bool:
        """Test listing user chats"""
        log_header("Testing Chat Listing")
        
        response = requests.get(
            f"{self.base_url}/chats",
            params={"user_id": self.user_id}
        )
        
        if response.status_code == 200:
            data = response.json()
            chats = data.get("chats", [])
            log_success(f"Found {len(chats)} chats for user")
            
            for chat in chats[:5]:  # Show first 5
                print(f"   - {chat['id'][:8]}... : {chat['title']}")
            return True
        else:
            log_error(f"Failed to list chats: {response.text}")
            return False
    
    def test_upload_document(self) -> bool:
        """Test document upload"""
        log_header("Testing Document Upload")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        # Check if test PDF exists
        if os.path.exists(TEST_PDF_PATH):
            log_info(f"Uploading: {TEST_PDF_PATH}")
            
            with open(TEST_PDF_PATH, "rb") as f:
                response = requests.post(
                    f"{self.base_url}/upload",
                    files={"file": (os.path.basename(TEST_PDF_PATH), f, "application/pdf")},
                    data={"chat_id": self.chat_id}
                )
        else:
            # Create a simple test PDF
            log_info("Test PDF not found. Uploading sample text instead.")
            
            sample_text = """
            LEGAL SERVICES AGREEMENT
            
            This Legal Services Agreement ("Agreement") is entered into as of January 1, 2025.
            
            PARTIES:
            1. Client: John Doe
            2. Attorney: Jane Smith, Esq.
            
            SCOPE OF SERVICES:
            The Attorney agrees to provide legal consultation services related to contract review
            and business formation matters.
            
            FEES:
            The Client agrees to pay $300 per hour for all legal services rendered.
            A retainer of $5,000 is due upon signing this Agreement.
            
            CONFIDENTIALITY:
            All information shared between the parties shall remain strictly confidential.
            
            TERMINATION:
            Either party may terminate this Agreement with 30 days written notice.
            
            GOVERNING LAW:
            This Agreement shall be governed by the laws of the State of California.
            """
            
            response = requests.post(
                f"{self.base_url}/upload/text",
                data={
                    "chat_id": self.chat_id,
                    "text": sample_text,
                    "source_name": "Sample Legal Agreement"
                }
            )
        
        if response.status_code == 200:
            data = response.json()
            log_success(f"Document uploaded successfully!")
            log_info(f"Chunks created: {data.get('chunks', 'N/A')}")
            return True
        else:
            log_error(f"Failed to upload document: {response.text}")
            return False
    
    def test_ask_question(self, question: str = None) -> bool:
        """Test asking a question"""
        log_header("Testing RAG Query")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        question = question or "What are the key terms of this agreement?"
        log_info(f"Question: {question}")
        
        response = requests.post(
            f"{self.base_url}/ask",
            json={
                "chat_id": self.chat_id,
                "query": question,
                "use_context": True
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            log_success("Got answer!")
            print(f"\n{Colors.BOLD}Answer:{Colors.RESET}")
            print(f"   {data['answer'][:500]}...")
            
            if data.get("sources"):
                print(f"\n{Colors.BOLD}Sources:{Colors.RESET} Pages {data['sources']}")
            return True
        else:
            log_error(f"Failed to get answer: {response.text}")
            return False
    
    def test_chat_history(self) -> bool:
        """Test retrieving chat history"""
        log_header("Testing Chat History")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        response = requests.get(f"{self.base_url}/chats/{self.chat_id}")
        
        if response.status_code == 200:
            data = response.json()
            messages = data.get("messages", [])
            log_success(f"Retrieved {len(messages)} messages")
            
            for msg in messages[-4:]:  # Show last 4 messages
                role = "🧑 User" if msg["role"] == "user" else "🤖 Assistant"
                content = msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"]
                print(f"   {role}: {content}")
            return True
        else:
            log_error(f"Failed to get chat history: {response.text}")
            return False
    
    def test_update_chat(self) -> bool:
        """Test updating chat metadata"""
        log_header("Testing Chat Update")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        # Update title and template
        response = requests.patch(
            f"{self.base_url}/chats/{self.chat_id}",
            json={
                "title": "Updated Legal Analysis",
                "prompt_template": "contract_reviewer"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            log_success("Chat updated successfully!")
            log_info(f"New title: {data['title']}")
            log_info(f"New template: {data['prompt_template']}")
            return True
        else:
            log_error(f"Failed to update chat: {response.text}")
            return False
    
    def test_ask_with_new_template(self) -> bool:
        """Test asking with the new template"""
        log_header("Testing Query with New Template")
        
        return self.test_ask_question("What potential risks or issues do you see in this document?")
    
    def test_get_documents(self) -> bool:
        """Test getting uploaded documents"""
        log_header("Testing Document Listing")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        response = requests.get(f"{self.base_url}/chats/{self.chat_id}/documents")
        
        if response.status_code == 200:
            data = response.json()
            docs = data.get("documents", [])
            log_success(f"Found {len(docs)} documents")
            log_info(f"Total vectors in Pinecone: {data.get('total_vectors', 0)}")
            
            for doc in docs:
                print(f"   - {doc['filename']} ({doc['num_chunks']} chunks)")
            return True
        else:
            log_error(f"Failed to get documents: {response.text}")
            return False
    
    def test_similarity_search(self) -> bool:
        """Test similarity search"""
        log_header("Testing Similarity Search")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        response = requests.post(
            f"{self.base_url}/search",
            params={
                "chat_id": self.chat_id,
                "query": "fees and payment terms",
                "top_k": 3
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            log_success(f"Found {len(results)} similar chunks")
            
            for i, r in enumerate(results, 1):
                content = r["content"][:100] + "..." if len(r["content"]) > 100 else r["content"]
                print(f"   {i}. (Page {r['page']}): {content}")
            return True
        else:
            log_error(f"Failed to search: {response.text}")
            return False
    
    def test_delete_chat(self) -> bool:
        """Test deleting a chat (deletes from MongoDB and Pinecone)"""
        log_header("Testing Chat Deletion")
        
        if not self.chat_id:
            log_error("No chat ID. Create a chat first.")
            return False
        
        # Ask for confirmation
        log_info(f"About to delete chat: {self.chat_id}")
        confirm = input("Delete this chat? (y/n): ").strip().lower()
        
        if confirm != 'y':
            log_info("Deletion cancelled")
            return True
        
        response = requests.delete(f"{self.base_url}/chats/{self.chat_id}")
        
        if response.status_code == 200:
            data = response.json()
            log_success(data.get("message", "Chat deleted"))
            self.chat_id = None
            return True
        else:
            log_error(f"Failed to delete chat: {response.text}")
            return False
    
    def run_full_test(self, delete_after: bool = False):
        """Run the complete test suite"""
        log_header("🦅 LEGALEAGLE RAG PIPELINE TEST SUITE 🦅")
        
        tests = [
            ("Health Check", self.test_health),
            ("List Templates", self.test_list_templates),
            ("Create Chat", self.test_create_chat),
            ("List Chats", self.test_list_chats),
            ("Upload Document", self.test_upload_document),
            ("Ask Question", self.test_ask_question),
            ("Chat History", self.test_chat_history),
            ("Update Chat", self.test_update_chat),
            ("Query with New Template", self.test_ask_with_new_template),
            ("Get Documents", self.test_get_documents),
            ("Similarity Search", self.test_similarity_search),
        ]
        
        if delete_after:
            tests.append(("Delete Chat", self.test_delete_chat))
        
        passed = 0
        failed = 0
        
        for name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                log_error(f"{name} raised exception: {e}")
                failed += 1
            
            time.sleep(1)  # Small delay between tests
        
        # Summary
        log_header("TEST SUMMARY")
        print(f"   {Colors.GREEN}Passed: {passed}{Colors.RESET}")
        print(f"   {Colors.RED}Failed: {failed}{Colors.RESET}")
        print(f"   Total: {passed + failed}")
        
        if self.chat_id:
            print(f"\n   {Colors.YELLOW}Chat ID for further testing: {self.chat_id}{Colors.RESET}")
        
        return failed == 0


def create_sample_pdf():
    """Create a sample PDF for testing (requires reportlab)"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        os.makedirs("data", exist_ok=True)
        pdf_path = "data/Resume.pdf"
        
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, "LEGAL SERVICES AGREEMENT")
        c.drawString(100, 700, "This is a sample legal document for testing.")
        c.drawString(100, 650, "Terms: The client agrees to pay $500/hour.")
        c.drawString(100, 600, "Confidentiality: All information is confidential.")
        c.drawString(100, 550, "Termination: 30 days written notice required.")
        c.save()
        
        print(f"Created sample PDF: {pdf_path}")
        return pdf_path
        
    except ImportError:
        print("reportlab not installed. Using text upload instead.")
        return None


if __name__ == "__main__":
    # Check if we should delete chat after test
    delete_after = "--delete" in sys.argv
    
    # Run tests
    tester = LegalEagleTest(BASE_URL)
    success = tester.run_full_test(delete_after=delete_after)
    
    sys.exit(0 if success else 1)

import os
import json
import logging
import asyncio
import re
from typing import Dict, List, Any, Optional
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ai_engine")

class AISentinel:
    """
    Main AI engine for the ERP knowledge chatbot.
    Handles natural language understanding, knowledge retrieval, and response generation.
    """
    
    def __init__(self, api_key: str = None, knowledge_base_path: str = None):
        """
        Initialize the AI Sentinel with OpenAI API key and knowledge base.
        
        Args:
            api_key: OpenAI API key
            knowledge_base_path: Path to the knowledge base JSON file
        """
        # Use provided API key or get from environment variable
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("No OpenAI API key provided. The AI engine will not function properly.")
        
        # Initialize OpenAI client
        openai.api_key = self.api_key
        
        # Load knowledge base
        self.knowledge_base_path = knowledge_base_path or "data/knowledge_base.json"
        self.knowledge_base = self._load_knowledge_base(self.knowledge_base_path)
        
        # Embedding cache for efficient similarity search
        self.embedding_cache = {}
        
    def _load_knowledge_base(self, path: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Load knowledge base from file or use default sample if none provided.
        
        Args:
            path: Path to the knowledge base JSON file
            
        Returns:
            List of knowledge items
        """
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(path or self.knowledge_base_path), exist_ok=True)
        
        try:
            with open(path or self.knowledge_base_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            logger.warning(f"Knowledge base file not found or invalid. Creating a sample knowledge base.")
            
            # Sample knowledge base with a few items
            sample_kb = [
                {
                    "id": 1,
                    "title": "Resetting ERP Password",
                    "content": "To reset your ERP password, navigate to the login page and click on 'Forgot Password'. Follow the instructions sent to your company email address. Passwords must be at least 8 characters long with a mix of uppercase, lowercase, numbers, and special characters.",
                    "category": "Authentication",
                    "tags": ["password", "login", "reset", "security"],
                    "embedding": None
                },
                {
                    "id": 2,
                    "title": "Generating Sales Reports",
                    "content": "To generate a sales report, go to the Reports module in the Sales dashboard. Select the report type, date range, and any filters you wish to apply. Click 'Generate' and the report will be prepared for viewing or download in your preferred format (PDF, Excel, CSV).",
                    "category": "Sales",
                    "tags": ["reports", "sales", "export", "analytics"],
                    "embedding": None
                },
                {
                    "id": 3,
                    "title": "Submitting Time Off Requests",
                    "content": "To submit a time off request, navigate to the HR module and select 'Time Off'. Click 'New Request', select the type of leave, enter the date range, and provide any necessary details. Submit for approval. Your manager will be notified and will approve or reject your request.",
                    "category": "HR",
                    "tags": ["time off", "leave", "vacation", "HR", "request"],
                    "embedding": None
                }
            ]
            
            # Save sample knowledge base
            with open(path or self.knowledge_base_path, 'w') as f:
                json.dump(sample_kb, f, indent=2)
                
            return sample_kb
            
    async def get_embedding(self, text: str) -> List[float]:
        """
        Get embedding vector for text using OpenAI's embedding API.
        Cache results to avoid redundant API calls.
        
        Args:
            text: The text to get embedding for
            
        Returns:
            Embedding vector as a list of floats
        """
        # Check cache first
        if text in self.embedding_cache:
            return self.embedding_cache[text]
        
        try:
            # Get embedding from OpenAI
            response = await openai.embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            
            embedding = response.data[0].embedding
            
            # Cache the result
            self.embedding_cache[text] = embedding
            
            return embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {str(e)}")
            # Return empty embedding in case of error
            return [0.0] * 1536  # Default embedding size for text-embedding-ada-002
    
    async def search_knowledge_base(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Search the knowledge base for relevant items using semantic search.
        
        Args:
            query: User's query
            top_k: Number of top results to return
            
        Returns:
            List of most relevant knowledge items
        """
        # Get embedding for the query
        query_embedding = await self.get_embedding(query)
        
        # Ensure all knowledge items have embeddings
        for item in self.knowledge_base:
            if not item.get("embedding"):
                item["embedding"] = await self.get_embedding(item["content"])
        
        # Calculate similarity scores
        def cosine_similarity(a, b):
            dot_product = sum(a_i * b_i for a_i, b_i in zip(a, b))
            magnitude_a = sum(a_i ** 2 for a_i in a) ** 0.5
            magnitude_b = sum(b_i ** 2 for b_i in b) ** 0.5
            if magnitude_a * magnitude_b == 0:
                return 0
            return dot_product / (magnitude_a * magnitude_b)
        
        # Score all items
        scored_items = [
            (item, cosine_similarity(query_embedding, item["embedding"]))
            for item in self.knowledge_base
        ]
        
        # Sort by score and take top_k
        scored_items.sort(key=lambda x: x[1], reverse=True)
        top_items = [item for item, score in scored_items[:top_k]]
        
        return top_items
    
    def extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text by removing stopwords.
        
        Args:
            text: Input text
            
        Returns:
            List of keywords
        """
        # Simple stopwords list (can be expanded)
        stopwords = {'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                    'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
                    'about', 'against', 'between', 'into', 'through', 'during', 'before',
                    'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over',
                    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
                    'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
                    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
                    'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
                    'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain',
                    'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 
                    'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
                    'won', 'wouldn', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 
                    'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he',
                    'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its',
                    'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
                    'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'have',
                    'has', 'had', 'do', 'does', 'did', 'doing', 'would', 'should', 'could',
                    'ought', 'get', 'gets', 'got', 'gotten'}
        
        # Tokenize and remove stopwords
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [word for word in words if word not in stopwords and len(word) > 1]
        
        return keywords
    
    async def process_query(self, query: str, user_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process user query and generate a response.
        
        Args:
            query: User's question or request
            user_info: User information for personalization
            
        Returns:
            Dict containing AI response and metadata
        """
        # Search knowledge base for relevant items
        relevant_items = await self.search_knowledge_base(query)
        
        # Extract relevant knowledge content
        knowledge_context = "\n\n".join([
            f"Title: {item['title']}\nContent: {item['content']}\nCategory: {item['category']}"
            for item in relevant_items
        ])
        
        # Create chat completion system prompt
        system_prompt = """
        You are AI Sentinel, an advanced AI assistant for IDMS Infotech's ERP system. 
        Your role is to help employees with their questions about using the ERP system.
        You should be professional, helpful, and concise in your responses.
        
        When answering:
        1. Base your answers strictly on the knowledge provided.
        2. If the information isn't in the knowledge base, politely say you don't have that information yet.
        3. Don't make up information not contained in the knowledge snippets.
        4. Recommend escalation to human support for complex issues not adequately covered in the knowledge base.
        5. Include specific steps and navigation paths when explaining processes.
        6. Use language appropriate for enterprise software support.
        
        Format your response as a JSON with the following fields:
        - answer: Your response to the user's question
        - shouldEscalate: true/false whether the query should be escalated to human support
        - relatedQuestions: 2-3 potential follow-up questions related to the user's query
        - category: The category of the question (e.g. "Authentication", "Sales", "HR")
        - confidence: A number between 0 and 1 indicating confidence in your answer
        - sourceKnowledgeIds: Array of IDs of the knowledge items you used in your answer
        """
        
        # Add personalization if user info provided
        user_context = ""
        if user_info:
            department = user_info.get('department', '')
            role = user_info.get('role', '')
            if department or role:
                user_context = f"\nThe user works in the {department} department and has the role of {role}. Tailor your response accordingly."
        
        try:
            # Call OpenAI chat completion API
            response = await openai.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {"role": "system", "content": system_prompt + user_context},
                    {"role": "user", "content": f"Question: {query}\n\nRelevant Knowledge:\n{knowledge_context}"}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            # Extract and parse the JSON response
            response_content = response.choices[0].message.content
            json_response = json.loads(response_content)
            
            # Add source knowledge item IDs
            source_ids = [item["id"] for item in relevant_items]
            if "sourceKnowledgeIds" not in json_response:
                json_response["sourceKnowledgeIds"] = source_ids
            
            return json_response
        
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            # Return fallback response
            return {
                "answer": "I'm sorry, but I encountered an error while processing your question. Please try again or contact support for assistance.",
                "shouldEscalate": True,
                "relatedQuestions": [],
                "category": "Error",
                "confidence": 0.0,
                "sourceKnowledgeIds": []
            }
    
    async def generate_knowledge_gaps(self, queries: List[str]) -> List[str]:
        """
        Analyze past queries to identify knowledge gaps that should be added to the knowledge base.
        
        Args:
            queries: List of past user queries
            
        Returns:
            List of suggested knowledge topics to add
        """
        # Combine queries into a single prompt for analysis
        query_list = "\n".join([f"- {query}" for query in queries])
        
        system_prompt = """
        You are an expert knowledge base curator for an enterprise ERP system support chatbot.
        Analyze the list of user queries and identify knowledge gaps that should be addressed.
        Focus on topics that are frequently asked but might not be well-covered in a typical knowledge base.
        
        Generate a list of 5-10 specific knowledge article topics that should be created to address these gaps.
        Each suggested topic should be specific enough to create a focused article (not too broad).
        """
        
        try:
            # Call OpenAI chat completion API
            response = await openai.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Here is a list of recent user queries to our ERP support chatbot:\n\n{query_list}\n\nWhat knowledge base articles should we create to fill gaps in our knowledge base?"}
                ],
                temperature=0.8,
            )
            
            # Extract and parse the response
            response_content = response.choices[0].message.content
            
            # Extract suggestions line by line, filtering out any lines that aren't actual suggestions
            lines = response_content.split('\n')
            suggestions = []
            
            for line in lines:
                line = line.strip()
                # Check if line looks like a list item
                if line.startswith('-') or line.startswith('•') or (len(line) > 2 and line[0].isdigit() and line[1] == '.'):
                    # Clean up the line
                    suggestion = line.lstrip('-•0123456789. ').strip()
                    if suggestion and len(suggestion) > 10:  # Ensure it's a meaningful suggestion
                        suggestions.append(suggestion)
            
            # If no suggestions were parsed, take the whole response
            if not suggestions and response_content.strip():
                suggestions = [response_content.strip()]
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating knowledge gaps: {str(e)}")
            # Return fallback suggestions
            return [
                "How to reset an ERP password",
                "Common ERP system error codes and their meanings",
                "Guide to generating custom reports in the reporting module"
            ]


# For testing purposes
if __name__ == "__main__":
    async def test():
        # Initialize the AI Sentinel
        sentinel = AISentinel()
        
        # Process a test query
        result = await sentinel.process_query("How do I reset my ERP password?")
        print(json.dumps(result, indent=2))
        
        # Generate knowledge gaps
        sample_queries = [
            "How do I reset my ERP password?",
            "Where can I find the sales tax report?",
            "How do I approve pending time off requests?",
            "The system is showing an error when I try to submit an invoice",
            "How do I export my team's attendance records?",
            "Can I customize my dashboard view?",
            "How do I link customer records to sales opportunities?",
            "What permission level do I need to create new user accounts?",
            "Is there a mobile app for the ERP system?",
            "How can I set up automated alerts for inventory levels?"
        ]
        
        gaps = await sentinel.generate_knowledge_gaps(sample_queries)
        print("\nSuggested Knowledge Gaps:")
        for i, gap in enumerate(gaps, 1):
            print(f"{i}. {gap}")
    
    # Run the test
    asyncio.run(test())
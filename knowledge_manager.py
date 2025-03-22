import os
import json
import logging
import asyncio
from typing import Dict, List, Any, Optional
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("knowledge_manager")

class KnowledgeManager:
    """
    Manages the knowledge base for the AI Sentinel.
    Handles CRUD operations for knowledge items and maintains embeddings.
    """
    
    def __init__(self, knowledge_base_path: str, api_key: str = None):
        """
        Initialize the knowledge manager.
        
        Args:
            knowledge_base_path: Path to the knowledge base JSON file
            api_key: OpenAI API key for embeddings
        """
        # Use provided API key or get from environment variable
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("No OpenAI API key provided. The knowledge manager will not function properly.")
        
        # Initialize OpenAI client
        openai.api_key = self.api_key
        
        # Knowledge base path
        self.knowledge_base_path = knowledge_base_path
        
        # Load knowledge base
        self.knowledge_base = self._load_knowledge_base()
        
        # Next ID for new items
        self.next_id = max([item["id"] for item in self.knowledge_base], default=0) + 1
        
    def _load_knowledge_base(self) -> List[Dict[str, Any]]:
        """
        Load knowledge base from file or create empty if not exists.
        
        Returns:
            List of knowledge items
        """
        os.makedirs(os.path.dirname(self.knowledge_base_path), exist_ok=True)
        
        try:
            with open(self.knowledge_base_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            logger.warning(f"Knowledge base file not found or invalid. Creating empty knowledge base.")
            return []
            
    def _save_knowledge_base(self):
        """Save the knowledge base to file."""
        with open(self.knowledge_base_path, 'w') as f:
            json.dump(self.knowledge_base, f, indent=2)
    
    async def get_embedding(self, text: str) -> List[float]:
        """
        Get embedding vector for text using OpenAI's embedding API.
        
        Args:
            text: The text to get embedding for
            
        Returns:
            Embedding vector as a list of floats
        """
        try:
            response = await openai.embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            
            embedding = response.data[0].embedding
            return embedding
        
        except Exception as e:
            logger.error(f"Error getting embedding: {str(e)}")
            # Return empty embedding in case of error
            return [0.0] * 1536  # Default embedding size for text-embedding-ada-002
    
    def get_all_items(self) -> List[Dict[str, Any]]:
        """
        Get all knowledge items.
        
        Returns:
            List of all knowledge items
        """
        # Return copies without the embedding vector to reduce response size
        return [{k: v for k, v in item.items() if k != 'embedding'} for item in self.knowledge_base]
    
    def get_item_by_id(self, item_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a knowledge item by ID.
        
        Args:
            item_id: ID of the knowledge item
            
        Returns:
            Knowledge item dict or None if not found
        """
        for item in self.knowledge_base:
            if item["id"] == item_id:
                # Return copy without embedding vector
                return {k: v for k, v in item.items() if k != 'embedding'}
        
        return None
    
    def get_items_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Get knowledge items by category.
        
        Args:
            category: Category to filter by
            
        Returns:
            List of matching knowledge items
        """
        matching = [item for item in self.knowledge_base if item["category"].lower() == category.lower()]
        
        # Return copies without embedding vector
        return [{k: v for k, v in item.items() if k != 'embedding'} for item in matching]
    
    def get_items_by_tags(self, tags: List[str]) -> List[Dict[str, Any]]:
        """
        Get knowledge items that have any of the given tags.
        
        Args:
            tags: List of tags to filter by
            
        Returns:
            List of matching knowledge items
        """
        # Convert tags to lowercase for case-insensitive matching
        lowercase_tags = [tag.lower() for tag in tags]
        
        # Find items with any matching tag
        matching = []
        for item in self.knowledge_base:
            item_tags = [tag.lower() for tag in item.get("tags", [])]
            if any(tag in item_tags for tag in lowercase_tags):
                matching.append(item)
        
        # Return copies without embedding vector
        return [{k: v for k, v in item.items() if k != 'embedding'} for item in matching]
    
    async def create_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new knowledge item.
        
        Args:
            item_data: Data for the new knowledge item
            
        Returns:
            Created knowledge item with ID
        """
        # Create new item with the next available ID
        new_item = {
            "id": self.next_id,
            "title": item_data["title"],
            "content": item_data["content"],
            "category": item_data["category"],
            "tags": item_data.get("tags", []),
            "embedding": None  # Will be generated below
        }
        
        # Generate embedding for the content
        new_item["embedding"] = await self.get_embedding(new_item["content"])
        
        # Add to knowledge base
        self.knowledge_base.append(new_item)
        
        # Increment next ID
        self.next_id += 1
        
        # Save knowledge base
        self._save_knowledge_base()
        
        # Return the new item (without embedding)
        return {k: v for k, v in new_item.items() if k != 'embedding'}
    
    async def update_item(self, item_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing knowledge item.
        
        Args:
            item_id: ID of the item to update
            updates: Fields to update
            
        Returns:
            Updated knowledge item or None if not found
        """
        # Find the item
        for i, item in enumerate(self.knowledge_base):
            if item["id"] == item_id:
                # Update fields
                for key, value in updates.items():
                    if key in ["title", "content", "category", "tags"]:
                        item[key] = value
                
                # If content was updated, regenerate embedding
                if "content" in updates:
                    item["embedding"] = await self.get_embedding(item["content"])
                
                # Save knowledge base
                self._save_knowledge_base()
                
                # Return updated item (without embedding)
                return {k: v for k, v in item.items() if k != 'embedding'}
        
        # Item not found
        return None
    
    def delete_item(self, item_id: int) -> bool:
        """
        Delete a knowledge item.
        
        Args:
            item_id: ID of the item to delete
            
        Returns:
            True if deleted, False if not found
        """
        # Find the item
        for i, item in enumerate(self.knowledge_base):
            if item["id"] == item_id:
                # Remove from knowledge base
                self.knowledge_base.pop(i)
                
                # Save knowledge base
                self._save_knowledge_base()
                
                return True
        
        # Item not found
        return False
    
    async def bulk_update_embeddings(self) -> int:
        """
        Update embeddings for all knowledge items.
        Useful after migrating from another system.
        
        Returns:
            Number of updated items
        """
        count = 0
        
        for item in self.knowledge_base:
            # Generate new embedding
            item["embedding"] = await self.get_embedding(item["content"])
            count += 1
        
        # Save knowledge base
        self._save_knowledge_base()
        
        return count
    
    async def suggest_categories(self, text: str) -> List[str]:
        """
        Suggest categories for a new knowledge item based on its content.
        
        Args:
            text: The text to analyze
            
        Returns:
            List of suggested categories
        """
        # Get all existing categories
        all_categories = list(set(item["category"] for item in self.knowledge_base))
        
        # If we have no existing categories, return some common default ones
        if not all_categories:
            return ["Authentication", "Sales", "HR", "Finance", "IT Support", "General"]
        
        # Create a prompt for OpenAI
        categories_list = ", ".join(all_categories)
        prompt = f"""
        The following is content for a knowledge base article about an ERP system:
        
        {text}
        
        Based on this content, suggest which category it belongs to. Here are the existing categories:
        {categories_list}
        
        You can also suggest a new category if none of the existing ones fit well.
        Provide up to 3 category suggestions in order of relevance.
        """
        
        try:
            # Call OpenAI chat completion API
            response = await openai.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {"role": "system", "content": "You are a knowledge base curator who categorizes ERP documentation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=150
            )
            
            # Process the response to extract categories
            response_text = response.choices[0].message.content
            
            # Find category names (often they appear in quotes, brackets, or after colons)
            import re
            categories = []
            
            # Try to find format like "1. Category" or "- Category"
            list_items = re.findall(r'(?:^|\n)[1-3.\-\s]+([A-Za-z\s&]+)', response_text)
            if list_items:
                categories.extend(item.strip() for item in list_items)
            
            # Try to find categories in quotes
            quoted = re.findall(r'"([^"]+)"', response_text)
            if quoted:
                categories.extend(item.strip() for item in quoted)
            
            # Try to find after "Category:"
            after_category = re.findall(r'Category:?\s*([A-Za-z\s&]+)', response_text)
            if after_category:
                categories.extend(item.strip() for item in after_category)
            
            # Deduplicate and limit to 3
            unique_categories = []
            for cat in categories:
                cat = cat.strip()
                if cat and cat not in unique_categories:
                    unique_categories.append(cat)
            
            if unique_categories:
                return unique_categories[:3]
            
            # If no categories found, extract from the text directly
            return [line.strip() for line in response_text.split('\n') if line.strip()][:3]
        
        except Exception as e:
            logger.error(f"Error suggesting categories: {str(e)}")
            # Return some default categories
            return all_categories[:3] if len(all_categories) > 0 else ["General"]
    
    async def suggest_tags(self, text: str) -> List[str]:
        """
        Suggest tags for a new knowledge item based on its content.
        
        Args:
            text: The text to analyze
            
        Returns:
            List of suggested tags
        """
        # Create a prompt for OpenAI
        prompt = f"""
        The following is content for a knowledge base article about an ERP system:
        
        {text}
        
        Based on this content, suggest 3-5 tags that would help users find this article.
        Tags should be single words or short phrases that represent key concepts in the content.
        Provide tags in a comma-separated list.
        """
        
        try:
            # Call OpenAI chat completion API
            response = await openai.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {"role": "system", "content": "You are a knowledge base curator who tags ERP documentation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )
            
            # Extract tags from response
            response_text = response.choices[0].message.content
            
            # Try to split by commas first (most common format)
            if ',' in response_text:
                tags = [tag.strip().lower() for tag in response_text.split(',')]
            # If no commas, try to split by newlines
            elif '\n' in response_text:
                tags = [tag.strip().lower() for tag in response_text.split('\n')]
            # If all else fails, use the whole response as one tag
            else:
                tags = [response_text.strip().lower()]
            
            # Clean up tags
            clean_tags = []
            for tag in tags:
                # Remove any unwanted characters
                tag = tag.strip().strip('"\'.,;:()-')
                
                # Skip if too short
                if len(tag) < 2:
                    continue
                
                # Remove any "tag:" prefix
                if tag.startswith('tag:'):
                    tag = tag[4:].strip()
                
                clean_tags.append(tag)
            
            return clean_tags
        
        except Exception as e:
            logger.error(f"Error suggesting tags: {str(e)}")
            # Extract keywords from the text as fallback
            words = text.lower().split()
            # Remove common stop words
            stop_words = {'the', 'and', 'is', 'in', 'to', 'of', 'for', 'a', 'with', 'on', 'by'}
            keywords = [word for word in words if word not in stop_words and len(word) > 3]
            
            # Count and sort by frequency
            from collections import Counter
            counts = Counter(keywords)
            most_common = [word for word, _ in counts.most_common(5)]
            
            return most_common


# For testing purposes
if __name__ == "__main__":
    async def test():
        # Initialize with a temporary knowledge base path
        knowledge_manager = KnowledgeManager("data/test_knowledge_base.json")
        
        # Create test item
        item_data = {
            "title": "How to Generate Financial Reports",
            "content": "To generate financial reports in the ERP system, navigate to the Finance module and select 'Reports'. Choose the report type (Balance Sheet, Income Statement, Cash Flow, etc.) and set your date range. Apply any filters needed and click 'Generate'. You can export the report in PDF, Excel, or CSV format.",
            "category": "Finance",
            "tags": ["reports", "finance", "export"]
        }
        
        new_item = await knowledge_manager.create_item(item_data)
        print("Created item:", new_item)
        
        # Test get all items
        all_items = knowledge_manager.get_all_items()
        print(f"\nAll items ({len(all_items)}):")
        for item in all_items:
            print(f"- {item['id']}: {item['title']} ({item['category']})")
        
        # Test suggest categories
        text = "This article explains how to set up automated notifications for low inventory levels. When stock falls below the defined threshold, the system will alert the purchasing department via email."
        categories = await knowledge_manager.suggest_categories(text)
        print(f"\nSuggested categories for inventory text: {categories}")
        
        # Test suggest tags
        tags = await knowledge_manager.suggest_tags(text)
        print(f"\nSuggested tags for inventory text: {tags}")
    
    # Run the test
    asyncio.run(test())
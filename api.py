import os
import logging
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import uvicorn

# Load environment variables from .env file
load_dotenv()

# Import our AI components
from ai_engine import AISentinel
from knowledge_manager import KnowledgeManager

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("api")

# Create the FastAPI app
app = FastAPI(
    title="AI Sentinel API",
    description="API for the AI Sentinel of Knowledge Bot for IDMS Infotech's ERP System",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure paths
KNOWLEDGE_BASE_PATH = os.environ.get("KNOWLEDGE_BASE_PATH", "data/knowledge_base.json")

# Data models
class QueryRequest(BaseModel):
    query: str
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    shouldEscalate: bool
    relatedQuestions: List[str]
    category: str
    confidence: float
    sourceKnowledgeIds: List[int]

class KnowledgeGapsRequest(BaseModel):
    queries: List[str] = Field(..., min_items=1)

class KnowledgeGapsResponse(BaseModel):
    suggestions: List[str]

class KnowledgeItem(BaseModel):
    title: str
    content: str
    category: str
    tags: List[str] = []

# Dependency to get AI engine singleton
async def get_ai_engine():
    # We could add caching here in the future
    return AISentinel(knowledge_base_path=KNOWLEDGE_BASE_PATH)

# Dependency to get knowledge manager singleton
async def get_knowledge_manager():
    # We could add caching here in the future
    return KnowledgeManager(knowledge_base_path=KNOWLEDGE_BASE_PATH)

@app.get("/")
async def root():
    return {"message": "AI Sentinel API is running", "version": "1.0.0"}

@app.post("/api/query", response_model=QueryResponse)
async def process_query(request: QueryRequest, ai: AISentinel = Depends(get_ai_engine)):
    """
    Process a natural language query about the ERP system.
    """
    try:
        # Convert to user info dict
        user_info = {
            "user_id": request.user_id,
            "session_id": request.session_id,
            "department": request.department,
            "role": request.role
        }
        
        # Process the query
        response = await ai.process_query(request.query, user_info)
        return response
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.post("/api/knowledge-gaps", response_model=KnowledgeGapsResponse)
async def generate_knowledge_gaps(request: KnowledgeGapsRequest, ai: AISentinel = Depends(get_ai_engine)):
    """
    Analyze past queries to identify knowledge gaps.
    """
    try:
        suggestions = await ai.generate_knowledge_gaps(request.queries)
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Error generating knowledge gaps: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating knowledge gaps: {str(e)}")

@app.get("/api/knowledge")
async def get_knowledge_items(km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Get all knowledge items
    """
    try:
        items = km.get_all_items()
        return items
        
    except Exception as e:
        logger.error(f"Error getting knowledge items: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting knowledge items: {str(e)}")

@app.get("/api/knowledge/{item_id}")
async def get_knowledge_item(item_id: int, km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Get a specific knowledge item by ID
    """
    try:
        item = km.get_item_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Knowledge item with ID {item_id} not found")
        return item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting knowledge item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting knowledge item: {str(e)}")

@app.post("/api/knowledge")
async def create_knowledge_item(item: KnowledgeItem, km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Create a new knowledge item
    """
    try:
        created_item = await km.create_item(item.model_dump())
        return created_item
        
    except Exception as e:
        logger.error(f"Error creating knowledge item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating knowledge item: {str(e)}")

@app.put("/api/knowledge/{item_id}")
async def update_knowledge_item(item_id: int, item: KnowledgeItem, km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Update an existing knowledge item
    """
    try:
        updated_item = await km.update_item(item_id, item.model_dump())
        if not updated_item:
            raise HTTPException(status_code=404, detail=f"Knowledge item with ID {item_id} not found")
        return updated_item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating knowledge item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating knowledge item: {str(e)}")

@app.delete("/api/knowledge/{item_id}")
async def delete_knowledge_item(item_id: int, km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Delete a knowledge item
    """
    try:
        success = km.delete_item(item_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Knowledge item with ID {item_id} not found")
        return {"message": f"Knowledge item with ID {item_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting knowledge item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting knowledge item: {str(e)}")

@app.post("/api/knowledge/suggest-categories")
async def suggest_categories(text: str = Body(..., embed=True), km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Suggest categories for a knowledge item
    """
    try:
        categories = await km.suggest_categories(text)
        return {"categories": categories}
        
    except Exception as e:
        logger.error(f"Error suggesting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error suggesting categories: {str(e)}")

@app.post("/api/knowledge/suggest-tags")
async def suggest_tags(text: str = Body(..., embed=True), km: KnowledgeManager = Depends(get_knowledge_manager)):
    """
    Suggest tags for a knowledge item
    """
    try:
        tags = await km.suggest_tags(text)
        return {"tags": tags}
        
    except Exception as e:
        logger.error(f"Error suggesting tags: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error suggesting tags: {str(e)}")

# Main entry point
if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.environ.get("API_PORT", 8000))
    
    # Run the FastAPI app
    logger.info(f"Starting AI Sentinel API on port {port}")
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True)
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    group_name: Optional[str] = None

class LLMConfigCreate(BaseModel):
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str

class LLMConfigUpdate(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: Optional[str] = None

class AICompanionRequest(BaseModel):
    action: str # explain, translate, background, extend, chat
    selected_text: str = ""
    context: str = ""
    user_message: str = ""
    book_id: int
    chapter_index: int

class SemanticMarkRequest(BaseModel):
    book_id: int
    chapter_index: int
    paragraph_indices: List[int]
    selected_text: str
    context: str = ""

class NoteCreate(BaseModel):
    book_id: int
    chapter_index: int
    original_text: Optional[str] = None
    content: str

class NoteUpdate(BaseModel):
    content: str

class NoteResponse(BaseModel):
    id: int
    book_id: int
    chapter_index: Optional[int]
    original_text: Optional[str]
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIChatHistoryResponse(BaseModel):
    id: int
    book_id: int
    chapter_index: Optional[int]
    action: str
    selected_text: Optional[str]
    user_message: Optional[str]
    ai_response: str
    created_at: datetime

    class Config:
        from_attributes = True

class MindMapCreate(BaseModel):
    book_id: int
    chapter_index: Optional[int] = None
    content: str

class MindMapUpdate(BaseModel):
    content: str

class MindMapResponse(BaseModel):
    id: int
    book_id: int
    chapter_index: Optional[int]
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

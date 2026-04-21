from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Conversation(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    title: str


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=20000)
    style: Optional[str] = "concise"  # concise | detailed | bullet


class SummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]
    word_count_original: int
    word_count_summary: int


class CodeReviewRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)
    language: Optional[str] = "auto"
    focus: Optional[str] = "all"  # all | bugs | security | performance | style


class CodeReviewResponse(BaseModel):
    language_detected: str
    overall_score: int  # 1-10
    overview: str
    issues: List[dict]
    suggestions: List[str]
    improved_snippet: Optional[str] = None

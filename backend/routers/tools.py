from fastapi import APIRouter, Depends, HTTPException
from models.chat import (
    SummarizeRequest, SummarizeResponse,
    CodeReviewRequest, CodeReviewResponse,
)
from routers.auth import get_current_user
from services.ai_service import summarize_text, review_code

router = APIRouter(prefix="/api/tools", tags=["AI Tools"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    body: SummarizeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Summarize a document or text with AI."""
    result = await summarize_text(body.text, body.style or "concise")
    return SummarizeResponse(**result)


@router.post("/code-review", response_model=CodeReviewResponse)
async def code_review(
    body: CodeReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """Get AI-powered code review."""
    result = await review_code(body.code, body.language or "auto", body.focus or "all")
    return CodeReviewResponse(**result)

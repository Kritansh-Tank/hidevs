import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json


class TestAIService:
    """Tests for AI service functions with mocked Groq client."""

    @pytest.mark.asyncio
    async def test_summarize_text_success(self):
        mock_response = MagicMock()
        mock_response.choices[0].message.content = json.dumps({
            "summary": "This is a concise summary.",
            "key_points": ["Point 1", "Point 2"]
        })

        with patch("services.ai_service.groq_client") as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            from services.ai_service import summarize_text
            result = await summarize_text("This is a long text that needs to be summarized.", "concise")

        assert "summary" in result
        assert "key_points" in result
        assert "word_count_original" in result
        assert result["word_count_original"] > 0

    @pytest.mark.asyncio
    async def test_summarize_text_fallback_on_json_error(self):
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "Not valid JSON"

        with patch("services.ai_service.groq_client") as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            from services.ai_service import summarize_text
            result = await summarize_text("Some text here.", "concise")

        # Should still return a result due to fallback
        assert "summary" in result
        assert "key_points" in result

    @pytest.mark.asyncio
    async def test_review_code_success(self):
        mock_response = MagicMock()
        mock_response.choices[0].message.content = json.dumps({
            "language_detected": "python",
            "overall_score": 7,
            "overview": "Generally good code with minor issues.",
            "issues": [
                {"severity": "low", "type": "style", "description": "Missing docstring", "line": "1"}
            ],
            "suggestions": ["Add docstrings", "Use type hints"],
            "improved_snippet": "def foo(x: int) -> int:\n    '''Returns x squared'''\n    return x * x"
        })

        with patch("services.ai_service.groq_client") as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            from services.ai_service import review_code
            result = await review_code("def foo(x):\n    return x * x", "python", "all")

        assert result["language_detected"] == "python"
        assert result["overall_score"] == 7
        assert len(result["issues"]) == 1
        assert len(result["suggestions"]) == 2

    @pytest.mark.asyncio
    async def test_review_code_on_api_failure(self):
        with patch("services.ai_service.groq_client") as mock_client:
            mock_client.chat.completions.create = AsyncMock(
                side_effect=Exception("API rate limit exceeded")
            )

            from services.ai_service import review_code
            result = await review_code("print('hello')", "python", "all")

        assert result["overall_score"] == 0
        assert "failed" in result["overview"].lower() or "error" in result["overview"].lower()

    @pytest.mark.asyncio
    async def test_generate_title(self):
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "Fix Python Sorting Bug"

        with patch("services.ai_service.groq_client") as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            from services.ai_service import generate_conversation_title
            title = await generate_conversation_title("How do I fix a sorting bug in Python?")

        assert title == "Fix Python Sorting Bug"

    @pytest.mark.asyncio
    async def test_generate_title_fallback_on_error(self):
        with patch("services.ai_service.groq_client") as mock_client:
            mock_client.chat.completions.create = AsyncMock(
                side_effect=Exception("Connection error")
            )

            from services.ai_service import generate_conversation_title
            title = await generate_conversation_title("This is a very long message that goes beyond forty characters")

        # Should fall back to truncated message
        assert len(title) <= 43  # 40 chars + "..."

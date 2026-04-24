import json
from typing import AsyncGenerator, List, Optional
from groq import AsyncGroq
from config import settings

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

CHAT_SYSTEM_PROMPT = """You are HiDevs AI Assistant — an expert developer productivity assistant.
You help developers with coding questions, debugging, architecture decisions, and best practices.
You are knowledgeable, concise, and practical. Use markdown formatting in your responses.
Always provide actionable advice. If you don't know something, say so honestly."""

SUMMARIZE_SYSTEM_PROMPT = """You are an expert summarization engine.
When given text, you produce:
1. A clear, concise summary paragraph
2. A JSON array of key points

Always respond in this exact JSON format:
{
  "summary": "...",
  "key_points": ["point1", "point2", ...]
}"""

CODE_REVIEW_SYSTEM_PROMPT = """You are an expert code reviewer with deep knowledge across all programming languages.
Analyze code for: bugs, security vulnerabilities, performance issues, and style problems.

Always respond in this exact JSON format:
{
  "language_detected": "...",
  "overall_score": <1-10>,
  "overview": "...",
  "issues": [
    {"severity": "high|medium|low", "type": "bug|security|performance|style", "description": "...", "line": "..."}
  ],
  "suggestions": ["suggestion1", "suggestion2"],
  "improved_snippet": "..."
}"""


async def stream_chat(
    messages: List[dict],
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream chat response from Groq."""
    all_messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    all_messages.extend(messages[-10:])  # Keep last 10 messages as context
    all_messages.append({"role": "user", "content": user_message})

    try:
        stream = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=all_messages,
            stream=True,
            max_tokens=2048,
            temperature=0.7,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content
    except Exception as e:
        yield f"\n\n⚠️ AI service error: {str(e)}. Please try again."


async def get_chat_response(messages: List[dict], user_message: str) -> str:
    """Non-streaming chat response."""
    all_messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    all_messages.extend(messages[-10:])
    all_messages.append({"role": "user", "content": user_message})

    try:
        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=all_messages,
            max_tokens=2048,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"⚠️ AI service temporarily unavailable: {str(e)}"


async def summarize_text(text: str, style: str = "concise") -> dict:
    """Summarize text with AI."""
    style_instruction = {
        "concise": "Keep the summary under 100 words.",
        "detailed": "Provide a comprehensive summary with full context.",
        "bullet": "Focus on extracting the most important bullet points.",
    }.get(style, "Keep the summary concise.")

    prompt = f"Summarize the following text. {style_instruction}\n\nText:\n{text}"

    try:
        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SUMMARIZE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1024,
            temperature=0.3,
        )
        content = response.choices[0].message.content or ""
        try:
            result = json.loads(content)
            return {
                "summary": result.get("summary", ""),
                "key_points": result.get("key_points", []),
                "word_count_original": len(text.split()),
                "word_count_summary": len(result.get("summary", "").split()),
            }
        except json.JSONDecodeError:
            return {
                "summary": content,
                "key_points": [],
                "word_count_original": len(text.split()),
                "word_count_summary": len(content.split()),
            }
    except Exception as e:
        return {
            "summary": f"Summarization failed: {str(e)}",
            "key_points": [],
            "word_count_original": len(text.split()),
            "word_count_summary": 0,
        }


async def review_code(code: str, language: str = "auto", focus: str = "all") -> dict:
    """AI code review."""
    focus_instruction = {
        "all": "Review for bugs, security, performance, and style.",
        "bugs": "Focus only on identifying bugs and logical errors.",
        "security": "Focus only on security vulnerabilities.",
        "performance": "Focus only on performance optimizations.",
        "style": "Focus only on code style and best practices.",
    }.get(focus, "Review for all issues.")

    prompt = f"Language: {language}\nFocus: {focus_instruction}\n\nCode:\n```\n{code}\n```"

    try:
        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": CODE_REVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.2,
        )
        content = response.choices[0].message.content or ""
        # Extract JSON from response (model may wrap it in markdown)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        try:
            result = json.loads(content)
            return {
                "language_detected": result.get("language_detected", language),
                "overall_score": result.get("overall_score", 5),
                "overview": result.get("overview", ""),
                "issues": result.get("issues", []),
                "suggestions": result.get("suggestions", []),
                "improved_snippet": result.get("improved_snippet"),
            }
        except json.JSONDecodeError:
            return {
                "language_detected": language,
                "overall_score": 5,
                "overview": content,
                "issues": [],
                "suggestions": [],
                "improved_snippet": None,
            }
    except Exception as e:
        return {
            "language_detected": language,
            "overall_score": 0,
            "overview": f"Code review failed: {str(e)}",
            "issues": [],
            "suggestions": [],
            "improved_snippet": None,
        }


async def generate_conversation_title(first_message: str) -> str:
    """Generate a short title for a conversation."""
    try:
        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Generate a short (3-6 word) conversation title based on the user's message. Return only the title, no quotes.",
                },
                {"role": "user", "content": first_message},
            ],
            max_tokens=20,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return first_message[:40] + "..." if len(first_message) > 40 else first_message

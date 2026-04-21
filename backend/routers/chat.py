from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from database import get_db
from models.chat import ChatRequest, ChatResponse
from routers.auth import get_current_user
from services.ai_service import stream_chat, get_chat_response, generate_conversation_title
from bson import ObjectId
from datetime import datetime
import asyncio

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/message")
async def send_message(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message and get streaming AI response."""
    db = get_db()
    user_id = str(current_user["_id"])

    # Load or create conversation
    conversation = None
    if body.conversation_id:
        try:
            conversation = await db.conversations.find_one({
                "_id": ObjectId(body.conversation_id),
                "user_id": user_id,
            })
        except Exception:
            pass

    existing_messages = conversation.get("messages", []) if conversation else []

    # Build message history for AI context
    history = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in existing_messages
    ]

    # Generate title for new conversations
    title = conversation["title"] if conversation else await generate_conversation_title(body.message)

    # Streaming response generator
    async def generate():
        full_reply = ""
        async for token in stream_chat(history, body.message):
            full_reply += token
            yield f"data: {token}\n\n"

        # Save to MongoDB after streaming completes
        new_user_msg = {
            "role": "user",
            "content": body.message,
            "timestamp": datetime.utcnow(),
        }
        new_ai_msg = {
            "role": "assistant",
            "content": full_reply,
            "timestamp": datetime.utcnow(),
        }

        if conversation:
            await db.conversations.update_one(
                {"_id": ObjectId(body.conversation_id)},
                {
                    "$push": {"messages": {"$each": [new_user_msg, new_ai_msg]}},
                    "$set": {"updated_at": datetime.utcnow()},
                },
            )
            conv_id = body.conversation_id
        else:
            result = await db.conversations.insert_one({
                "user_id": user_id,
                "title": title,
                "messages": [new_user_msg, new_ai_msg],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })
            conv_id = str(result.inserted_id)

        yield f"data: [DONE:{conv_id}:{title}]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    """Get all conversations for current user."""
    db = get_db()
    user_id = str(current_user["_id"])

    cursor = db.conversations.find(
        {"user_id": user_id},
        {"messages": 0},  # Exclude messages for list view
    ).sort("updated_at", -1).limit(50)

    conversations = []
    async for conv in cursor:
        conversations.append({
            "id": str(conv["_id"]),
            "title": conv.get("title", "Untitled"),
            "created_at": conv.get("created_at", datetime.utcnow()).isoformat(),
            "updated_at": conv.get("updated_at", datetime.utcnow()).isoformat(),
        })

    return {"conversations": conversations}


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single conversation with all messages."""
    db = get_db()
    user_id = str(current_user["_id"])

    try:
        conv = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": user_id,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {
        "id": str(conv["_id"]),
        "title": conv.get("title", "Untitled"),
        "messages": [
            {
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg.get("timestamp", datetime.utcnow()).isoformat(),
            }
            for msg in conv.get("messages", [])
        ],
        "created_at": conv.get("created_at", datetime.utcnow()).isoformat(),
    }


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a conversation."""
    db = get_db()
    user_id = str(current_user["_id"])

    try:
        result = await db.conversations.delete_one({
            "_id": ObjectId(conversation_id),
            "user_id": user_id,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Conversation deleted successfully"}

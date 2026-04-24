import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ReactMarkdown from 'react-markdown'
import api from '../services/api'
import { Send, Plus, Trash2, Bot, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string
}
interface Conversation {
    id: string
    title: string
    updated_at: string
}

const ChatPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConvId, setCurrentConvId] = useState<string | null>(searchParams.get('id'))
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    // Load conversation list
    const loadHistory = async () => {
        try {
            const { data } = await api.get('/chat/history')
            setConversations(data.conversations)
        } catch { }
    }

    // Load single conversation
    const loadConversation = async (id: string) => {
        try {
            const { data } = await api.get(`/chat/${id}`)
            setMessages(data.messages)
            setCurrentConvId(id)
            setSearchParams({ id })
        } catch {
            toast.error('Failed to load conversation')
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    useEffect(() => {
        const id = searchParams.get('id')
        if (id) loadConversation(id)
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, streaming])

    const sendMessage = async () => {
        if (!input.trim() || streaming) return
        const userMsg = input.trim()
        setInput('')
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
        setStreaming(true)

        let assistantContent = ''
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

        try {
            const token = localStorage.getItem('access_token')
            const baseUrl = import.meta.env.VITE_API_URL || 'https://hidevs.onrender.com/api'
            const response = await fetch(`${baseUrl}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: userMsg,
                    conversation_id: currentConvId || undefined,
                }),
            })

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) throw new Error('No reader')

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data.startsWith('[DONE:')) {
                            // Parse conversation id and title
                            const match = data.match(/\[DONE:(.+?):(.+)\]/)
                            if (match) {
                                const [, convId] = match
                                setCurrentConvId(convId)
                                setSearchParams({ id: convId })
                                await loadHistory()
                            }
                        } else {
                            assistantContent += data
                            setMessages((prev) => {
                                const updated = [...prev]
                                updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                                return updated
                            })
                        }
                    }
                }
            }
        } catch (err) {
            setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: '⚠️ Failed to get response. Please try again.',
                }
                return updated
            })
        } finally {
            setStreaming(false)
        }
    }

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await api.delete(`/chat/${id}`)
            setConversations((prev) => prev.filter((c) => c.id !== id))
            if (currentConvId === id) {
                setCurrentConvId(null)
                setMessages([])
                setSearchParams({})
            }
            toast.success('Conversation deleted')
        } catch {
            toast.error('Failed to delete')
        }
    }

    const newChat = () => {
        setCurrentConvId(null)
        setMessages([])
        setSearchParams({})
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="bg-gradient-animated min-h-screen">
            <Sidebar />
            <div className="main-content flex" style={{ height: '100vh' }}>
                {/* Chat sidebar */}
                <div style={{
                    width: 220, borderRight: '1px solid var(--border-glass)',
                    background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column',
                    padding: '16px 12px', overflowY: 'auto', gap: 8,
                }}>
                    <button id="new-chat-btn" onClick={newChat} className="btn-primary justify-center w-full" style={{ fontSize: 13, padding: '9px 16px' }}>
                        <Plus size={15} /> New Chat
                    </button>
                    <div style={{ marginTop: 8 }}>
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => loadConversation(conv.id)}
                                className={`p-2.5 rounded-lg cursor-pointer flex items-center gap-2 group mb-1 transition-all ${currentConvId === conv.id ? 'active' : ''}`}
                                style={{
                                    background: currentConvId === conv.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    color: currentConvId === conv.id ? 'var(--accent-violet)' : 'var(--text-secondary)',
                                    fontSize: 13,
                                }}
                            >
                                <Bot size={13} style={{ flexShrink: 0 }} />
                                <span className="flex-1 truncate">{conv.title}</span>
                                <button
                                    onClick={(e) => deleteConversation(conv.id, e)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f87171', padding: 2 }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {conversations.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
                                No conversations yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Main chat area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 glow-purple"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                                    <Bot size={32} color="white" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    AI Assistant
                                </h2>
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
                                    Ask me anything about code, debugging, architecture, best practices, or any developer topic.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                    {['Explain async/await in Python', 'How to optimize MongoDB queries?', 'Review my React component', 'Best practices for JWT auth'].map((prompt) => (
                                        <button key={prompt} onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                                            className="btn-secondary text-xs" style={{ padding: '7px 14px' }}>
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'var(--bg-card)',
                                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} style={{ color: 'var(--accent-violet)' }} />}
                                </div>
                                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai prose-dark'}
                                    style={{ maxWidth: '72%' }}>
                                    {msg.role === 'assistant' ? (
                                        <>
                                            <ReactMarkdown>{msg.content || ' '}</ReactMarkdown>
                                            {streaming && i === messages.length - 1 && msg.content === '' && (
                                                <div className="flex gap-1.5 items-center" style={{ padding: '4px 0' }}>
                                                    <div className="typing-dot" />
                                                    <div className="typing-dot" />
                                                    <div className="typing-dot" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border-glass)' }}>
                        <div style={{
                            display: 'flex', gap: 12, alignItems: 'flex-end',
                            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                            borderRadius: 14, padding: '12px 16px',
                        }}>
                            <textarea
                                id="chat-input"
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                                rows={1}
                                style={{
                                    flex: 1, background: 'none', border: 'none', outline: 'none',
                                    color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
                                    fontSize: 14, resize: 'none', maxHeight: 120,
                                }}
                                onInput={(e) => {
                                    const el = e.target as HTMLTextAreaElement
                                    el.style.height = 'auto'
                                    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                                }}
                            />
                            <button
                                id="chat-send-btn"
                                onClick={sendMessage}
                                disabled={!input.trim() || streaming}
                                style={{
                                    width: 36, height: 36, borderRadius: 9, border: 'none',
                                    background: input.trim() && !streaming
                                        ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.08)',
                                    cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', flexShrink: 0,
                                }}
                            >
                                {streaming
                                    ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                                    : <Send size={15} color={input.trim() ? 'white' : '#475569'} />
                                }
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                            Powered by Groq · openai/gpt-oss-20b
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatPage

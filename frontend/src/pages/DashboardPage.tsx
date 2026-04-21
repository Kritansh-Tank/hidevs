import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { MessageSquare, FileText, Code2, Clock, Zap, ArrowRight } from 'lucide-react'

const DashboardPage = () => {
    const { user } = useAuth()
    const [recentChats, setRecentChats] = useState<any[]>([])
    const [loadingChats, setLoadingChats] = useState(true)

    useEffect(() => {
        api.get('/chat/history')
            .then(({ data }) => setRecentChats(data.conversations.slice(0, 5)))
            .catch(() => { })
            .finally(() => setLoadingChats(false))
    }, [])

    const tools = [
        {
            to: '/chat',
            icon: MessageSquare,
            label: 'AI Chat',
            desc: 'Multi-turn conversations with streaming AI responses',
            gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            glow: 'rgba(124, 58, 237, 0.3)',
        },
        {
            to: '/summarize',
            icon: FileText,
            label: 'Summarizer',
            desc: 'Condense long documents into key insights instantly',
            gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            glow: 'rgba(6, 182, 212, 0.3)',
        },
        {
            to: '/code-review',
            icon: Code2,
            label: 'Code Review',
            desc: 'Get AI-powered code analysis and improvement suggestions',
            gradient: 'linear-gradient(135deg, #059669, #10b981)',
            glow: 'rgba(16, 185, 129, 0.3)',
        },
    ]

    return (
        <div className="bg-gradient-animated min-h-screen">
            <Sidebar />
            <div className="main-content p-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                        <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Your AI-powered developer workspace is ready.
                    </p>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {tools.map(({ to, icon: Icon, label, desc, gradient, glow }) => (
                        <Link
                            key={to}
                            to={to}
                            className="glass-card p-6 block group hover:scale-[1.02] transition-all duration-200"
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-shadow duration-200"
                                style={{ background: gradient, boxShadow: `0 4px 20px ${glow}` }}>
                                <Icon size={22} color="white" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"
                                style={{ color: 'var(--text-primary)' }}>
                                {label}
                                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--accent-violet)' }} />
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                        </Link>
                    ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Chats', value: recentChats.length, icon: MessageSquare },
                        { label: 'AI Model', value: 'GPT-OSS 20B', icon: Zap },
                        { label: 'Database', value: 'MongoDB Atlas', icon: Clock },
                        { label: 'Status', value: '✅ Online', icon: Zap },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="stat-card">
                            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Recent conversations */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Recent Conversations
                        </h2>
                        <Link to="/chat" className="text-sm" style={{ color: 'var(--accent-violet)' }}>
                            View all →
                        </Link>
                    </div>

                    {loadingChats ? (
                        <div className="glass-card p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                            <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-2" />
                            Loading chats...
                        </div>
                    ) : recentChats.length === 0 ? (
                        <div className="glass-card p-8 text-center">
                            <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>No conversations yet.</p>
                            <Link to="/chat">
                                <button className="btn-primary mt-4">Start a Chat</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {recentChats.map((conv) => (
                                <Link
                                    key={conv.id}
                                    to={`/chat?id=${conv.id}`}
                                    className="glass-card p-4 flex items-center gap-3 hover:border-violet-500/30 transition-colors"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                                        <MessageSquare size={14} style={{ color: 'var(--accent-violet)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {conv.title}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {new Date(conv.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DashboardPage

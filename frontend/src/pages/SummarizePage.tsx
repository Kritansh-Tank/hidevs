import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { FileText, Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface SummarizeResult {
    summary: string
    key_points: string[]
    word_count_original: number
    word_count_summary: number
}

const SummarizePage = () => {
    const [text, setText] = useState('')
    const [style, setStyle] = useState<'concise' | 'detailed' | 'bullet'>('concise')
    const [result, setResult] = useState<SummarizeResult | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSummarize = async () => {
        if (!text.trim()) { toast.error('Please enter some text to summarize'); return }
        if (text.length < 10) { toast.error('Text too short'); return }
        setLoading(true)
        setResult(null)
        try {
            const { data } = await api.post('/tools/summarize', { text, style })
            setResult(data)
            toast.success('Summary generated!')
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Summarization failed')
        } finally {
            setLoading(false)
        }
    }

    const compressionRatio = result
        ? Math.round((1 - result.word_count_summary / result.word_count_original) * 100)
        : 0

    return (
        <div className="bg-gradient-animated min-h-screen">
            <Sidebar />
            <div className="main-content p-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
                            <FileText size={20} color="white" />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            AI Summarizer
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Paste any text and get a concise AI-powered summary with key points extracted.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input panel */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                Input Text
                            </label>
                            <div className="relative">
                                <select
                                    id="summarize-style"
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value as any)}
                                    style={{
                                        background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                                        color: 'var(--text-secondary)', borderRadius: 8, padding: '5px 28px 5px 10px',
                                        fontSize: 12, outline: 'none', cursor: 'pointer', appearance: 'none',
                                    }}
                                >
                                    <option value="concise">Concise</option>
                                    <option value="detailed">Detailed</option>
                                    <option value="bullet">Bullet Points</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-2.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        <textarea
                            id="summarize-input"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste your article, document, or any text here... (minimum 10 characters)"
                            style={{
                                width: '100%', minHeight: 280, background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-glass)', borderRadius: 10, padding: 14,
                                color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontSize: 14,
                                resize: 'vertical', outline: 'none', lineHeight: 1.6,
                                boxSizing: 'border-box',
                            }}
                        />
                        <div className="flex items-center justify-between mt-4">
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                {text.split(/\s+/).filter(Boolean).length} words
                            </span>
                            <button
                                id="summarize-btn"
                                onClick={handleSummarize}
                                className="btn-primary"
                                disabled={loading || !text.trim()}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                {loading ? 'Summarizing...' : 'Summarize'}
                            </button>
                        </div>
                    </div>

                    {/* Result panel */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                            Summary Output
                        </h3>

                        {!result && !loading && (
                            <div className="flex flex-col items-center justify-center h-64"
                                style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                <FileText size={40} className="mb-3" style={{ opacity: 0.3 }} />
                                <p className="text-sm">Your summary will appear here</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="flex gap-1.5 mb-4">
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI is summarizing...</p>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="animate-fade-in flex flex-col gap-5">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Original', value: result.word_count_original + ' words' },
                                        { label: 'Summary', value: result.word_count_summary + ' words' },
                                        { label: 'Compression', value: compressionRatio + '%' },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{
                                            background: 'var(--bg-glass)', borderRadius: 10, padding: '10px 12px',
                                            border: '1px solid var(--border-glass)', textAlign: 'center',
                                        }}>
                                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--accent-violet)' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary */}
                                <div>
                                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SUMMARY</p>
                                    <p style={{
                                        color: 'var(--text-primary)', lineHeight: 1.7, fontSize: 14,
                                        background: 'rgba(139, 92, 246, 0.06)', borderRadius: 10, padding: 14,
                                        border: '1px solid rgba(139, 92, 246, 0.15)',
                                    }}>
                                        {result.summary}
                                    </p>
                                </div>

                                {/* Key points */}
                                {result.key_points.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>KEY POINTS</p>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {result.key_points.map((point, i) => (
                                                <li key={i} className="flex items-start gap-2" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                    <span style={{ color: 'var(--accent-cyan)', marginTop: 2, flexShrink: 0 }}>◆</span>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SummarizePage

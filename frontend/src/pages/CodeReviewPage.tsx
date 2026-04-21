import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { Code2, Loader2, ChevronDown, Shield, Zap, Palette, Bug } from 'lucide-react'
import toast from 'react-hot-toast'

interface Issue {
    severity: 'high' | 'medium' | 'low'
    type: 'bug' | 'security' | 'performance' | 'style'
    description: string
    line?: string
}

interface ReviewResult {
    language_detected: string
    overall_score: number
    overview: string
    issues: Issue[]
    suggestions: string[]
    improved_snippet?: string
}

const LANGUAGES = ['auto', 'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c', 'c++', 'sql', 'bash']
const FOCUS_OPTIONS = ['all', 'bugs', 'security', 'performance', 'style']

const scoreColor = (s: number) => {
    if (s >= 8) return '#4ade80'
    if (s >= 6) return '#facc15'
    if (s >= 4) return '#fb923c'
    return '#f87171'
}

const typeIcon = (type: string) => {
    const map: Record<string, any> = { bug: Bug, security: Shield, performance: Zap, style: Palette }
    const Icon = map[type] || Code2
    return <Icon size={12} />
}

const CodeReviewPage = () => {
    const [code, setCode] = useState('')
    const [language, setLanguage] = useState('auto')
    const [focus, setFocus] = useState('all')
    const [result, setResult] = useState<ReviewResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [showImproved, setShowImproved] = useState(false)

    const handleReview = async () => {
        if (!code.trim()) { toast.error('Please paste some code to review'); return }
        setLoading(true)
        setResult(null)
        setShowImproved(false)
        try {
            const { data } = await api.post('/tools/code-review', { code, language, focus })
            setResult(data)
            toast.success('Code review complete!')
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Code review failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gradient-animated min-h-screen">
            <Sidebar />
            <div className="main-content p-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                            <Code2 size={20} color="white" />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            AI Code Reviewer
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Get expert AI-powered code analysis: bugs, security, performance, and style recommendations.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-4 mb-5 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Language</label>
                        <select
                            id="cr-language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{
                                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                                color: 'var(--text-secondary)', borderRadius: 8, padding: '6px 12px',
                                fontSize: 13, outline: 'none', cursor: 'pointer',
                            }}
                        >
                            {LANGUAGES.map((l) => <option key={l} value={l}>{l === 'auto' ? '🔍 Auto-detect' : l}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Focus</label>
                        <select
                            id="cr-focus"
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            style={{
                                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                                color: 'var(--text-secondary)', borderRadius: 8, padding: '6px 12px',
                                fontSize: 13, outline: 'none', cursor: 'pointer',
                            }}
                        >
                            {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                        </select>
                    </div>
                    <button
                        id="code-review-btn"
                        onClick={handleReview}
                        className="btn-primary"
                        disabled={loading || !code.trim()}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
                        {loading ? 'Reviewing...' : 'Review Code'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Code input */}
                    <div className="glass-card p-6">
                        <label className="text-sm font-semibold mb-3 block" style={{ color: 'var(--text-primary)' }}>
                            Code Input
                        </label>
                        <textarea
                            id="code-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={`// Paste your code here...\n\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    ...`}
                            style={{
                                width: '100%', minHeight: 350, background: '#0d0d14',
                                border: '1px solid var(--border-glass)', borderRadius: 10,
                                padding: 16, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 13, resize: 'vertical', outline: 'none', lineHeight: 1.7,
                                boxSizing: 'border-box',
                            }}
                        />
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
                            {code.split('\n').length} lines · {code.split(/\s+/).filter(Boolean).length} tokens
                        </p>
                    </div>

                    {/* Results */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                            Review Results
                        </h3>

                        {!result && !loading && (
                            <div className="flex flex-col items-center justify-center h-64"
                                style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                <Code2 size={40} className="mb-3" style={{ opacity: 0.3 }} />
                                <p className="text-sm">AI review will appear here</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="flex gap-1.5 mb-4">
                                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Analyzing code...</p>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="animate-fade-in flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: 500 }}>
                                {/* Score + language */}
                                <div className="flex items-center gap-4">
                                    <div className="score-badge" style={{
                                        background: `${scoreColor(result.overall_score)}18`,
                                        border: `2px solid ${scoreColor(result.overall_score)}`,
                                        color: scoreColor(result.overall_score),
                                    }}>
                                        {result.overall_score}
                                    </div>
                                    <div>
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Score: {result.overall_score}/10
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                            Language: {result.language_detected}
                                        </p>
                                    </div>
                                </div>

                                {/* Overview */}
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {result.overview}
                                </div>

                                {/* Issues */}
                                {result.issues.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                                            ISSUES FOUND ({result.issues.length})
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {result.issues.map((issue, i) => (
                                                <div key={i} style={{
                                                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                                                    borderRadius: 8, padding: '10px 12px',
                                                }}>
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`tag tag-${issue.severity}`}>{issue.severity}</span>
                                                        <span className={`tag tag-${issue.type}`}>
                                                            {typeIcon(issue.type)} {issue.type}
                                                        </span>
                                                        {issue.line && (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>line {issue.line}</span>
                                                        )}
                                                    </div>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
                                                        {issue.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {result.suggestions.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                                            SUGGESTIONS
                                        </p>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {result.suggestions.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                                    <span style={{ color: '#4ade80', marginTop: 1, flexShrink: 0 }}>✓</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Improved snippet */}
                                {result.improved_snippet && (
                                    <div>
                                        <button
                                            onClick={() => setShowImproved(!showImproved)}
                                            className="flex items-center gap-2 text-xs font-semibold mb-2"
                                            style={{ color: 'var(--accent-violet)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <ChevronDown size={14} style={{ transform: showImproved ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                                            {showImproved ? 'Hide' : 'Show'} Improved Code
                                        </button>
                                        {showImproved && (
                                            <pre style={{
                                                background: '#0d0d14', border: '1px solid var(--border-glass)',
                                                borderRadius: 10, padding: 16, overflow: 'auto', fontSize: 12,
                                                color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', margin: 0,
                                            }}>
                                                {result.improved_snippet}
                                            </pre>
                                        )}
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

export default CodeReviewPage

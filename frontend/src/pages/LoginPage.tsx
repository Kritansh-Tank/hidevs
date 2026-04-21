import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(email, password)
            toast.success('Welcome back!')
            navigate('/dashboard')
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gradient-animated flex items-center justify-center min-h-screen p-4">
            {/* Background orbs */}
            <div className="fixed top-0 left-0 w-96 h-96 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div className="fixed bottom-0 right-0 w-96 h-96 rounded-full opacity-8"
                style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(80px)', pointerEvents: 'none' }} />

            <div className="glass-card w-full max-w-md p-8 animate-fade-in glow-purple relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 glow-purple"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                        <Zap size={28} color="white" />
                    </div>
                    <h1 className="text-2xl font-bold gradient-text">HiDevs AI Hub</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Your AI-powered developer workspace
                    </p>
                </div>

                <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
                    Sign in
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                        <input
                            id="login-email"
                            className="input-dark"
                            style={{ paddingLeft: '2.5rem' }}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                        <input
                            id="login-password"
                            className="input-dark"
                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                            type={showPwd ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-3.5" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button id="login-submit" type="submit" className="btn-primary justify-center mt-2" disabled={loading}>
                        {loading ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : null}
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium" style={{ color: 'var(--accent-violet)' }}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage

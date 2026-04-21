import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Bot, LayoutDashboard, MessageSquare, FileText, Code2, LogOut, Zap
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
    { to: '/summarize', icon: FileText, label: 'Summarizer' },
    { to: '/code-review', icon: Code2, label: 'Code Review' },
]

const Sidebar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="sidebar">
            {/* Logo */}
            <div
                className="flex items-center gap-3 mb-8 cursor-pointer"
                onClick={() => navigate('/dashboard')}
            >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-purple"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                    <Zap size={18} color="white" />
                </div>
                <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>HiDevs</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Hub</p>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-1 flex-1">
                <p className="text-xs font-semibold mb-2 px-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    TOOLS
                </p>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={17} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white' }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="nav-item w-full"
                    style={{ color: '#f87171' }}
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default Sidebar

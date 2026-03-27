import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLandmark, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            if (email === 'admin@museum.com' && password === 'admin123') {
                localStorage.setItem('museumAdminToken', 'demo-jwt-token');
                navigate('/admin/dashboard');
            } else {
                setError('Invalid credentials. Use admin@museum.com / admin123');
            }
            setLoading(false);
        }, 1000);
    }

    return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FaLandmark className="text-navy text-3xl" />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-soft-white">Admin Portal</h1>
                    <p className="text-lgray-dark text-sm mt-1">MuseumPass Management System</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8">
                    <h2 className="text-xl font-heading font-bold text-soft-white mb-6 text-center">
                        Sign In
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-sm text-lgray mb-1.5 block">Email</label>
                            <div className="relative">
                                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lgray-dark text-sm" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@museum.com"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-soft-white placeholder-lgray-dark focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-lgray mb-1.5 block">Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lgray-dark text-sm" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-soft-white placeholder-lgray-dark focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lgray-dark hover:text-gold transition-colors cursor-pointer"
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-gold w-full flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                        <p className="text-[11px] text-lgray-dark">
                            Demo credentials: <span className="text-gold">admin@museum.com</span> / <span className="text-gold">admin123</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

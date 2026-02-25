import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const data = await api.login(username, password);
        login(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/admin' : '/student');
      } else {
        await api.register(username, password, role);
        setIsLogin(true);
        alert('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-xl p-8 border border-black/5"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif italic mb-2">Abscuss</h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest">
            {isLogin ? 'Welcome Back' : 'Join the Academy'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

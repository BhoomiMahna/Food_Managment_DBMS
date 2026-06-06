import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 fade-in">
      <div className="max-w-md w-full glass p-10 shadow-2xl border-white/5 space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">Smart <span className="text-emerald-500">Supply</span></h1>
            <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-[0.2em]">Login to your account</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                required
                className="input-premium w-full"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                className="input-premium w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4 mt-8"
          >
            Login
          </button>
        </form>

        <div className="text-center pt-4 border-t border-white/5">
            <Link to="/signup" className="text-[10px] font-black text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                Create new account
            </Link>
        </div>
      </div>
    </div>
  );
}

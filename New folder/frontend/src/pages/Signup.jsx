import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'FARMER',
    name: '',
    city: '',
    state: '',
    contact: ''
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(formData);
      navigate('/login');
    } catch (error) {
      alert('Signup failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 fade-in">
      <div className="max-w-xl w-full glass p-10 shadow-2xl border-white/5 space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">Signup</h1>
            <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-[0.2em]">Join the Supply Network</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name / Business</label>
                <input
                  type="text"
                  required
                  className="input-premium w-full"
                  placeholder="Official Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-premium w-full"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  required
                  className="input-premium w-full"
                  placeholder="Secure Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Role</label>
                <select
                  className="input-premium w-full"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="FARMER">Farmer</option>
                  <option value="WHOLESALER">Wholesaler</option>
                  <option value="RETAILER">Retailer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">City</label>
                  <input
                    type="text"
                    className="input-premium w-full"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">State</label>
                  <input
                    type="text"
                    className="input-premium w-full"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact No</label>
                <input
                  type="text"
                  className="input-premium w-full"
                  placeholder="+1..."
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4 mt-8"
          >
            Create Account
          </button>
        </form>

        <div className="text-center pt-4 border-t border-white/5">
            <Link to="/login" className="text-[10px] font-black text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                Already have an account? Login
            </Link>
        </div>
      </div>
    </div>
  );
}

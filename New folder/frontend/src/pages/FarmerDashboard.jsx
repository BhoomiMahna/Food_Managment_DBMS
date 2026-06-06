import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StockTable from '../components/StockTable';
import AlertsPanel from '../components/AlertsPanel';


export default function FarmerDashboard() {
    const { user, logout } = useAuth();
    const [production, setProduction] = useState([]);
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        crop_id: '',
        quantity_kg: '',
        harvest_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        price_per_kg: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const pRes = await axios.get('http://localhost:5000/farmer/production');
            setProduction(pRes.data);
            const cRes = await axios.get('http://localhost:5000/crops');
            setCrops(cRes.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/farmer/add-production', formData);
            alert('Production added successfully!');
            setFormData({
                crop_id: '',
                quantity_kg: '',
                harvest_date: new Date().toISOString().split('T')[0],
                expiry_date: '',
                price_per_kg: ''
            });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen p-8 fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center glass p-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Farmer Dashboard</h1>
                        <p className="text-slate-500 font-medium italic">Welcome back, <span className="text-emerald-400">{user.name}</span></p>
                    </div>
                    <button onClick={logout} className="btn-secondary border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white">
                        Logout
                    </button>
                </div>

                <AlertsPanel />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Production Form */}
                    <div className="lg:col-span-1 glass p-8 space-y-8 h-fit">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">New Entry</h2>
                            <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-wider">Fill in your latest crop data</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Crop Type</label>
                                <select 
                                    className="input-premium w-full bg-slate-900 shadow-inner"
                                    value={formData.crop_id}
                                    onChange={(e) => setFormData({...formData, crop_id: e.target.value})}
                                    required
                                >
                                    <option value="">-- Select Crop --</option>
                                    {crops.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.category})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity (kg)</label>
                                    <input 
                                        type="number" 
                                        className="input-premium w-full"
                                        placeholder="0"
                                        value={formData.quantity_kg}
                                        onChange={(e) => setFormData({...formData, quantity_kg: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price / kg</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="input-premium w-full"
                                        placeholder="$"
                                        value={formData.price_per_kg}
                                        onChange={(e) => setFormData({...formData, price_per_kg: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Harvest Date</label>
                                <input 
                                    type="date" 
                                    className="input-premium w-full block"
                                    value={formData.harvest_date}
                                    onChange={(e) => setFormData({...formData, harvest_date: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</label>
                                <input 
                                    type="date" 
                                    className="input-premium w-full block"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full py-4 text-xs">
                                Register Data
                            </button>
                        </form>
                    </div>

                    {/* Inventory Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass p-8 min-h-[600px]">
                            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Current Inventory</h2>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Manage your registered crops</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Batches</span>
                                    <p className="text-2xl font-black text-emerald-500 font-mono leading-none">{production.length}</p>
                                </div>
                            </div>
                            <StockTable data={production} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

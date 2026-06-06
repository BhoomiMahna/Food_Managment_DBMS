import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StockTable from '../components/StockTable';
import PurchaseModal from '../components/PurchaseModal';
import AlertsPanel from '../components/AlertsPanel';


export default function RetailerDashboard() {
    const { user, logout } = useAuth();
    const [wholesalerStock, setWholesalerStock] = useState([]);
    const [myStock, setMyStock] = useState([]);
    const [cities, setCities] = useState([]);
    const [cityFilter, setCityFilter] = useState('');
    const [activeTab, setActiveTab] = useState('market'); 
    const [discountOnly, setDiscountOnly] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchData = async () => {
        try {
            const wRes = await axios.get(`http://localhost:5000/retailer/wholesalers${cityFilter ? `?city=${cityFilter}` : ''}`);
            setWholesalerStock(wRes.data);
            const myRes = await axios.get('http://localhost:5000/retailer/stock');
            setMyStock(myRes.data);
            const citiesRes = await axios.get('http://localhost:5000/cities');
            setCities(citiesRes.data.filter(c => c.source === 'wholesaler'));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [cityFilter]);

    const handleActionClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleConfirmPurchase = async (qty, markup) => {
        try {
            await axios.post('http://localhost:5000/retailer/buy', {
                wholesaler_stock_id: selectedItem.id, 
                quantity: parseFloat(qty),
                selling_price: parseFloat(markup)
            });
            setIsModalOpen(false);
            alert('Purchase successful!');
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    const filterData = (data) => {
        if (!discountOnly) return data;
        return data.filter(item => {
            const originalPrice = parseFloat(item.original_price || item.price_per_kg || item.selling_price_per_kg || item.purchase_price_per_kg || 0);
            const currentPrice = parseFloat(item.discounted_price || originalPrice);
            return currentPrice < originalPrice;
        });
    };

    return (
        <>
        <div className="min-h-screen p-8 fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center glass p-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Retailer Dashboard</h1>
                        <p className="text-slate-500 font-medium">Welcome back, <span className="text-emerald-400">{user.name}</span></p>
                    </div>
                    <button onClick={logout} className="btn-secondary px-8 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white">
                        Logout
                    </button>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 glass p-6">
                    <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setActiveTab('market')}
                            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'market' ? 'bg-emerald-500 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-200'}`}
                        >
                            Wholesale Market
                        </button>
                        <button 
                            onClick={() => setActiveTab('inventory')}
                            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'inventory' ? 'bg-emerald-500 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-200'}`}
                        >
                            My Inventory
                        </button>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button 
                            onClick={() => setDiscountOnly(!discountOnly)}
                            className={`px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${discountOnly ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            {discountOnly ? '✓ Discounts Only' : 'Show Discounts'}
                        </button>

                        {activeTab === 'market' && (
                            <select 
                                className="input-premium py-2 text-xs min-w-[220px]"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                            >
                                <option value="">Filter by City (All)</option>
                                {[...new Set(cities.map(c => c.city))].map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <AlertsPanel />

                {/* Content */}
                <div className="glass p-8 min-h-[500px]">
                    <div className="mb-8 border-b border-white/5 pb-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                            {activeTab === 'market' ? 'Available Stock' : 'Your Inventory'}
                        </h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Live shipments from regional wholesalers</p>
                    </div>
                    
                    {activeTab === 'market' ? (
                        <StockTable 
                            data={filterData(wholesalerStock)} 
                            onAction={handleActionClick} 
                            isRetailerMarketView={true} 
                        />
                    ) : (
                        <StockTable data={filterData(myStock)} />
                    )}
                </div>
            </div>
        </div>
            {selectedItem && (
                <PurchaseModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    item={selectedItem} 
                    onConfirm={handleConfirmPurchase}
                    role="RETAILER"
                />
            )}
        </>
    );
}

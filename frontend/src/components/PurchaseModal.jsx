import React, { useState } from 'react';

export default function PurchaseModal({ isOpen, onClose, item, onConfirm, role }) {
    const [quantity, setQuantity] = useState('');
    const [markupPrice, setMarkupPrice] = useState('');

    if (!isOpen) return null;

    const maxQty = item.remaining_quantity || item.quantity_kg || 0;
    const currentPrice = item.discounted_price || item.price_per_kg || item.selling_price_per_kg;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (parseFloat(quantity) > maxQty) {
            alert('Quantity exceeds available stock');
            return;
        }
        onConfirm(quantity, markupPrice);
        setQuantity('');
        setMarkupPrice('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 fade-in">
            <div className="glass w-full max-w-md p-8 shadow-2xl border-white/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-2">Purchase {item.crop_name}</h2>
                <p className="text-slate-400 text-sm mb-6">
                    Buying from <span className="text-emerald-400">{item.farmer_name || item.wholesaler_name}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity (Max: {maxQty}kg)</label>
                        <input 
                            type="number" 
                            className="input-premium w-full"
                            placeholder="Amount to buy..."
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            max={maxQty}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {role === 'WHOLESALER' ? 'Your Selling Price / kg' : 'Your Retail Price / kg'}
                        </label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="input-premium w-full"
                            placeholder="Set your selling price..."
                            value={markupPrice}
                            onChange={(e) => setMarkupPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5 mt-6">
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-slate-500">Unit Price:</span>
                            <span className="text-white font-mono">${parseFloat(currentPrice).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-slate-500 font-bold">Total Cost:</span>
                            <span className="text-emerald-400 text-xl font-black font-mono">
                                ${((parseFloat(quantity) || 0) * parseFloat(currentPrice)).toFixed(2)}
                            </span>
                        </div>

                        <button type="submit" className="btn-primary w-full py-4 text-lg shadow-emerald-500/20">
                            Confirm Purchase
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import React, { useState } from 'react';

export default function StockTable({ data, onAction, isWholesalerView, isRetailerMarketView }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle numeric values
        if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        } else {
            aVal = (aVal || '').toString().toLowerCase();
            bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="overflow-hidden glass-card mt-4 border border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-500 uppercase bg-white/[0.02] border-b border-white/5">
                        <tr>
                            <th onClick={() => requestSort('crop_name')} className="px-6 py-5 font-bold tracking-widest cursor-pointer hover:text-emerald-400 transition-colors">
                                Crop {getSortIcon('crop_name')}
                            </th>
                            {(isWholesalerView || isRetailerMarketView) && (
                                <>
                                    <th onClick={() => requestSort(isWholesalerView ? 'farmer_name' : 'wholesaler_name')} className="px-6 py-5 font-bold tracking-widest cursor-pointer hover:text-emerald-400 transition-colors">
                                        {isWholesalerView ? 'Farmer' : 'Wholesaler'} {getSortIcon(isWholesalerView ? 'farmer_name' : 'wholesaler_name')}
                                    </th>
                                    <th onClick={() => requestSort('city')} className="px-6 py-5 font-bold tracking-widest cursor-pointer hover:text-emerald-400 transition-colors">
                                        City {getSortIcon('city')}
                                    </th>
                                </>
                            )}
                            <th onClick={() => requestSort('remaining_quantity')} className="px-6 py-5 font-bold tracking-widest text-center cursor-pointer hover:text-emerald-400 transition-colors">
                                Qty (kg) {getSortIcon('remaining_quantity')}
                            </th>
                            <th onClick={() => requestSort('expiry_date')} className="px-6 py-5 font-bold tracking-widest cursor-pointer hover:text-emerald-400 transition-colors">
                                Expiry {getSortIcon('expiry_date')}
                            </th>
                            <th onClick={() => requestSort('status')} className="px-6 py-5 font-bold tracking-widest cursor-pointer hover:text-emerald-400 transition-colors">
                                Status {getSortIcon('status')}
                            </th>
                            <th onClick={() => requestSort('discounted_price')} className="px-6 py-5 font-bold tracking-widest text-right cursor-pointer hover:text-emerald-400 transition-colors">
                                Price / kg {getSortIcon('discounted_price')}
                            </th>
                            {onAction && <th className="px-6 py-5 font-bold tracking-widest text-center">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedData.map((item, idx) => {
                            const statusLabel = item.status || 'Fresh';
                            const isExpired = statusLabel.toUpperCase().includes('EXPIRED');
                            const isNearExpiry = statusLabel.toUpperCase().includes('NEAR') || statusLabel.toUpperCase().includes('MATURING');
                            
                            const originalPrice = parseFloat(item.original_price || item.price_per_kg || item.selling_price_per_kg || item.purchase_price_per_kg || 0);
                            const currentPrice = parseFloat(item.discounted_price || originalPrice);
                            const hasDiscount = currentPrice > 0 && currentPrice < originalPrice;

                            const expiryDate = item.expiry_date ? new Date(item.expiry_date).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric'
                            }) : 'N/A';

                            return (
                                <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-6 font-bold text-white group-hover:text-emerald-400 transition-colors">
                                        {item.crop_name}
                                    </td>
                                    
                                    {(isWholesalerView || isRetailerMarketView) && (
                                        <>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-100 font-semibold">
                                                        {item.farmer_name || item.wholesaler_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        ID: #{item.farmer_id || item.wholesaler_id || item.id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-slate-400 font-medium">
                                                {item.city || 'N/A'}
                                            </td>
                                        </>
                                    )}

                                    <td className="px-6 py-6 text-center font-mono text-slate-200">
                                        {(item.quantity_kg || 0).toLocaleString()}
                                    </td>

                                    <td className="px-6 py-6 text-slate-400 text-xs font-medium">
                                        {expiryDate}
                                    </td>
                                    
                                    <td className="px-6 py-6">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                            isExpired ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                            isNearExpiry ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            {hasDiscount && (
                                                <span className="text-slate-600 line-through text-[9px] font-bold">
                                                    ${originalPrice.toFixed(2)}
                                                </span>
                                            )}
                                            <span className={`font-black font-mono ${hasDiscount ? 'text-emerald-400 text-base' : 'text-slate-100'}`}>
                                                ${currentPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    </td>

                                    {onAction && (
                                        <td className="px-6 py-6 text-center">
                                            <button 
                                                onClick={() => onAction(item)}
                                                disabled={isExpired}
                                                className="btn-primary"
                                            >
                                                Purchase
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <div className="px-6 py-20 text-center text-slate-600 font-medium uppercase tracking-[0.2em] text-[10px]">
                    No Active Data Records Found
                </div>
            )}
        </div>
    );
}

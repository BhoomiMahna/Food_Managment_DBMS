import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { logout } = useAuth();
    const [prices, setPrices] = useState([]);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/price-comparison');
            setPrices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Price Comparison (Min Prices)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Crop</th>
                                        <th className="px-6 py-3">Farmer Price</th>
                                        <th className="px-6 py-3">Wholesaler Price</th>
                                        <th className="px-6 py-3">Retail Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prices.map((p, idx) => (
                                        <tr key={idx} className="bg-white border-b">
                                            <td className="px-6 py-4 font-medium text-gray-900">{p.crop_name}</td>
                                            <td className="px-6 py-4">${p.min_farmer_price || '-'}</td>
                                            <td className="px-6 py-4">${p.min_wholesaler_price || '-'}</td>
                                            <td className="px-6 py-4">${p.min_retail_price || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

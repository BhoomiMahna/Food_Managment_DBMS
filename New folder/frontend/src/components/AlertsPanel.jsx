import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AlertsPanel() {
    const [alerts, setAlerts] = useState([]);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/alerts');
            setAlerts(res.data);
        } catch (err) {
            console.error('Error fetching alerts:', err);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Set up polling to get real-time alerts
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="glass p-6 space-y-4 border border-emerald-500/20 mb-8 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Recent Activity</h2>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-white/[0.02] border border-white/5 rounded text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold mr-2">
                            {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {alert.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

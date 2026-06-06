import React, { useEffect, useState } from 'react';
import { Network, TrendingUp, AlertTriangle, Activity, PackageCheck, Users, ShieldAlert, Award, Zap } from 'lucide-react';
import GraphVisualization from './GraphVisualization';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-2">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AIDashboard = () => {
    const [bottlenecks, setBottlenecks] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        // Fetch AI insights from our new ML microservice
        const fetchInsights = async () => {
            try {
                // Fetch bottlenecks
                const botRes = await fetch('http://localhost:8000/api/ml/bottlenecks');
                if (botRes.ok) setBottlenecks(await botRes.json());

                // Fetch anomalies
                const anomRes = await fetch('http://localhost:8000/api/ml/anomalies');
                if (anomRes.ok) setAnomalies(await anomRes.json());

                // For demo, fetch recommendations for Retailer ID 1
                const recRes = await fetch('http://localhost:8000/api/ml/recommend-supplier/1');
                if (recRes.ok) setRecommendations(await recRes.json());
            } catch (error) {
                console.error("Error fetching AI Insights:", error);
            }
        };
        fetchInsights();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white font-sans">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    AI Intelligence Center
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Supply Chain Insights powered by Graph Neural Networks</p>
            </header>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Inventory Health" value="92%" subtitle="+5% from last week" icon={Activity} colorClass="bg-emerald-500" />
                <StatCard title="Supply Chain Risk" value="Low" subtitle="Stable predictions" icon={ShieldAlert} colorClass="bg-blue-500" />
                <StatCard title="Top Farmers" value="12" subtitle="Highly reliable" icon={Award} colorClass="bg-amber-500" />
                <StatCard title="Most Sold" value="Tomatoes" subtitle="High demand forecast" icon={TrendingUp} colorClass="bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Graph Visualization (Spans 2 columns) */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                    <div className="flex items-center mb-6">
                        <Network className="w-6 h-6 mr-3 text-cyan-400" />
                        <h2 className="text-2xl font-bold">Supply Chain Network</h2>
                    </div>
                    <GraphVisualization />
                </div>

                {/* AI Alerts & Recommendations */}
                <div className="space-y-6">
                    {/* Recommendations */}
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-6 rounded-3xl">
                        <div className="flex items-center mb-4">
                            <Zap className="w-5 h-5 mr-3 text-yellow-400" />
                            <h3 className="text-xl font-semibold">Smart Sourcing</h3>
                        </div>
                        <div className="space-y-4">
                            {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                                <div key={idx} className="bg-black/30 p-4 rounded-xl border border-white/5 hover:border-indigo-400/50 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-lg">Wholesaler W{rec.wholesaler_id}</span>
                                        <span className="text-emerald-400 font-mono bg-emerald-400/10 px-2 py-1 rounded text-sm">{rec.confidence}% Match</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{rec.reason}</p>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-sm">No recommendations available.</p>
                            )}
                        </div>
                    </div>

                    {/* Bottlenecks */}
                    <div className="bg-gradient-to-br from-rose-900/30 to-red-900/30 border border-rose-500/30 p-6 rounded-3xl">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-5 h-5 mr-3 text-rose-400" />
                            <h3 className="text-xl font-semibold">Risk & Bottlenecks</h3>
                        </div>
                        <div className="space-y-4">
                            {bottlenecks.length > 0 ? bottlenecks.map((bot, idx) => (
                                <div key={idx} className="bg-black/30 p-4 rounded-xl border border-rose-500/20 border-l-4 border-l-rose-500">
                                    <h4 className="font-bold text-white mb-1">{bot.critical_node}</h4>
                                    <p className="text-sm text-gray-300">{bot.reason}</p>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-sm flex items-center"><Activity className="w-4 h-4 mr-2 text-emerald-400"/> No current bottlenecks detected.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Anomaly Detection */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                <div className="flex items-center mb-6">
                    <ShieldAlert className="w-6 h-6 mr-3 text-amber-400" />
                    <h2 className="text-2xl font-bold">Anomaly Detection</h2>
                </div>
                {anomalies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {anomalies.map((anom, idx) => (
                            <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                                <h4 className="font-bold text-amber-400 text-lg mb-2">{anom.entity}</h4>
                                <p className="text-white font-medium mb-1">{anom.alert}</p>
                                <p className="text-sm text-gray-400">{anom.details}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-emerald-400 flex items-center">
                        <PackageCheck className="w-5 h-5 mr-3" />
                        All systems normal. No suspicious supply chain behavior detected.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDashboard;

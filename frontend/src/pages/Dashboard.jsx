import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
    HiOutlineCurrencyDollar,
    HiOutlineShoppingCart,
    HiOutlineCube,
    HiOutlineExclamation,
    HiOutlineTrendingUp,
} from 'react-icons/hi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await dashboardAPI.getData();
                setData(res.data.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                // Set mock data for demo
                setData({
                    todaySales: 45280,
                    todayTransactions: 12,
                    monthSales: 1250000,
                    totalProducts: 8,
                    lowStockCount: 2,
                    averageYield: 64.5,
                    weeklyRevenue: {
                        'Mon': 38000, 'Tue': 42000, 'Wed': 35000, 'Thu': 48000,
                        'Fri': 55000, 'Sat': 62000, 'Sun': 45280
                    },
                    stockSummary: [
                        { productName: 'Raw Paddy', productType: 'SAHAL', quantity: 5000, minQuantity: 500, lowStock: false },
                        { productName: 'Sahal 5kg', productType: 'SAHAL', quantity: 28, minQuantity: 30, lowStock: true },
                        { productName: 'Kudu', productType: 'KUDU', quantity: 1500, minQuantity: 200, lowStock: false },
                    ],
                    recentBatches: [
                        { batchId: 'BATCH-20260420-001', veeInput: 2000, sahalOutput: 1320, yieldPercentage: 66.0, efficiency: 'EFFICIENT', date: '2026-04-20' },
                        { batchId: 'BATCH-20260419-001', veeInput: 1500, sahalOutput: 930, yieldPercentage: 62.0, efficiency: 'INEFFICIENT', date: '2026-04-19' },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner" />
            </div>
        );
    }

    const chartData = data?.weeklyRevenue
        ? Object.entries(data.weeklyRevenue).map(([day, revenue]) => ({ day, revenue }))
        : [];

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);

    const kpiCards = [
        { title: "Today's Sales", value: formatCurrency(data?.todaySales || 0), icon: HiOutlineCurrencyDollar, color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
        { title: 'Transactions', value: data?.todayTransactions || 0, icon: HiOutlineShoppingCart, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
        { title: 'Products', value: data?.totalProducts || 0, icon: HiOutlineCube, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
        { title: 'Low Stock Alerts', value: data?.lowStockCount || 0, icon: HiOutlineExclamation, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
        { title: 'Avg Yield', value: `${(data?.averageYield || 0).toFixed(1)}%`, icon: HiOutlineTrendingUp, color: data?.averageYield >= 64 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600', shadow: data?.averageYield >= 64 ? 'shadow-green-500/20' : 'shadow-red-500/20' },
    ];

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Welcome back! Here's your business overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map((card, idx) => (
                    <div key={idx} className="glass-card p-5 hover:scale-[1.02] transition-transform duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.title}</span>
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg flex items-center justify-center`}>
                                <card.icon className="text-white text-lg" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">7-Day Revenue Trend</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1f2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#f1f5f9',
                                }}
                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revenueGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Production Batches */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Batches</h2>
                    <div className="space-y-3">
                        {data?.recentBatches?.map((batch) => (
                            <div key={batch.batchId} className="p-4 rounded-xl bg-white/3 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white">{batch.batchId}</span>
                                    <span className={`badge ${batch.efficiency === 'EFFICIENT' ? 'badge-success' : 'badge-danger'}`}>
                                        {batch.efficiency}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                    <div>Input: <span className="text-white">{batch.veeInput} kg</span></div>
                                    <div>Output: <span className="text-white">{batch.sahalOutput} kg</span></div>
                                    <div>Yield: <span className={batch.yieldPercentage >= 64 ? 'text-green-400' : 'text-red-400'}>
                                        {batch.yieldPercentage}%
                                    </span></div>
                                    <div>Date: <span className="text-white">{batch.date}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stock Summary */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Stock Summary</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Min Qty</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.stockSummary?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="font-medium text-white">{item.productName}</td>
                                    <td><span className="badge badge-info">{item.productType}</span></td>
                                    <td>{item.quantity.toLocaleString()} kg</td>
                                    <td>{item.minQuantity.toLocaleString()} kg</td>
                                    <td>
                                        <span className={`badge ${item.lowStock ? 'badge-danger' : 'badge-success'}`}>
                                            {item.lowStock ? 'LOW STOCK' : 'IN STOCK'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

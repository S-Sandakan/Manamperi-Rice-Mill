import { useState } from 'react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState('daily');
    const [data, setData] = useState([]);
    const [profitData, setProfitData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadReport = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sales') {
                const res = await reportsAPI.salesReport({ from, to, period });
                setData(res.data);
            } else if (activeTab === 'purchases') {
                const res = await reportsAPI.purchaseReport({ from, to });
                setData(res.data);
            } else if (activeTab === 'profit') {
                const res = await reportsAPI.profitReport({ from, to });
                setProfitData(res.data);
            }
        } catch (err) {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'sales', label: 'Sales Report' },
        { id: 'purchases', label: 'Purchase Report' },
        { id: 'profit', label: 'Profit Summary' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                <p className="text-gray-500 text-sm">Analytics and business reports</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setData([]); setProfitData(null); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-wrap items-end gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                {activeTab === 'sales' && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Period</label>
                        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                )}
                <button onClick={loadReport} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    {loading ? 'Loading...' : 'Generate Report'}
                </button>
            </div>

            {/* Sales Report */}
            {activeTab === 'sales' && data.length > 0 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => `Rs. ${Number(v).toLocaleString()}`} />
                                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50"><tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sales</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm">{row.period}</td>
                                        <td className="px-5 py-3 text-sm text-right">{row.total_sales}</td>
                                        <td className="px-5 py-3 text-sm text-right font-semibold text-green-600">Rs. {Number(row.revenue).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Purchase Report */}
            {activeTab === 'purchases' && data.length > 0 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Purchase Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                                <Line type="monotone" dataKey="total_weight" stroke="#f59e0b" strokeWidth={2} name="Weight (kg)" />
                                <Line type="monotone" dataKey="total_cost" stroke="#ef4444" strokeWidth={2} name="Cost (Rs.)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50"><tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Purchases</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Weight</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm">{row.date}</td>
                                        <td className="px-5 py-3 text-sm text-right">{row.purchases}</td>
                                        <td className="px-5 py-3 text-sm text-right">{Number(row.total_weight).toLocaleString()} kg</td>
                                        <td className="px-5 py-3 text-sm text-right font-semibold text-red-600">Rs. {Number(row.total_cost).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Profit Report */}
            {activeTab === 'profit' && profitData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Revenue Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={[
                                    { name: 'Rice Sales', value: profitData.rice_sales_revenue },
                                    { name: 'Bran Sales', value: profitData.bran_sales_revenue },
                                ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {[0, 1].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => `Rs. ${Number(v).toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-800">Profit Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm text-gray-600">Rice Sales Revenue</span>
                                <span className="font-semibold text-green-600">Rs. {Number(profitData.rice_sales_revenue).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm text-gray-600">Bran Sales Revenue</span>
                                <span className="font-semibold text-blue-600">Rs. {Number(profitData.bran_sales_revenue).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Total Revenue</span>
                                <span className="font-bold text-gray-800">Rs. {Number(profitData.total_revenue).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                                <span className="text-sm text-gray-600">Paddy Purchase Cost</span>
                                <span className="font-semibold text-red-600">Rs. {Number(profitData.paddy_purchase_cost).toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between p-4 rounded-lg ${profitData.gross_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <span className="font-bold text-gray-800">Gross Profit</span>
                                <span className={`text-xl font-bold ${profitData.gross_profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    Rs. {Number(profitData.gross_profit).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loading && data.length === 0 && !profitData && (
                <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-400">Select date range and click "Generate Report" to view data</p>
                </div>
            )}
        </div>
    );
};

export default Reports;

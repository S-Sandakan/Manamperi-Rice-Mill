import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    HiOutlineArrowDownTray,
    HiOutlineBanknotes,
    HiOutlineShoppingCart,
    HiOutlineTruck,
} from 'react-icons/hi2';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import StatsCard from '../components/StatsCard';

export default function Reports() {
    const [daily, setDaily] = useState([]);
    const [monthly, setMonthly] = useState([]);
    const [profit, setProfit] = useState(null);
    const [activeTab, setActiveTab] = useState('daily');
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const [dailyRes, monthlyRes, profitRes] = await Promise.all([
                api.get('/reports/daily/'),
                api.get('/reports/monthly/'),
                api.get('/reports/profit/'),
            ]);
            setDaily(dailyRes.data);
            setMonthly(monthlyRes.data);
            setProfit(profitRes.data);
        } catch { toast.error('Failed to load reports'); }
        finally { setLoading(false); }
    };

    const fmt = (v) => `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

    const exportExcel = async () => {
        try {
            const response = await api.get('/reports/export/sales/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Sales_Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report downloaded');
        } catch {
            toast.error('Export failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Reports</h1>
                    <p className="text-dark-400 text-sm">Sales, purchases & profit analytics</p>
                </div>
                <button onClick={exportExcel} className="btn-secondary flex items-center gap-2" id="export-excel">
                    <HiOutlineArrowDownTray className="w-4 h-4" /> Export Excel
                </button>
            </div>

            {/* Profit Summary */}
            {profit && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <StatsCard title="Rice Sales" value={fmt(profit.rice_sales)} icon={HiOutlineShoppingCart} color="emerald" />
                    <StatsCard title="Bran Sales" value={fmt(profit.bran_sales)} icon={HiOutlineBanknotes} color="amber" />
                    <StatsCard title="Paddy Cost" value={fmt(profit.paddy_cost)} icon={HiOutlineTruck} color="rose" />
                    <StatsCard
                        title="Gross Profit"
                        value={fmt(profit.gross_profit)}
                        subtitle={profit.period}
                        icon={HiOutlineBanknotes}
                        color={profit.gross_profit >= 0 ? 'emerald' : 'rose'}
                    />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {[
                    { key: 'daily', label: 'Daily Sales' },
                    { key: 'monthly', label: 'Monthly Sales' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === key
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-white text-dark-500 border border-dark-200 hover:border-primary-300'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Charts */}
            <div className="glass-card p-6">
                {activeTab === 'daily' && (
                    <>
                        <h2 className="text-lg font-bold text-dark-800 mb-4">Daily Sales — Last 30 Days</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(v) => [fmt(v), 'Revenue']}
                                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Revenue" />
                                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Transactions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </>
                )}

                {activeTab === 'monthly' && (
                    <>
                        <h2 className="text-lg font-bold text-dark-800 mb-4">Monthly Sales — Last 12 Months</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(v) => [fmt(v), 'Revenue']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3}
                                    dot={{ r: 5, fill: '#f59e0b' }} name="Revenue" />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2}
                                    dot={{ r: 4, fill: '#3b82f6' }} name="Transactions" />
                            </LineChart>
                        </ResponsiveContainer>
                    </>
                )}
            </div>

            {/* Data Table */}
            <div className="glass-card p-5 mt-5">
                <h2 className="text-lg font-bold text-dark-800 mb-4">
                    {activeTab === 'daily' ? 'Daily Breakdown' : 'Monthly Breakdown'}
                </h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{activeTab === 'daily' ? 'Date' : 'Month'}</th>
                                <th>Transactions</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === 'daily' ? daily : monthly).map((row, idx) => (
                                <tr key={idx}>
                                    <td className="font-semibold">{row.day || row.month}</td>
                                    <td><span className="badge-info">{row.count}</span></td>
                                    <td className="font-semibold">{fmt(row.total)}</td>
                                </tr>
                            ))}
                            {(activeTab === 'daily' ? daily : monthly).length === 0 && (
                                <tr><td colSpan={3} className="text-center py-8 text-dark-400">No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

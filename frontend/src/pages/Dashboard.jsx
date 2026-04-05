import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import {
    HiOutlineBanknotes,
    HiOutlineShoppingCart,
    HiOutlineTruck,
    HiOutlineExclamationTriangle,
    HiOutlineCube,
    HiOutlineArchiveBox,
} from 'react-icons/hi2';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [dailySales, setDailySales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load dashboard stats
            const statsRes = await api.get('/reports/dashboard/');
            setStats(statsRes.data);

            // Load daily sales separately so dashboard still works if this fails
            try {
                const dailyRes = await api.get('/reports/daily/');
                setDailySales(dailyRes.data || []);
            } catch (dailyErr) {
                console.error('Daily sales load failed:', dailyErr);
                setDailySales([]);
            }
        } catch (err) {
            console.error('Dashboard load failed:', err);
            setError(err?.response?.data?.error || err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v) =>
        `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <HiOutlineExclamationTriangle className="w-12 h-12 text-red-400" />
                <p className="text-dark-500 text-lg">Failed to load dashboard</p>
                <p className="text-dark-400 text-sm">{error}</p>
                <button onClick={loadData} className="btn-primary mt-2">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-800">Dashboard</h1>
                <p className="text-dark-400 text-sm">Welcome to Manamperi Rice Mill</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatsCard
                    title="Today's Sales"
                    value={fmt(stats?.today_sales?.total)}
                    subtitle={`${stats?.today_sales?.count || 0} transactions`}
                    icon={HiOutlineBanknotes}
                    color="emerald"
                />
                <StatsCard
                    title="Monthly Sales"
                    value={fmt(stats?.month_sales?.total)}
                    subtitle={`${stats?.month_sales?.count || 0} transactions`}
                    icon={HiOutlineShoppingCart}
                    color="sky"
                />
                <StatsCard
                    title="Paddy Purchased"
                    value={`${Number(stats?.month_paddy?.quantity || 0).toLocaleString()} kg`}
                    subtitle={fmt(stats?.month_paddy?.total)}
                    icon={HiOutlineTruck}
                    color="amber"
                />
                <StatsCard
                    title="Low Stock Alerts"
                    value={stats?.low_stock_count || 0}
                    subtitle="Products need restocking"
                    icon={HiOutlineExclamationTriangle}
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Sales Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h2 className="text-lg font-bold text-dark-800 mb-4">Daily Sales (Last 30 Days)</h2>
                    {dailySales.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailySales}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => {
                                        try {
                                            return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        } catch {
                                            return v;
                                        }
                                    }}
                                />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(v) => [fmt(v), 'Revenue']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-dark-400">
                            <p>No sales data for the last 30 days</p>
                        </div>
                    )}
                </div>

                {/* Inventory Summary */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-dark-800 mb-4">Inventory Overview</h2>
                    <div className="space-y-4">
                        {stats?.inventory_summary?.map((item) => {
                            const icons = {
                                paddy: HiOutlineTruck,
                                rice: HiOutlineCube,
                                bran: HiOutlineArchiveBox,
                                husk: HiOutlineArchiveBox,
                            };
                            const colors = {
                                paddy: 'bg-amber-100 text-amber-600',
                                rice: 'bg-emerald-100 text-emerald-600',
                                bran: 'bg-orange-100 text-orange-600',
                                husk: 'bg-stone-100 text-stone-600',
                            };
                            const Icon = icons[item.item_type] || HiOutlineCube;
                            return (
                                <div
                                    key={item.item_type}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors"
                                >
                                    <div className={`p-2.5 rounded-xl ${colors[item.item_type] || 'bg-dark-100 text-dark-600'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-dark-700 capitalize">{item.item_type}</p>
                                        <p className="text-xs text-dark-400">{Number(item.total_kg || 0).toLocaleString()} kg</p>
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats?.inventory_summary || stats.inventory_summary.length === 0) && (
                            <p className="text-sm text-dark-400 text-center py-8">No inventory data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Sales */}
            <div className="glass-card p-6 mt-5">
                <h2 className="text-lg font-bold text-dark-800 mb-4">Recent Sales</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recent_sales?.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="font-mono text-sm font-semibold text-primary-600">
                                        {sale.invoice_number}
                                    </td>
                                    <td>{sale.customer_name || 'Walk-in'}</td>
                                    <td className="font-semibold">{fmt(sale.net_amount)}</td>
                                    <td>
                                        <span className="badge-info">{sale.payment_method_display || sale.payment_method}</span>
                                    </td>
                                    <td className="text-dark-400 text-xs">
                                        {new Date(sale.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {(!stats?.recent_sales || stats.recent_sales.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="text-center text-dark-400 py-8">
                                        No sales yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

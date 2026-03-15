import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { HiOutlineBanknotes, HiOutlineTruck, HiOutlineCube, HiOutlineExclamationTriangle } from 'react-icons/hi2';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await reportsAPI.getDashboard();
            setData(res.data);
        } catch (err) {
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const stats = [
        {
            label: "Today's Sales",
            value: `Rs. ${Number(data?.today_sales_total || 0).toLocaleString()}`,
            sub: `${data?.today_sales_count || 0} transactions`,
            icon: HiOutlineBanknotes,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Paddy Purchased',
            value: `${Number(data?.total_paddy_purchased || 0).toLocaleString()} kg`,
            sub: 'Total purchased',
            icon: HiOutlineTruck,
            color: 'bg-amber-500',
            bgColor: 'bg-amber-50',
        },
        {
            label: 'Rice Stock',
            value: `${Number(data?.rice_stock || 0).toLocaleString()} kg`,
            sub: 'Available',
            icon: HiOutlineCube,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Bran Stock',
            value: `${Number(data?.bran_stock || 0).toLocaleString()} kg`,
            sub: 'Available',
            icon: HiOutlineCube,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome to Manamperi Rice Mill Management System</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        <p className="text-xs text-gray-400">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">Sales (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data?.sales_chart || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v) => `Rs. ${Number(v).toLocaleString()}`} />
                            <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold text-gray-800">Low Stock Alerts</h3>
                    </div>
                    {data?.low_stock_alerts?.length > 0 ? (
                        <div className="space-y-3">
                            {data.low_stock_alerts.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500">Threshold: {item.low_stock_threshold} kg</p>
                                    </div>
                                    <span className="text-lg font-bold text-amber-600">{item.stock_kg} kg</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                            <p>All stock levels are healthy ✅</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

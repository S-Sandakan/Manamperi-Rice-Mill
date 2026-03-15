import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCube, HiOutlineExclamationTriangle, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from 'react-icons/hi2';

const Inventory = () => {
    const [data, setData] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [dashRes, movRes] = await Promise.all([
                inventoryAPI.getDashboard(),
                inventoryAPI.getMovements({})
            ]);
            setData(dashRes.data);
            setMovements(movRes.data);
        } catch (err) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const loadMovements = async (type) => {
        setFilter(type);
        try {
            const params = type !== 'all' ? { type } : {};
            const res = await inventoryAPI.getMovements(params);
            setMovements(res.data);
        } catch (err) {
            toast.error('Failed to filter movements');
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div></div>;

    const stocks = [
        { label: 'Paddy Stock', value: `${Number(data?.paddy_stock || 0).toLocaleString()} kg`, color: 'from-amber-500 to-amber-600', icon: '🌾' },
        { label: 'Rice Stock', value: `${Number(data?.rice_stock || 0).toLocaleString()} kg`, color: 'from-green-500 to-green-600', icon: '🍚' },
        { label: 'Bran Stock', value: `${Number(data?.bran_stock || 0).toLocaleString()} kg`, color: 'from-purple-500 to-purple-600', icon: '📦' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                <p className="text-gray-500 text-sm">Track all stock levels</p>
            </div>

            {/* Stock Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {stocks.map((s, i) => (
                    <div key={i} className={`bg-gradient-to-r ${s.color} rounded-xl p-6 text-white`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm">{s.label}</p>
                                <p className="text-3xl font-bold mt-1">{s.value}</p>
                            </div>
                            <span className="text-4xl">{s.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Low Stock Alerts */}
            {data?.low_stock_alerts?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-amber-800">Low Stock Alerts</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.low_stock_alerts.map((item, i) => (
                            <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="text-sm font-bold text-amber-600">{item.stock_kg} kg</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock Movements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Stock Movements</h3>
                    <div className="flex gap-2">
                        {['all', 'paddy', 'rice', 'bran'].map(type => (
                            <button key={type} onClick={() => loadMovements(type)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${filter === type ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                    {movements.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                {m.movement_type === 'in' ? (
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <HiOutlineArrowTrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <HiOutlineArrowTrendingDown className="w-4 h-4 text-red-600" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium">{m.item_name}</p>
                                    <p className="text-xs text-gray-500">{m.notes}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-semibold ${m.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.movement_type === 'in' ? '+' : '-'}{m.quantity_kg} kg
                                </p>
                                <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    {movements.length === 0 && (
                        <div className="text-center py-10 text-gray-400">No stock movements</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inventory;

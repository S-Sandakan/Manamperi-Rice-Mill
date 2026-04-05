import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    HiOutlineArchiveBox,
    HiOutlineExclamationTriangle,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowTrendingDown,
} from 'react-icons/hi2';

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [movements, setMovements] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const [invRes, movRes] = await Promise.all([
                api.get('/inventory/?page_size=200'),
                api.get('/stock-movements/?page_size=50&ordering=-created_at'),
            ]);
            setInventory(invRes.data.results || invRes.data);
            setMovements(movRes.data.results || movRes.data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const filtered = inventory.filter(
        (i) => !filter || i.item_type === filter
    );

    const typeColors = {
        paddy: 'bg-amber-100 text-amber-700 border-amber-200',
        rice: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        bran: 'bg-orange-100 text-orange-700 border-orange-200',
        husk: 'bg-stone-100 text-stone-700 border-stone-200',
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-800">Inventory</h1>
                <p className="text-dark-400 text-sm">Track paddy, rice, bran & husk stock levels</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-5">
                {['', 'paddy', 'rice', 'bran', 'husk'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filter === type
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-white text-dark-500 border border-dark-200 hover:border-primary-300'}`}
                    >
                        {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
                    </button>
                ))}
            </div>

            {/* Stock Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className={`p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${item.is_low_stock ? 'border-red-200 bg-red-50/50' : 'border-dark-100 bg-white'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${typeColors[item.item_type] || 'bg-dark-100'}`}>
                                    {item.item_type_display}
                                </span>
                                <h3 className="text-lg font-bold text-dark-800 mt-2">{item.item_name}</h3>
                            </div>
                            {item.is_low_stock && (
                                <HiOutlineExclamationTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                            )}
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-bold text-dark-800">
                                    {parseFloat(item.quantity_kg).toLocaleString()}
                                </p>
                                <p className="text-xs text-dark-400">kg in stock</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-dark-400">Threshold</p>
                                <p className="text-sm font-semibold text-dark-500">
                                    {parseFloat(item.low_stock_threshold).toLocaleString()} kg
                                </p>
                            </div>
                        </div>
                        {item.is_low_stock && (
                            <div className="mt-3 p-2 bg-red-100 rounded-lg text-xs text-red-600 font-medium text-center">
                                ⚠️ Below minimum stock level
                            </div>
                        )}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-12 text-dark-400">
                        <HiOutlineArchiveBox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No inventory data found</p>
                    </div>
                )}
            </div>

            {/* Recent Stock Movements */}
            <div className="glass-card p-5">
                <h2 className="text-lg font-bold text-dark-800 mb-4">Recent Stock Movements</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr><th>Item</th><th>Type</th><th>Qty (kg)</th><th>Reference</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {movements.map((m) => (
                                <tr key={m.id}>
                                    <td className="font-semibold">{m.inventory_name}</td>
                                    <td>
                                        {m.movement_type === 'in' ? (
                                            <span className="badge-success flex items-center gap-1 w-fit">
                                                <HiOutlineArrowTrendingUp className="w-3 h-3" /> Stock In
                                            </span>
                                        ) : (
                                            <span className="badge-danger flex items-center gap-1 w-fit">
                                                <HiOutlineArrowTrendingDown className="w-3 h-3" /> Stock Out
                                            </span>
                                        )}
                                    </td>
                                    <td>{parseFloat(m.quantity_kg).toLocaleString()}</td>
                                    <td className="text-dark-400 text-xs">{m.reference || '—'}</td>
                                    <td className="text-dark-400 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {movements.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-dark-400">No movements yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

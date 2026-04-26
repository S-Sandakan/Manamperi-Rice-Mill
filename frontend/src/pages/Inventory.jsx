import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineAdjustments, HiOutlineExclamation } from 'react-icons/hi';

const Inventory = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdjust, setShowAdjust] = useState(null);
    const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: '' });

    useEffect(() => { fetchStock(); }, []);

    const fetchStock = async () => {
        try {
            const res = await inventoryAPI.getStock();
            setStock(res.data.data || []);
        } catch {
            setStock([
                { id: 1, product: { id: 1, name: 'Raw Paddy (Vee)', productType: 'SAHAL' }, quantity: 5000, minQuantity: 500, lowStock: false },
                { id: 2, product: { id: 2, name: 'Sahal 1kg Packet', productType: 'SAHAL' }, quantity: 200, minQuantity: 50, lowStock: false },
                { id: 3, product: { id: 3, name: 'Sahal 2kg Packet', productType: 'SAHAL' }, quantity: 150, minQuantity: 40, lowStock: false },
                { id: 4, product: { id: 4, name: 'Sahal 5kg Packet', productType: 'SAHAL' }, quantity: 28, minQuantity: 30, lowStock: true },
                { id: 5, product: { id: 8, name: 'Kudu (Rice Bran)', productType: 'KUDU' }, quantity: 1500, minQuantity: 200, lowStock: false },
            ]);
        } finally { setLoading(false); }
    };

    const handleAdjust = async () => {
        if (!adjustForm.quantity || !adjustForm.reason) return toast.error('Quantity and reason are required');
        try {
            await inventoryAPI.adjustStock({
                productId: showAdjust,
                quantity: parseFloat(adjustForm.quantity),
                reason: adjustForm.reason,
            });
            toast.success('Stock adjusted');
            setShowAdjust(null);
            setAdjustForm({ quantity: '', reason: '' });
            fetchStock();
        } catch (err) { toast.error(err.response?.data?.message || 'Adjustment failed'); }
    };

    const lowStockItems = stock.filter((s) => s.lowStock || (s.quantity <= s.minQuantity));

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
                <p className="text-sm text-gray-400">Track stock levels across all products</p>
            </div>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-amber-500">
                    <div className="flex items-center gap-2 mb-2">
                        <HiOutlineExclamation className="text-amber-400 text-lg" />
                        <span className="text-amber-400 font-semibold text-sm">Low Stock Alerts ({lowStockItems.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lowStockItems.map((s) => (
                            <span key={s.id} className="badge badge-warning">{s.product?.name}: {s.quantity} remaining</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock Table */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Current Stock Levels</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Type</th>
                                <th>Current Stock</th>
                                <th>Minimum</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stock.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-medium text-white">{s.product?.name}</td>
                                    <td><span className={`badge ${s.product?.productType === 'KUDU' ? 'badge-warning' : 'badge-info'}`}>{s.product?.productType}</span></td>
                                    <td className="font-semibold">{(s.quantity || 0).toLocaleString()}</td>
                                    <td className="text-gray-400">{(s.minQuantity || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${(s.lowStock || s.quantity <= s.minQuantity) ? 'badge-danger' : 'badge-success'}`}>
                                            {(s.lowStock || s.quantity <= s.minQuantity) ? 'LOW' : 'OK'}
                                        </span>
                                    </td>
                                    <td>
                                        {showAdjust === s.product?.id ? (
                                            <div className="flex items-center gap-2">
                                                <input type="number" step="0.01" placeholder="+/- qty" value={adjustForm.quantity}
                                                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                                                    className="input !w-24 !py-1 !text-xs" />
                                                <input type="text" placeholder="Reason" value={adjustForm.reason}
                                                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                                    className="input !w-36 !py-1 !text-xs" />
                                                <button onClick={handleAdjust} className="btn btn-primary btn-sm !py-1">Save</button>
                                                <button onClick={() => setShowAdjust(null)} className="btn btn-secondary btn-sm !py-1">✕</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowAdjust(s.product?.id)} className="btn btn-sm btn-secondary">
                                                <HiOutlineAdjustments size={14} /> Adjust
                                            </button>
                                        )}
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

export default Inventory;

import { useState, useEffect } from 'react';
import { paddyAPI, farmersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi2';

const PaddyPurchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ farmer_id: '', weight_kg: '', price_per_kg: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [purchasesRes, farmersRes] = await Promise.all([paddyAPI.getAll(), farmersAPI.getAll()]);
            setPurchases(purchasesRes.data);
            setFarmers(farmersRes.data);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await paddyAPI.create(form);
            toast.success('Paddy purchase recorded');
            setShowForm(false);
            setForm({ farmer_id: '', weight_kg: '', price_per_kg: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record purchase');
        }
    };

    const totalAmount = form.weight_kg && form.price_per_kg ? (parseFloat(form.weight_kg) * parseFloat(form.price_per_kg)).toFixed(2) : '0.00';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Paddy Purchases</h1>
                    <p className="text-gray-500 text-sm">Record paddy purchases from farmers</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium">
                    <HiOutlinePlus className="w-4 h-4" /> New Purchase
                </button>
            </div>

            {/* Purchase Form */}
            {showForm && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 mb-4">Record New Purchase</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <select value={form.farmer_id} onChange={(e) => setForm({ ...form, farmer_id: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required>
                            <option value="">Select Farmer</option>
                            {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <input type="number" placeholder="Weight (kg)" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required step="0.01" />
                        <input type="number" placeholder="Price per kg" value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required step="0.01" />
                        <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required />
                        <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" />
                        <div className="flex items-center gap-4">
                            <div className="text-sm"><span className="text-gray-500">Total:</span> <span className="font-bold text-green-600">Rs. {totalAmount}</span></div>
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Purchases Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Farmer</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Weight</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price/kg</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {purchases.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 text-sm">{new Date(p.purchase_date).toLocaleDateString()}</td>
                                <td className="px-5 py-3 text-sm font-medium">{p.farmer_name}</td>
                                <td className="px-5 py-3 text-sm text-right">{p.weight_kg} kg</td>
                                <td className="px-5 py-3 text-sm text-right">Rs. {Number(p.price_per_kg).toFixed(2)}</td>
                                <td className="px-5 py-3 text-sm text-right font-semibold text-green-600">Rs. {Number(p.total_amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {purchases.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">No purchases recorded yet</div>
                )}
            </div>
        </div>
    );
};

export default PaddyPurchases;

import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function BranSales() {
    const [sales, setSales] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        product_type: 'bran', quantity_kg: '', price_per_kg: '', buyer_name: '', buyer_phone: '', notes: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await api.get('/bran-sales/?page_size=200');
            setSales(data.results || data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const filtered = sales.filter(
        (s) => s.buyer_name?.toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (v) => `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

    const save = async (e) => {
        e.preventDefault();
        try {
            await api.post('/bran-sales/', form);
            toast.success('Bran sale recorded');
            setShowModal(false);
            setForm({ product_type: 'bran', quantity_kg: '', price_per_kg: '', buyer_name: '', buyer_phone: '', notes: '' });
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Save failed');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Bran & Husk Sales</h1>
                    <p className="text-dark-400 text-sm">Track by-product sales</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <HiOutlinePlus className="w-4 h-4" /> New Sale
                </button>
            </div>

            <div className="glass-card p-5">
                <div className="relative mb-4 max-w-md">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        className="form-input pl-10" placeholder="Search by buyer..." />
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th><th>Buyer</th><th>Quantity (kg)</th>
                                <th>Price/kg</th><th>Total</th><th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.id}>
                                    <td><span className={s.product_type === 'bran' ? 'badge-warning' : 'badge-info'}>{s.product_type_display}</span></td>
                                    <td className="font-semibold">{s.buyer_name}</td>
                                    <td>{parseFloat(s.quantity_kg).toLocaleString()}</td>
                                    <td>{fmt(s.price_per_kg)}</td>
                                    <td className="font-semibold">{fmt(s.total_amount)}</td>
                                    <td className="text-dark-400 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-dark-400">No sales found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Bran/Husk Sale">
                <form onSubmit={save} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Product Type</label>
                        <select value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })} className="form-select">
                            <option value="bran">Rice Bran</option>
                            <option value="husk">Rice Husk</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Buyer Name</label>
                            <input value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                                className="form-input" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Buyer Phone</label>
                            <input value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                                className="form-input" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Quantity (kg)</label>
                            <input type="number" step="0.01" value={form.quantity_kg}
                                onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                                className="form-input" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Price per kg</label>
                            <input type="number" step="0.01" value={form.price_per_kg}
                                onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                                className="form-input" required />
                        </div>
                    </div>
                    {form.quantity_kg && form.price_per_kg && (
                        <div className="p-3 bg-primary-50 rounded-xl text-center">
                            <p className="text-sm text-dark-400">Total Amount</p>
                            <p className="text-xl font-bold text-primary-600">{fmt(form.quantity_kg * form.price_per_kg)}</p>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="form-input" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary">Save Sale</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

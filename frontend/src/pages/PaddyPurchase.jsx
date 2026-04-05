import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const paddyTypes = [
    { value: 'samba', label: 'Samba Paddy' },
    { value: 'nadu', label: 'Nadu Paddy' },
    { value: 'red', label: 'Red Paddy' },
    { value: 'white', label: 'White Paddy' },
    { value: 'keeri', label: 'Keeri Paddy' },
    { value: 'other', label: 'Other' },
];

export default function PaddyPurchase() {
    const [purchases, setPurchases] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        farmer_name: '', farmer_phone: '', paddy_type: 'samba',
        quantity_kg: '', price_per_kg: '', moisture_level: '', notes: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await api.get('/paddy-purchases/?page_size=200');
            setPurchases(data.results || data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const filtered = purchases.filter(
        (p) => p.farmer_name?.toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (v) => `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

    const save = async (e) => {
        e.preventDefault();
        try {
            await api.post('/paddy-purchases/', form);
            toast.success('Purchase recorded');
            setShowModal(false);
            setForm({
                farmer_name: '', farmer_phone: '', paddy_type: 'samba',
                quantity_kg: '', price_per_kg: '', moisture_level: '', notes: '',
            });
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Save failed');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Paddy Purchases</h1>
                    <p className="text-dark-400 text-sm">Record paddy purchases from farmers</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <HiOutlinePlus className="w-4 h-4" /> New Purchase
                </button>
            </div>

            <div className="glass-card p-5">
                <div className="relative mb-4 max-w-md">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        className="form-input pl-10" placeholder="Search by farmer name..." />
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Farmer</th><th>Phone</th><th>Paddy Type</th><th>Quantity (kg)</th>
                                <th>Price/kg</th><th>Total</th><th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td className="font-semibold">{p.farmer_name}</td>
                                    <td className="text-dark-400">{p.farmer_phone || '—'}</td>
                                    <td><span className="badge-info">{p.paddy_type_display}</span></td>
                                    <td>{parseFloat(p.quantity_kg).toLocaleString()}</td>
                                    <td>{fmt(p.price_per_kg)}</td>
                                    <td className="font-semibold">{fmt(p.total_amount)}</td>
                                    <td className="text-dark-400 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-dark-400">No purchases found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Paddy Purchase">
                <form onSubmit={save} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Farmer Name</label>
                            <input value={form.farmer_name} onChange={(e) => setForm({ ...form, farmer_name: e.target.value })}
                                className="form-input" required placeholder="Enter farmer name" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Farmer Phone</label>
                            <input value={form.farmer_phone} onChange={(e) => setForm({ ...form, farmer_phone: e.target.value })}
                                className="form-input" placeholder="Optional" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Paddy Type</label>
                        <select value={form.paddy_type} onChange={(e) => setForm({ ...form, paddy_type: e.target.value })}
                            className="form-select">
                            {paddyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
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
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Moisture Level (%)</label>
                        <input type="number" step="0.1" value={form.moisture_level}
                            onChange={(e) => setForm({ ...form, moisture_level: e.target.value })}
                            className="form-input" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="form-input" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary">Save Purchase</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

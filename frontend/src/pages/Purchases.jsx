import { useState, useEffect } from 'react';
import { purchaseAPI, supplierAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineFilter } from 'react-icons/hi';

const Purchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filters, setFilters] = useState({ supplierId: '', startDate: '', endDate: '' });
    const [form, setForm] = useState({
        supplierId: '', veeQuantityKg: '', pricePerKg: '', purchaseDate: new Date().toISOString().split('T')[0], notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            // Clean empty filters to prevent sending ?supplierId=&startDate=
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );

            const [purchRes, suppRes] = await Promise.all([
                purchaseAPI.getAll(cleanFilters),
                supplierAPI.getAll(),
            ]);
            setPurchases(purchRes.data.data || []);
            setSuppliers(suppRes.data.data || []);
        } catch {
            setPurchases([
                { id: 1, supplier: { name: 'Sunil Fernando' }, veeQuantityKg: 2000, pricePerKg: 85, totalAmount: 170000, purchaseDate: '2026-04-20' },
                { id: 2, supplier: { name: 'Mahinda Rajapaksa' }, veeQuantityKg: 3000, pricePerKg: 82, totalAmount: 246000, purchaseDate: '2026-04-19' },
            ]);
            setSuppliers([
                { id: 1, name: 'Sunil Fernando' }, { id: 2, name: 'Mahinda Rajapaksa' },
                { id: 3, name: 'Anura Bandara' }, { id: 4, name: 'Chaminda Jayawardena' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await purchaseAPI.create({
                ...form,
                supplierId: parseInt(form.supplierId),
                veeQuantityKg: parseFloat(form.veeQuantityKg),
                pricePerKg: parseFloat(form.pricePerKg),
            });
            toast.success('Purchase recorded successfully');
            setShowForm(false);
            setForm({ supplierId: '', veeQuantityKg: '', pricePerKg: '', purchaseDate: new Date().toISOString().split('T')[0], notes: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record purchase');
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(val);

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Purchase Management</h1>
                    <p className="text-sm text-gray-400">Record and track paddy (Vee) purchases from suppliers</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    <HiOutlinePlus size={18} /> New Purchase
                </button>
            </div>

            {/* Purchase Form */}
            {showForm && (
                <div className="glass-card p-6 slide-in">
                    <h2 className="text-lg font-semibold text-white mb-4">Record Purchase</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Supplier</label>
                            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="input" required>
                                <option value="">Select Supplier</option>
                                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Vee Quantity (kg)</label>
                            <input type="number" step="0.01" value={form.veeQuantityKg} onChange={(e) => setForm({ ...form, veeQuantityKg: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Price per kg (Rs.)</label>
                            <input type="number" step="0.01" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Purchase Date</label>
                            <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Total Amount</label>
                            <input type="text" value={form.veeQuantityKg && form.pricePerKg ? formatCurrency(form.veeQuantityKg * form.pricePerKg) : 'Rs. 0.00'} className="input opacity-60" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
                            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Optional" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                            <button type="submit" className="btn btn-primary">Save Purchase</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Purchases Table */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Purchase History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Supplier</th>
                                <th>Quantity (kg)</th>
                                <th>Price/kg</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((p, idx) => (
                                <tr key={p.id}>
                                    <td className="text-gray-400">{idx + 1}</td>
                                    <td className="font-medium text-white">{p.supplier?.name || 'N/A'}</td>
                                    <td>{(p.veeQuantityKg || 0).toLocaleString()} kg</td>
                                    <td>{formatCurrency(p.pricePerKg || 0)}</td>
                                    <td className="font-semibold text-green-400">{formatCurrency(p.totalAmount || 0)}</td>
                                    <td className="text-gray-400">{p.purchaseDate}</td>
                                </tr>
                            ))}
                            {purchases.length === 0 && (
                                <tr><td colSpan="6" className="text-center text-gray-500 py-8">No purchases found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Purchases;

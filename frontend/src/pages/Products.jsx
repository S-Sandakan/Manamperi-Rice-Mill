import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const categories = [
    { value: 'white_rice', label: 'White Rice' },
    { value: 'red_rice', label: 'Red Rice' },
    { value: 'basmati', label: 'Basmati' },
    { value: 'samba', label: 'Samba' },
    { value: 'nadu', label: 'Nadu' },
    { value: 'keeri_samba', label: 'Keeri Samba' },
    { value: 'other', label: 'Other' },
];

const emptyForm = {
    name: '', category: 'other', price_per_kg: '', stock_kg: '',
    low_stock_threshold: '50', description: '', is_active: true,
};

export default function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await api.get('/products/?page_size=200');
            setProducts(data.results || data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const filtered = products.filter(
        (p) => p.name.toLowerCase().includes(search.toLowerCase())
    );

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (p) => {
        setEditing(p.id);
        setForm({
            name: p.name, category: p.category, price_per_kg: p.price_per_kg,
            stock_kg: p.stock_kg, low_stock_threshold: p.low_stock_threshold,
            description: p.description || '', is_active: p.is_active,
        });
        setShowModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/products/${editing}/`, form);
                toast.success('Product updated');
            } else {
                await api.post('/products/', form);
                toast.success('Product added');
            }
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Save failed');
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await api.delete(`/products/${id}/`);
            toast.success('Deleted');
            load();
        } catch { toast.error('Delete failed'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Products</h1>
                    <p className="text-dark-400 text-sm">Manage rice products</p>
                </div>
                <button onClick={openNew} className="btn-primary flex items-center gap-2" id="add-product">
                    <HiOutlinePlus className="w-4 h-4" /> Add Product
                </button>
            </div>

            <div className="glass-card p-5">
                <div className="relative mb-4 max-w-md">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        className="form-input pl-10" placeholder="Search products..." />
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Category</th><th>Price/kg</th><th>Stock (kg)</th>
                                <th>Status</th><th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td className="font-semibold">{p.name}</td>
                                    <td><span className="badge-info">{p.category_display}</span></td>
                                    <td>Rs. {parseFloat(p.price_per_kg).toFixed(2)}</td>
                                    <td>
                                        <span className={p.is_low_stock ? 'text-red-500 font-bold' : ''}>
                                            {parseFloat(p.stock_kg).toFixed(1)}
                                        </span>
                                        {p.is_low_stock && <span className="badge-danger ml-2">Low</span>}
                                    </td>
                                    <td>{p.is_active ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}</td>
                                    <td className="text-right space-x-1">
                                        <button onClick={() => openEdit(p)} className="p-2 hover:bg-dark-100 rounded-lg transition-colors"><HiOutlinePencil className="w-4 h-4 text-dark-500" /></button>
                                        <button onClick={() => remove(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-dark-400">No products found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Product' : 'New Product'}>
                <form onSubmit={save} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Name</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="form-input" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Category</label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-select">
                                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Price per kg</label>
                            <input type="number" step="0.01" value={form.price_per_kg}
                                onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                                className="form-input" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Stock (kg)</label>
                            <input type="number" step="0.01" value={form.stock_kg}
                                onChange={(e) => setForm({ ...form, stock_kg: e.target.value })}
                                className="form-input" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-dark-600 mb-1 block">Low Stock Threshold</label>
                            <input type="number" step="0.01" value={form.low_stock_threshold}
                                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                                className="form-input" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="form-input" rows={2} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="rounded border-dark-300 text-primary-500 focus:ring-primary-400" />
                        Active
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

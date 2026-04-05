import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const emptyForm = { name: '', phone: '', address: '' };

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await api.get('/customers/?page_size=200');
            setCustomers(data.results || data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const filtered = customers.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search)
    );

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (c) => {
        setEditing(c.id);
        setForm({ name: c.name, phone: c.phone || '', address: c.address || '' });
        setShowModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/customers/${editing}/`, form);
                toast.success('Customer updated');
            } else {
                await api.post('/customers/', form);
                toast.success('Customer added');
            }
            setShowModal(false); load();
        } catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); }
    };

    const remove = async (id) => {
        if (!confirm('Delete this customer?')) return;
        try { await api.delete(`/customers/${id}/`); toast.success('Deleted'); load(); }
        catch { toast.error('Delete failed'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Customers</h1>
                    <p className="text-dark-400 text-sm">Manage rice buyers</p>
                </div>
                <button onClick={openNew} className="btn-primary flex items-center gap-2">
                    <HiOutlinePlus className="w-4 h-4" /> Add Customer
                </button>
            </div>

            <div className="glass-card p-5">
                <div className="relative mb-4 max-w-md">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        className="form-input pl-10" placeholder="Search customers..." />
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Phone</th><th>Purchases</th><th>Added</th><th className="text-right">Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id}>
                                    <td className="font-semibold">{c.name}</td>
                                    <td>{c.phone || '—'}</td>
                                    <td><span className="badge-info">{c.total_purchases}</span></td>
                                    <td className="text-dark-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td className="text-right space-x-1">
                                        <button onClick={() => openEdit(c)} className="p-2 hover:bg-dark-100 rounded-lg transition-colors"><HiOutlinePencil className="w-4 h-4 text-dark-500" /></button>
                                        <button onClick={() => remove(c.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-dark-400">No customers found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'New Customer'}>
                <form onSubmit={save} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Name</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="form-input" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Phone</label>
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-1 block">Address</label>
                        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="form-input" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

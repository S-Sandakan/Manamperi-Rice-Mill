import { useState, useEffect } from 'react';
import { farmersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi2';

const Farmers = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });

    useEffect(() => { loadFarmers(); }, []);

    const loadFarmers = async () => {
        try {
            const res = await farmersAPI.getAll();
            setFarmers(res.data);
        } catch (err) {
            toast.error('Failed to load farmers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await farmersAPI.update(editing.id, form);
                toast.success('Farmer updated');
            } else {
                await farmersAPI.create(form);
                toast.success('Farmer added');
            }
            setShowModal(false);
            setEditing(null);
            setForm({ name: '', phone: '', address: '' });
            loadFarmers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (farmer) => {
        setEditing(farmer);
        setForm({ name: farmer.name, phone: farmer.phone, address: farmer.address });
        setShowModal(true);
    };

    const handleView = async (id) => {
        try {
            const res = await farmersAPI.getById(id);
            setViewing(res.data);
        } catch (err) {
            toast.error('Failed to load farmer details');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await farmersAPI.delete(id);
            toast.success('Farmer deleted');
            loadFarmers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Farmers</h1>
                    <p className="text-gray-500 text-sm">Manage farmer information</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', address: '' }); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                    <HiOutlinePlus className="w-4 h-4" /> Add Farmer
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Address</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Supplied</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {farmers.map((farmer) => (
                            <tr key={farmer.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 text-sm text-gray-500">#{farmer.id}</td>
                                <td className="px-5 py-3 text-sm font-medium">{farmer.name}</td>
                                <td className="px-5 py-3 text-sm text-gray-600">{farmer.phone || '-'}</td>
                                <td className="px-5 py-3 text-sm text-gray-600 max-w-[200px] truncate">{farmer.address || '-'}</td>
                                <td className="px-5 py-3 text-sm text-right font-semibold text-amber-600">{Number(farmer.total_paddy_supplied).toLocaleString()} kg</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleView(farmer.id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"><HiOutlineEye className="w-4 h-4" /></button>
                                        <button onClick={() => handleEdit(farmer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><HiOutlinePencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(farmer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {farmers.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">No farmers added yet</div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                        <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Farmer' : 'Add Farmer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Farmer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required />
                            <input type="text" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" />
                            <textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" rows="2" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700">{editing ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {viewing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 animate-fade-in max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">{viewing.name}</h2>
                            <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                        </div>
                        <div className="space-y-2 mb-4 text-sm">
                            <p><span className="text-gray-500">Phone:</span> {viewing.phone || '-'}</p>
                            <p><span className="text-gray-500">Address:</span> {viewing.address || '-'}</p>
                            <p><span className="text-gray-500">Total Paddy Supplied:</span> <strong>{Number(viewing.total_paddy_supplied).toLocaleString()} kg</strong></p>
                        </div>
                        <h3 className="font-semibold text-sm mb-2">Purchase History</h3>
                        {viewing.purchases?.length > 0 ? (
                            <div className="space-y-2">
                                {viewing.purchases.map((p) => (
                                    <div key={p.id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                        <div>
                                            <p className="font-medium">{new Date(p.purchase_date).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500">{p.weight_kg} kg @ Rs. {p.price_per_kg}/kg</p>
                                        </div>
                                        <span className="font-semibold text-green-600">Rs. {Number(p.total_amount).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No purchase records</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Farmers;

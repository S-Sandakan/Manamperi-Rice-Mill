import { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        try {
            const res = await customersAPI.getAll();
            setCustomers(res.data);
        } catch (err) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await customersAPI.update(editing.id, form);
                toast.success('Customer updated');
            } else {
                await customersAPI.create(form);
                toast.success('Customer added');
            }
            setShowModal(false);
            setEditing(null);
            setForm({ name: '', phone: '', address: '' });
            loadCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (customer) => {
        setEditing(customer);
        setForm({ name: customer.name, phone: customer.phone, address: customer.address });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await customersAPI.delete(id);
            toast.success('Customer deleted');
            loadCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                    <p className="text-gray-500 text-sm">Manage customer information</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', address: '' }); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                    <HiOutlinePlus className="w-4 h-4" /> Add Customer
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
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 text-sm text-gray-500">#{customer.id}</td>
                                <td className="px-5 py-3 text-sm font-medium">{customer.name}</td>
                                <td className="px-5 py-3 text-sm text-gray-600">{customer.phone || '-'}</td>
                                <td className="px-5 py-3 text-sm text-gray-600 max-w-[200px] truncate">{customer.address || '-'}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleEdit(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><HiOutlinePencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">No customers added yet</div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                        <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Customer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required />
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
        </div>
    );
};

export default Customers;

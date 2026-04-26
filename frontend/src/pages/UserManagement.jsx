import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineLockClosed } from 'react-icons/hi';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'CASHIER' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await userAPI.getAll();
            setUsers(res.data.data || []);
        } catch {
            setUsers([
                { id: 1, username: 'admin', fullName: 'System Administrator', email: 'admin@manamperi.lk', role: 'ADMIN', isActive: true },
                { id: 2, username: 'cashier1', fullName: 'Nimal Perera', email: 'nimal@manamperi.lk', role: 'CASHIER', isActive: true },
                { id: 3, username: 'prodmgr1', fullName: 'Kamal Silva', email: 'kamal@manamperi.lk', role: 'PRODUCTION_MANAGER', isActive: true },
            ]);
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                await userAPI.update(editUser.id, form);
                toast.success('User updated');
            } else {
                await userAPI.create(form);
                toast.success('User created');
            }
            setShowForm(false);
            setEditUser(null);
            setForm({ username: '', password: '', fullName: '', email: '', role: 'CASHIER' });
            fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    };

    const toggleActive = async (id) => {
        try {
            await userAPI.toggleActive(id);
            toast.success('Status updated');
            fetchUsers();
        } catch { toast.error('Failed to update status'); }
    };

    const startEdit = (user) => {
        setEditUser(user);
        setForm({ username: user.username, fullName: user.fullName, email: user.email, role: user.role, password: '' });
        setShowForm(true);
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-sm text-gray-400">Manage system users and roles</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditUser(null); setForm({ username: '', password: '', fullName: '', email: '', role: 'CASHIER' }); }} className="btn btn-primary">
                    <HiOutlinePlus size={18} /> New User
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 slide-in">
                    <h2 className="text-lg font-semibold text-white mb-4">{editUser ? 'Edit User' : 'Create User'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" required disabled={!!editUser} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">{editUser ? 'New Password (optional)' : 'Password'}</label>
                            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" required={!editUser} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                            <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                                <option value="ADMIN">Admin</option>
                                <option value="CASHIER">Cashier</option>
                                <option value="PRODUCTION_MANAGER">Production Manager</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-3">
                            <button type="submit" className="btn btn-primary">{editUser ? 'Update' : 'Create'}</button>
                            <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }} className="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">System Users</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="font-mono text-white">{u.username}</td>
                                    <td className="font-medium text-white">{u.fullName}</td>
                                    <td className="text-gray-400">{u.email}</td>
                                    <td><span className="badge badge-info">{u.role?.replace('_', ' ')}</span></td>
                                    <td>
                                        <button onClick={() => toggleActive(u.id)} className={`badge cursor-pointer ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </button>
                                    </td>
                                    <td className="flex gap-2">
                                        <button onClick={() => startEdit(u)} className="btn btn-sm btn-secondary">
                                            <HiOutlinePencil size={14} />
                                        </button>
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

export default UserManagement;

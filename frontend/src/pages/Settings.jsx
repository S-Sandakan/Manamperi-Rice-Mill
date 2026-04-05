import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    HiOutlineCog6Tooth,
    HiOutlineUserPlus,
    HiOutlineKey,
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlineXMark,
} from 'react-icons/hi2';

export default function Settings() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // New user form
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', role: 'staff',
    });
    const [addingUser, setAddingUser] = useState(false);

    // Password change (self)
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [changingPw, setChangingPw] = useState(false);

    // Admin reset password
    const [resetModal, setResetModal] = useState(null); // user object
    const [resetPw, setResetPw] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Add User ────────────────────────────────────────────────
    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) {
            return toast.error('Username and password are required');
        }
        if (newUser.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        setAddingUser(true);
        try {
            await api.post('/users/', newUser);
            toast.success('User created successfully!');
            setNewUser({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: 'staff' });
            setShowAddUser(false);
            loadUsers();
        } catch (err) {
            toast.error(err.response?.data?.username?.[0] || err.response?.data?.error || 'Failed to create user');
        } finally {
            setAddingUser(false);
        }
    };

    // ── Delete User ─────────────────────────────────────────────
    const handleDeleteUser = async (u) => {
        if (u.id === user?.id) return toast.error("You can't delete yourself");
        if (!confirm(`Delete user "${u.username}"?`)) return;
        try {
            await api.delete(`/users/${u.id}/`);
            toast.success('User deleted');
            loadUsers();
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    // ── Change Own Password ─────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            return toast.error('New passwords do not match');
        }
        if (passwords.new_password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        setChangingPw(true);
        try {
            await api.post('/users/change_password/', {
                old_password: passwords.old_password,
                new_password: passwords.new_password,
            });
            toast.success('Password changed successfully!');
            setPasswords({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change password');
        } finally {
            setChangingPw(false);
        }
    };

    // ── Admin Reset Password ────────────────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (resetPw.length < 6) return toast.error('Password must be at least 6 characters');
        setResetting(true);
        try {
            await api.post(`/users/${resetModal.id}/reset_password/`, { new_password: resetPw });
            toast.success(`Password reset for ${resetModal.username}`);
            setResetModal(null);
            setResetPw('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-800 flex items-center gap-2">
                    <HiOutlineCog6Tooth className="w-7 h-7 text-primary-500" />
                    Settings
                </h1>
                <p className="text-dark-400 text-sm">Manage users and system settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left: User Management (2/3) ─────────────── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Users Table */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-dark-800">User Management</h2>
                            <button
                                onClick={() => setShowAddUser(!showAddUser)}
                                className="btn-primary flex items-center gap-2 text-sm"
                            >
                                <HiOutlineUserPlus className="w-4 h-4" />
                                Add User
                            </button>
                        </div>

                        {/* Add User Form */}
                        {showAddUser && (
                            <form onSubmit={handleAddUser} className="bg-dark-50 rounded-xl p-5 mb-5 space-y-4">
                                <h3 className="font-semibold text-dark-700 text-sm">Create New User</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="form-label">Username *</label>
                                        <input
                                            className="form-input"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Password *</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">First Name</label>
                                        <input
                                            className="form-input"
                                            value={newUser.first_name}
                                            onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Last Name</label>
                                        <input
                                            className="form-input"
                                            value={newUser.last_name}
                                            onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Phone</label>
                                        <input
                                            className="form-input"
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Role</label>
                                        <select
                                            className="form-input"
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={addingUser} className="btn-primary text-sm">
                                        {addingUser ? 'Creating…' : 'Create User'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddUser(false)}
                                        className="btn-secondary text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Users List */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id}>
                                                <td className="font-semibold text-dark-700">{u.username}</td>
                                                <td>{u.first_name} {u.last_name}</td>
                                                <td>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${u.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-sky-100 text-sky-700'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${u.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => { setResetModal(u); setResetPw(''); }}
                                                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"
                                                            title="Reset Password"
                                                        >
                                                            <HiOutlineKey className="w-4 h-4" />
                                                        </button>
                                                        {u.id !== user?.id && (
                                                            <button
                                                                onClick={() => handleDeleteUser(u)}
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                                title="Delete User"
                                                            >
                                                                <HiOutlineTrash className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center text-dark-400 py-8">
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Change Password (1/3) ────────────── */}
                <div className="space-y-5">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
                            <HiOutlineKey className="w-5 h-5 text-primary-500" />
                            Change Password
                        </h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.old_password}
                                    onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.new_password}
                                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.confirm_password}
                                    onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={changingPw} className="btn-primary w-full text-sm">
                                {changingPw ? 'Changing…' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    {/* System Info */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-dark-800 mb-4">System Info</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-dark-400">Logged in as</span>
                                <span className="font-semibold text-dark-700">{user?.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-400">Role</span>
                                <span className="font-semibold text-dark-700 capitalize">{user?.role}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-dark-400">Total Users</span>
                                <span className="font-semibold text-dark-700">{users.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Reset Password Modal ────────────────────────── */}
            {resetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-dark-800">
                                Reset Password - {resetModal.username}
                            </h3>
                            <button
                                onClick={() => setResetModal(null)}
                                className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={resetPw}
                                    onChange={(e) => setResetPw(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={resetting} className="btn-primary flex-1 text-sm">
                                    {resetting ? 'Resetting…' : 'Reset Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResetModal(null)}
                                    className="btn-secondary text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

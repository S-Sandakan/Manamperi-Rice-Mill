import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
    HiOutlineViewGrid,
    HiOutlineShoppingCart,
    HiOutlineCube,
    HiOutlineCog,
    HiOutlineClipboardList,
    HiOutlineChartBar,
    HiOutlineArchive,
    HiOutlineLogout,
    HiOutlineUsers,
    HiOutlineMenu,
    HiOutlineX,
} from 'react-icons/hi';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid, roles: ['ADMIN', 'CASHIER', 'PRODUCTION_MANAGER'] },
        { path: '/pos', label: 'Point of Sale', icon: HiOutlineShoppingCart, roles: ['ADMIN', 'CASHIER'] },
        { path: '/purchases', label: 'Purchases', icon: HiOutlineClipboardList, roles: ['ADMIN', 'PRODUCTION_MANAGER'] },
        { path: '/production', label: 'Production', icon: HiOutlineCog, roles: ['ADMIN', 'PRODUCTION_MANAGER'] },
        { path: '/inventory', label: 'Inventory', icon: HiOutlineArchive, roles: ['ADMIN', 'CASHIER', 'PRODUCTION_MANAGER'] },
        { path: '/reports', label: 'Reports', icon: HiOutlineChartBar, roles: ['ADMIN'] },
        { path: '/users', label: 'User Management', icon: HiOutlineUsers, roles: ['ADMIN'] },
    ];

    const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role));

    return (
        <aside
            className={`fixed top-0 left-0 h-full z-40 border-r border-white/5 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[260px]'
                }`}
            style={{ background: 'linear-gradient(180deg, #111827 0%, #0a0d11 100%)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
                            <HiOutlineCube className="text-white text-lg" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wide">MRMS</h1>
                            <p className="text-[10px] text-gray-500">Rice Mill ERP</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    {collapsed ? <HiOutlineMenu size={18} /> : <HiOutlineX size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
                {filteredMenu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden ${isActive
                                ? 'text-green-400 bg-white/5 shadow-[inset_2px_0_0_0_#22c55e]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-r-md"></div>
                                )}
                                <item.icon className={`text-xl flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${collapsed ? 'mx-auto' : ''}`} />
                                {!collapsed && <span>{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User info & Logout */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0a0d11]/80 backdrop-blur-md">
                {!collapsed && (
                    <div className="flex items-center gap-3 p-3 mb-3 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-base font-bold shadow-inner">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                            <p className="text-[11px] font-medium tracking-wide text-green-400 uppercase">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''
                        }`}
                >
                    <HiOutlineLogout className="text-lg" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

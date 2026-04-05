import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineHome,
    HiOutlineShoppingCart,
    HiOutlineCube,
    HiOutlineTruck,
    HiOutlineSparkles,
    HiOutlineUsers,
    HiOutlineArchiveBox,
    HiOutlineChartBar,
    HiOutlineCog6Tooth,
    HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

// role: 'all' = everyone, 'admin' = admin only
const links = [
    { to: '/', icon: HiOutlineHome, label: 'Dashboard', role: 'all' },
    { to: '/pos', icon: HiOutlineShoppingCart, label: 'POS', role: 'all' },
    { to: '/products', icon: HiOutlineCube, label: 'Products', role: 'admin' },
    { to: '/paddy-purchases', icon: HiOutlineTruck, label: 'Paddy Purchase', role: 'admin' },
    { to: '/bran-sales', icon: HiOutlineSparkles, label: 'Bran Sales', role: 'admin' },
    { to: '/customers', icon: HiOutlineUsers, label: 'Customers', role: 'admin' },
    { to: '/inventory', icon: HiOutlineArchiveBox, label: 'Inventory', role: 'admin' },
    { to: '/reports', icon: HiOutlineChartBar, label: 'Reports', role: 'admin' },
    { to: '/settings', icon: HiOutlineCog6Tooth, label: 'Settings', role: 'admin' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();

    const isAdmin = user?.role === 'admin' || user?.is_superuser;

    const visibleLinks = links.filter(
        (link) => link.role === 'all' || (link.role === 'admin' && isAdmin)
    );

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 text-white flex flex-col z-50">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-white/10">
                <h1 className="text-xl font-bold">
                    <span className="text-primary-400">Manamperi</span>
                    <br />
                    <span className="text-sm font-normal text-dark-400">Rice Mill</span>
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {visibleLinks.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User */}
            <div className="px-4 py-4 border-t border-white/10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.username}</p>
                        <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                    <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

import { NavLink } from 'react-router-dom';
import {
    HiOutlineHome, HiOutlineShoppingCart, HiOutlineCube, HiOutlineTruck,
    HiOutlineUsers, HiOutlineUserGroup, HiOutlineArchiveBox,
    HiOutlineChartBar, HiOutlineBeaker
} from 'react-icons/hi2';

const navItems = [
    { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
    { path: '/pos', icon: HiOutlineShoppingCart, label: 'POS' },
    { path: '/products', icon: HiOutlineCube, label: 'Products' },
    { path: '/paddy', icon: HiOutlineTruck, label: 'Paddy Purchases' },
    { path: '/bran', icon: HiOutlineBeaker, label: 'Rice Bran' },
    { path: '/farmers', icon: HiOutlineUsers, label: 'Farmers' },
    { path: '/customers', icon: HiOutlineUserGroup, label: 'Customers' },
    { path: '/inventory', icon: HiOutlineArchiveBox, label: 'Inventory' },
    { path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
];

const Sidebar = () => {
    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-green-800 to-green-900 text-white flex flex-col z-50 shadow-xl">
            {/* Logo */}
            <div className="p-5 border-b border-green-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xl font-bold">🌾</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Manamperi</h1>
                        <p className="text-green-300 text-xs">Rice Mill</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive
                                ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                                : 'text-green-200 hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-green-700">
                <p className="text-green-400 text-xs text-center">© 2024 Manamperi Rice Mill</p>
            </div>
        </aside>
    );
};

export default Sidebar;

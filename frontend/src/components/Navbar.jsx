import { useAuth } from '../context/AuthContext';
import { HiOutlineArrowRightOnRectangle, HiOutlineUser } from 'react-icons/hi2';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Manamperi Rice Mill</h2>
                <p className="text-xs text-gray-500">Management System</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                    <HiOutlineUser className="w-4 h-4 text-green-700" />
                    <span className="text-sm font-medium text-green-800">{user?.full_name}</span>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Navbar;

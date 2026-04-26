import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#0f1419]">
            <Sidebar />
            <main
                className="flex-1 transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
            >
                <div className="p-6 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;

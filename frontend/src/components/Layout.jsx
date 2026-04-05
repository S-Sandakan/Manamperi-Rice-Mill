import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div className="flex min-h-screen bg-dark-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-6">
                <div className="page-enter">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

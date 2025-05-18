    // admin-frontend/src/components/layout/AdminLayout.jsx
    import React, { useState } from 'react';
    import { Outlet } from 'react-router-dom';
    import Sidebar from './Sidebar';        // Đảm bảo Sidebar.jsx đã được cập nhật
    import AdminNavbar from './AdminNavbar';  // Đảm bảo AdminNavbar.jsx đã được cập nhật
    import './Layout.css';                 // Import CSS cho layout

    function AdminLayout() {
        const [isSidebarToggled, setIsSidebarToggled] = useState(false);

        const toggleSidebar = () => {
            setIsSidebarToggled(!isSidebarToggled);
        };

        return (
            <div className={`admin-layout-wrapper ${isSidebarToggled ? 'sidebar-toggled' : ''}`}> {/* Class để CSS có thể bắt */}
                <div className="sidebar-container"> {/* Container cho Sidebar */}
                    <Sidebar />
                </div>
                <div className="content-container"> {/* Container cho Navbar và Content chính */}
                    <AdminNavbar 
                        onToggleSidebar={toggleSidebar} 
                        isSidebarToggled={isSidebarToggled} 
                    />
                    <main className="main-content-area p-3 p-md-4"> {/* Padding cho nội dung chính */}
                        <Outlet /> {/* Nơi các component của Route con sẽ được render */}
                    </main>
                    {/* <footer className="admin-footer bg-light p-3 text-center mt-auto border-top">
                        <small>&copy; {new Date().getFullYear()} Your Admin Panel. All rights reserved.</small>
                    </footer> 
                    */}
                </div>
            </div>
        );
    }

    export default AdminLayout;
    
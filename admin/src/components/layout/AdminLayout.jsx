import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet để render các route con
import Sidebar from './Sidebar';
import AdminNavbar from './Navbar';
import './Layout.css' // Import CSS cho layout

function AdminLayout() {
    return (
        <div className="d-flex"> {/* Sử dụng flexbox để xếp sidebar và content */}
            <div style={{ minWidth: '250px' }}> {/* Đặt chiều rộng cố định hoặc tùy chỉnh cho sidebar */}
               <Sidebar />
            </div>
            <div className="flex-grow-1"> {/* Phần content chiếm phần còn lại */}
                <AdminNavbar />
                <main className="p-3"> {/* Padding cho content area */}
                    <Outlet /> {/* Đây là nơi các component Page sẽ được render */}
                </main>
                {/* <Footer /> */} {/* Optional Footer */}
            </div>
        </div>
    );
}

export default AdminLayout;
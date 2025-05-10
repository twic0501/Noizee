import React, { useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
// --- Bỏ comment và import Chart.js ---
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
// Đăng ký các thành phần Chart.js
// ------------------------------------

// Component để hiển thị biểu đồ
function SalesChart({ data, title = "Sales Overview", type = 'line' }) {
    const chartRef = useRef(null); // Ref giữ thẻ canvas
    const chartInstanceRef = useRef(null); // Ref giữ đối tượng Chart

    useEffect(() => {
        // Chỉ chạy nếu có ref và có dữ liệu data (và data có labels/values)
        if (!chartRef.current || !data || !data.labels || !data.values) {
            // Nếu chưa có dữ liệu hoặc ref, hủy biểu đồ cũ nếu có
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return; // Không vẽ gì cả
        }

        // Hủy biểu đồ cũ trước khi vẽ biểu đồ mới
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        // --- Sửa lỗi cú pháp và loại bỏ dữ liệu giả ---
        chartInstanceRef.current = new Chart(ctx, {
            type: type, // Sử dụng prop 'type'
            data: {
                labels: data.labels, // Sử dụng labels từ prop 'data'
                datasets: [
                    {
                        label: title, // Có thể dùng title làm label hoặc truyền label riêng
                        data: data.values, // Sử dụng values từ prop 'data'
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Thêm màu nền cho line/bar chart
                        fill: type === 'line', // Chỉ fill nếu là line chart (tùy chọn)
                        tension: 0.1
                    }
                    // Thêm các dataset khác nếu cần
                ]
                // --- Không còn dữ liệu giả ở đây ---
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Quan trọng khi đặt chiều cao cố định cho div cha
                scales: {
                    y: {
                        beginAtZero: true // Bắt đầu trục Y từ 0
                    }
                },
                plugins: {
                    legend: { // Ẩn legend nếu chỉ có 1 dataset
                        display: (data.datasets?.length || 1) > 1
                    }
                }
                // Thêm các options khác của Chart.js nếu cần
            }
        });
        // --- Hết phần sửa ---

        // Cleanup function để hủy biểu đồ khi component unmount hoặc data/type thay đổi
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [data, type, title]); // Thêm 'title' vào dependency nếu label dùng title

    return (
        <Card className="shadow-sm h-100">
            <Card.Header>
                <h5 className="card-title mb-0">{title}</h5>
            </Card.Header>
            <Card.Body>
                <div style={{ position: 'relative', height: '300px' }}>
                    {/* --- Bỏ comment canvas --- */}
                    <canvas ref={chartRef}></canvas>
                    {/* ----------------------- */}
                    {/* Có thể ẩn placeholder này đi khi đã tích hợp */}
                    {/* <p className='text-center text-muted mt-5'>Chart Placeholder - Integrate a charting library here (e.g., Chart.js, Recharts).</p> */}
                </div>
            </Card.Body>
        </Card>
    );
}

export default SalesChart;
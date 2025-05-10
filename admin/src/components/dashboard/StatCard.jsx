import React from 'react';
import { Card, Spinner } from 'react-bootstrap'; // Import Card và Spinner
import 'bootstrap-icons/font/bootstrap-icons.css'; // Đảm bảo icon được import

function StatCard({ title, value, iconClass, colorVariant = 'primary', isLoading = false, error = null }) {
    // iconClass: ví dụ 'bi-currency-dollar', 'bi-cart-check', 'bi-people'
    // colorVariant: 'primary', 'success', 'info', 'warning', 'danger'

    const renderContent = () => {
        if (isLoading) {
            return <Spinner animation="border" size="sm" variant={colorVariant} />;
        }
        if (error) {
            return <span className="text-danger small">Error</span>;
        }
        return <h3 className="mb-0">{value ?? 'N/A'}</h3>; // Hiển thị giá trị hoặc 'N/A'
    };

    return (
        <Card className={`border-${colorVariant} border-start border-5 shadow-sm h-100`}>
            <Card.Body>
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                        <div className={`text-muted text-uppercase small mb-1`}>{title}</div>
                        {renderContent()}
                    </div>
                    {iconClass && (
                        <div className={`fs-2 text-${colorVariant}`}>
                            <i className={`bi ${iconClass}`}></i>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

export default StatCard;
import React, { useEffect, useRef } from 'react';
import Button from './Button'; // Sử dụng Button tùy chỉnh

const ModalConfirm = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'danger',
    isLoading = false,
}) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!modalRef.current || typeof window.bootstrap === 'undefined') return;
        const modal = new window.bootstrap.Modal(modalRef.current, {
            backdrop: 'static', // Không đóng khi click ra ngoài
            keyboard: false,    // Không đóng bằng phím Esc
        });
        if (isOpen) {
            modal.show();
        } else {
            // Cần kiểm tra instance trước khi gọi hide để tránh lỗi nếu modal chưa được khởi tạo hoàn toàn
            const existingModalInstance = window.bootstrap.Modal.getInstance(modalRef.current);
            if (existingModalInstance) {
                 existingModalInstance.hide();
            }
        }
        // Không nên destroy modal ở đây để có thể mở lại
    }, [isOpen]);


    if (!isOpen && !modalRef.current?.classList.contains('show')) { // Thêm điều kiện để không render nếu không cần
         return null;
    }

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1" aria-labelledby={`${title.replace(/\s+/g, '-')}-label`} aria-hidden={!isOpen}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id={`${title.replace(/\s+/g, '-')}-label`}>{title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={isLoading}></button>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                    </div>
                    <div className="modal-footer">
                        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                            {cancelText}
                        </Button>
                        <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading} disabled={isLoading}>
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirm;
// src/components/common/FloatingChatIcon.jsx
import React, { useState } from 'react';
import './FloatingChatIcon.css'; // File CSS riêng cho component này
import 'bootstrap-icons/font/bootstrap-icons.css'; // Đảm bảo đã import icon

function FloatingChatIcon() {
    const [isOpen, setIsOpen] = useState(false);

    // --- THAY THẾ CÁC PLACEHOLDER BẰNG LINK THỰC TẾ CỦA BẠN ---
    const messengerLink = "https://m.me/YOUR_FACEBOOK_PAGE_USERNAME"; // Thay YOUR_FACEBOOK_PAGE_USERNAME
    const instagramLink = "https://ig.me/m/YOUR_INSTAGRAM_USERNAME"; // Thay YOUR_INSTAGRAM_USERNAME

    const toggleChatOptions = () => setIsOpen(!isOpen);

    return (
        <div className="floating-chat-container">
            {isOpen && (
                <div className="chat-options">
                    <a href={messengerLink} target="_blank" rel="noopener noreferrer" className="chat-option messenger" title="Chat via Messenger">
                        <i className="bi bi-messenger"></i>
                        <span>Messenger</span>
                    </a>
                    <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="chat-option instagram" title="Chat via Instagram">
                        <i className="bi bi-instagram"></i>
                        <span>Instagram</span>
                    </a>
                </div>
            )}
            <button
                className="floating-chat-button shadow"
                onClick={toggleChatOptions}
                aria-expanded={isOpen}
                aria-label="Open chat options"
            >
                <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
            </button>
        </div>
    );
}

export default FloatingChatIcon;
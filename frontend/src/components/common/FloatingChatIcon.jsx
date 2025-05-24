// src/components/common/FloatingChatIcon.jsx
import React, { useState } from 'react';
import './FloatingChatIcon.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useTranslation } from 'react-i18next'; // << IMPORT

function FloatingChatIcon() {
    const { t } = useTranslation(); // << SỬ DỤNG HOOK
    const [isOpen, setIsOpen] = useState(false);

    const messengerLink = "https://m.me/YOUR_FACEBOOK_PAGE_USERNAME";
    const instagramLink = "https://ig.me/m/YOUR_INSTAGRAM_USERNAME";

    const toggleChatOptions = () => setIsOpen(!isOpen);

    return (
        <div className="floating-chat-container">
            {isOpen && (
                <div className="chat-options">
                    <a 
                        href={messengerLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="chat-option messenger" 
                        title={t('floatingChat.messengerTitle')} // Dịch title
                    >
                        <i className="bi bi-messenger"></i>
                        <span>{t('floatingChat.messenger')}</span> {/* Dịch text */}
                    </a>
                    <a 
                        href={instagramLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="chat-option instagram" 
                        title={t('floatingChat.instagramTitle')} // Dịch title
                    >
                        <i className="bi bi-instagram"></i>
                        <span>{t('floatingChat.instagram')}</span> {/* Dịch text */}
                    </a>
                </div>
            )}
            <button
                className="floating-chat-button shadow"
                onClick={toggleChatOptions}
                aria-expanded={isOpen}
                aria-label={isOpen ? t('floatingChat.closeOptions') : t('floatingChat.openOptions')} // Dịch aria-label
            >
                <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
            </button>
        </div>
    );
}

export default FloatingChatIcon;
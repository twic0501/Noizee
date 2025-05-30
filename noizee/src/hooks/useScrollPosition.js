import { useState, useEffect, useCallback } from 'react';

const useScrollPosition = () => {
    const [scrollY, setScrollY] = useState(0);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    const handleScroll = useCallback(() => {
        if (typeof window === 'undefined') return;

        const currentScrollY = window.scrollY;
        setScrollY(currentScrollY);
        setIsScrollingDown(currentScrollY > lastScrollY && currentScrollY > 0); // Chỉ true nếu cuộn xuống và không ở top
        setLastScrollY(currentScrollY <= 0 ? 0 : currentScrollY); // Để tránh giá trị âm
    }, [lastScrollY]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', handleScroll, { passive: true });
            // Set initial scrollY
            setScrollY(window.scrollY);
            setLastScrollY(window.scrollY <= 0 ? 0 : window.scrollY);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    return { scrollY, isScrollingDown };
};

export default useScrollPosition;
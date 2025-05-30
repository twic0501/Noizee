import { useEffect, useCallback } from 'react';

const useClickOutside = (ref, handler) => {
    const handleClickOutside = useCallback(
        (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                handler(event);
            }
        },
        [ref, handler]
    );

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside); // Hỗ trợ cả touch
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            }
        };
    }, [handleClickOutside]);
};

export default useClickOutside;
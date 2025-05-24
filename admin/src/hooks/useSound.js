import { useCallback } from 'react';

export const useSound = () => {
  const notificationSound = new Audio('/notification.mp3'); // Thêm file âm thanh vào public folder

  const playNotification = useCallback(() => {
    try {
      notificationSound.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  return { playNotification };
};
import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notif) => {
    const id = Date.now() + Math.random();
    setNotifications(prev =>
      [{ id, ...notif, read: false, time: new Date() }, ...prev].slice(0, 50)
    );
  }, []);

  const markRead    = useCallback((id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(()   => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);
  const clearAll    = useCallback(()   => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markRead, markAllRead, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
// Centro notifiche React per BookingHSE
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from '../lib/icons';
import { getNotificationManager } from '../lib/notifications';
import type { NotificationData, NotificationType, NotificationPriority } from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';

interface NotificationCenterProps {
  className?: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
}

// Componente singola notifica
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}) => {
  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ora';
    if (diffInMinutes < 60) return `${diffInMinutes}m fa`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h fa`;
    return `${Math.floor(diffInMinutes / 1440)}g fa`;
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    } else if (notification.data?.action_url && typeof notification.data.action_url === 'string') {
      window.location.href = notification.data.action_url;
    }
  };

  return (
    <div
      className={`
        relative p-4 border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md
        ${getPriorityColor(notification.priority)}
        ${!notification.read ? 'font-medium' : 'opacity-75'}
      `}
      onClick={handleClick}
    >
      {/* Indicatore non letto */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
      
      {/* Contenuto notifica */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {notification.data?.icon && (
              <span className="text-lg">{notification.data.icon}</span>
            )}
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{getTimeAgo(notification.created_at)}</span>
            <span className="capitalize">{notification.type.replace('_', ' ')}</span>
          </div>
        </div>
        
        {/* Azioni */}
        <div className="flex items-center gap-1 ml-2">
          {!notification.read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Segna come letto"
            >
              <Check size={14} />
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Elimina"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente toast per notifiche in tempo reale
interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, notification.priority === 'urgent' ? 10000 : 5000);

    return () => clearTimeout(timer);
  }, [notification.priority, onClose]);

  const getPriorityStyles = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      ${getPriorityStyles(notification.priority)}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {notification.data?.icon && (
              <span className="text-lg">{notification.data.icon}</span>
            )}
            <h4 className="font-medium text-sm">{notification.title}</h4>
          </div>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-black hover:bg-opacity-20 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Componente principale centro notifiche
const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<NotificationData[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');

  const notificationManager = getNotificationManager();

  // Carica notifiche
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await notificationManager.getNotifications(user.id, {
        limit: 50,
        unreadOnly: filter === 'unread',
        ...(typeFilter !== 'all' && { types: [typeFilter] })
      });
      setNotifications(data);
      
      const count = await notificationManager.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, typeFilter, notificationManager]);

  // Inizializza sistema notifiche
  useEffect(() => {
    if (!user?.id) return;

    const initializeNotifications = async () => {
      try {
        await notificationManager.initialize(user.id);
        await loadNotifications();
        
        // Listener per nuove notifiche
        notificationManager.addListener('all', (notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Mostra toast per notifiche importanti
          if (['urgent', 'high'].includes(notification.priority)) {
            setToasts(prev => [...prev, notification]);
          }
        });
        
        // Richiedi permesso notifiche browser
        await notificationManager.requestNotificationPermission();
      } catch (error) {
        console.error('Errore inizializzazione notifiche:', error);
      }
    };

    initializeNotifications();

    return () => {
      notificationManager.disconnect();
    };
  }, [user?.id, notificationManager, loadNotifications]);

  // Ricarica quando cambiano i filtri
  useEffect(() => {
    loadNotifications();
  }, [filter, typeFilter, loadNotifications]);

  // Segna come letto
  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationManager.markAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Segna tutte come lette
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    const success = await notificationManager.markAllAsRead(user.id);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  // Elimina notifica
  const handleDelete = async (notificationId: string) => {
    const success = await notificationManager.deleteNotification(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Chiudi toast
  const handleCloseToast = (notificationId: string) => {
    setToasts(prev => prev.filter(n => n.id !== notificationId));
  };

  // Tipi di notifica per filtro
  const notificationTypes: { value: NotificationType | 'all'; label: string }[] = [
    { value: 'all', label: 'Tutte' },
    { value: 'booking_request', label: 'Richieste' },
    { value: 'booking_confirmed', label: 'Conferme' },
    { value: 'payment_received', label: 'Pagamenti' },
    { value: 'message_received', label: 'Messaggi' },
    { value: 'review_received', label: 'Recensioni' },
    { value: 'reminder', label: 'Promemoria' }
  ];

  if (!user) return null;

  return (
    <>
      {/* Toast notifiche */}
      {toasts.map(toast => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => handleCloseToast(toast.id)}
        />
      ))}
      
      {/* Pulsante notifiche */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        
        {/* Pannello notifiche */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Notifiche</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Filtri */}
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                  className="text-xs border rounded px-2 py-1 flex-1"
                >
                  <option value="all">Tutte</option>
                  <option value="unread">Non lette</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                  className="text-xs border rounded px-2 py-1 flex-1"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Lista notifiche */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Caricamento...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {filter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/notifications';
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Vedi tutte le notifiche
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;
export { NotificationItem, NotificationToast };
export type { NotificationCenterProps, NotificationItemProps };
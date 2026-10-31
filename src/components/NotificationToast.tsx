import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface NotificationToastProps {
    notification: { message: string; type: 'error' | 'success' } | null;
    onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = React.memo(({ notification, onClose }) => {
    if (!notification) return null;
    return (
        <div role={notification.type === 'error' ? 'alert' : 'status'} aria-live={notification.type === 'error' ? 'assertive' : 'polite'} className={`notification-toast ${notification.type}`}>
            {notification.type === 'error'
                ? <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                : <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            }
            <span className="text-sm font-medium">{notification.message}</span>
            <button type="button" onClick={onClose} className="notification-close" aria-label="Закрыть уведомление">
                <X className="w-4 h-4"/>
            </button>
        </div>
    );
});

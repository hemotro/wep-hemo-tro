/**
 * مكون الإشعارات المخصص
 * يعرض إشعارات عند إضافة حلقات جديدة أو تحديثات مهمة
 */
import { useEffect, useState } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

interface NotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function Notifications({ notifications, onRemove }: NotificationsProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onRemove,
}: {
  notification: Notification;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, onRemove]);

  const bgColor = {
    success: "bg-green-900/80 border-green-700",
    error: "bg-red-900/80 border-red-700",
    info: "bg-blue-900/80 border-blue-700",
    warning: "bg-yellow-900/80 border-yellow-700",
  }[notification.type];

  const textColor = {
    success: "text-green-100",
    error: "text-red-100",
    info: "text-blue-100",
    warning: "text-yellow-100",
  }[notification.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  }[notification.type];

  return (
    <div
      className={`${bgColor} border rounded-lg p-4 flex items-start gap-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-2`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textColor}`} />
      <div className="flex-1">
        <h3 className={`font-semibold ${textColor}`}>{notification.title}</h3>
        <p className={`text-sm ${textColor} opacity-90`}>{notification.message}</p>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className={`flex-shrink-0 ${textColor} hover:opacity-70 transition`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * Hook لإدارة الإشعارات
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    notification: Omit<Notification, "id">,
    duration: number = 5000
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [
      ...prev,
      { ...notification, id, duration },
    ]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const success = (title: string, message: string) => {
    addNotification({ type: "success", title, message });
  };

  const error = (title: string, message: string) => {
    addNotification({ type: "error", title, message });
  };

  const info = (title: string, message: string) => {
    addNotification({ type: "info", title, message });
  };

  const warning = (title: string, message: string) => {
    addNotification({ type: "warning", title, message });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  };
}

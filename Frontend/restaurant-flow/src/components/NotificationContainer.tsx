"use client";

import OrderNotification from "@/src/components/OrderNotification";
import type { OrderNotificationItem } from "@/src/hooks/useOrderNotifications";

const MAX_VISIBLE = 3;

interface NotificationContainerProps {
  notifications: OrderNotificationItem[];
  onDismiss: (id: string) => void;
}

export default function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  const visible = notifications.slice(-MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {visible.map((notification) => (
        <OrderNotification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

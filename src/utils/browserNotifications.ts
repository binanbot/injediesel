// Browser Notification utility
let notificationPermission: NotificationPermission = "default";

// Initialize permission status
if (typeof window !== "undefined" && "Notification" in window) {
  notificationPermission = Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    notificationPermission = "granted";
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === "granted";
  }

  return false;
}

export function canShowNotifications(): boolean {
  return "Notification" in window && notificationPermission === "granted";
}

export function isPageVisible(): boolean {
  return document.visibilityState === "visible";
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function showBrowserNotification({
  title,
  body,
  icon = "/favicon.ico",
  tag,
  onClick,
}: NotificationOptions): Notification | null {
  // Only show if page is not visible and we have permission
  if (isPageVisible()) {
    return null;
  }

  if (!canShowNotifications()) {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      tag, // Prevents duplicate notifications with same tag
      badge: icon,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      onClick?.();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.warn("Could not show notification:", error);
    return null;
  }
}

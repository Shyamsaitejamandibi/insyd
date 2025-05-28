import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "/api";

interface Notification {
  id: string;
  type: "FOLLOW" | "UNFOLLOW" | "NEW_FOLLOWER" | "ACTIVITY";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actorId?: string;
  actorName?: string;
}

export const useNotifications = (currentUserId: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    try {
      const response = await axios.get(
        `${API_BASE}/users/${currentUserId}/notifications`
      );
      setNotifications(response.data);

      const unreadResponse = await axios.get(
        `${API_BASE}/users/${currentUserId}/notifications/unread-count`
      );
      setUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`${API_BASE}/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;

    try {
      await axios.patch(
        `${API_BASE}/users/${currentUserId}/notifications/read-all`
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);

      // Refresh notifications to ensure sync with server
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    if (!currentUserId) return;

    const pollInterval = setInterval(fetchNotifications, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [currentUserId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};

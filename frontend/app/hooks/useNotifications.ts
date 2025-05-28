import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3001/api";

interface Notification {
  id: string;
  type: "FOLLOW" | "UNFOLLOW";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const useNotifications = (
  currentUserId: string | null,
  ws: WebSocket | null
) => {
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

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "notification") {
        setNotifications((prev) => [data.data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };
  }, [ws]);

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
};

import { PrismaClient, NotificationType } from "@prisma/client";
import { EventEmitter } from "events";

const prisma = new PrismaClient();

// Simple in-memory queue for notifications
class NotificationQueue extends EventEmitter {
  private queue: Array<{
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
  }> = [];

  private processing = false;

  async addToQueue(notification: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    const queueItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...notification,
      timestamp: new Date(),
    };

    this.queue.push(queueItem);
    console.log(
      `📬 Added notification to queue: ${queueItem.title} for user ${queueItem.userId}`
    );

    // Emit event for real-time updates
    this.emit("notification:queued", queueItem);

    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (notification) {
        try {
          // Simulate processing delay (in real app, this might be external service calls)
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Save to database
          const savedNotification = await prisma.notification.create({
            data: {
              userId: notification.userId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
            },
            include: {
              user: true,
            },
          });

          console.log(`✅ Processed notification: ${savedNotification.title}`);

          // Emit event for real-time updates
          this.emit("notification:processed", savedNotification);
        } catch (error) {
          console.error("❌ Failed to process notification:", error);
          // In a real app, you might want to retry or move to dead letter queue
        }
      }
    }

    this.processing = false;
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
    };
  }
}

export const notificationQueue = new NotificationQueue();

export class NotificationService {
  static async createFollowNotification(
    followerId: string,
    followingId: string
  ) {
    try {
      // Get user details
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
      });

      if (!follower) {
        throw new Error("Follower not found");
      }

      // Add to queue for processing
      await notificationQueue.addToQueue({
        userId: followingId,
        type: "FOLLOW",
        title: "New Follower",
        message: `${follower.name} started following you`,
      });

      return { success: true, message: "Follow notification queued" };
    } catch (error) {
      console.error("Error creating follow notification:", error);
      throw error;
    }
  }

  static async createUnfollowNotification(
    followerId: string,
    followingId: string
  ) {
    try {
      // Get user details
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
      });

      if (!follower) {
        throw new Error("Follower not found");
      }

      // Add to queue for processing
      await notificationQueue.addToQueue({
        userId: followingId,
        type: "UNFOLLOW",
        title: "User Unfollowed",
        message: `${follower.name} unfollowed you`,
      });

      return { success: true, message: "Unfollow notification queued" };
    } catch (error) {
      console.error("Error creating unfollow notification:", error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit to recent 50 notifications
      });

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }
}

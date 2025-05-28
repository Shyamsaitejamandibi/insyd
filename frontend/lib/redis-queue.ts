import { PrismaClient } from "@prisma/client";
import { redis } from "./redis";

const prisma = new PrismaClient();

// Process notifications from Redis queue
async function processNotifications() {
  try {
    while (true) {
      // Get notification from queue (blocking)
      const notificationData = await redis.brPop("notifications", 0);

      if (notificationData) {
        const notification = JSON.parse(notificationData.element);

        // Save to database
        await prisma.notification.create({
          data: {
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
          },
        });

        // Emit SSE event to connected clients
        const eventData = JSON.stringify(notification);
        await redis.publish("notification-events", eventData);
      }
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
    // Retry after a delay
    setTimeout(processNotifications, 5000);
  }
}

// Start processing notifications
processNotifications();

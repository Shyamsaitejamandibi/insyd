import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import {
  NotificationService,
  notificationQueue,
} from "./services/notificationService";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store WebSocket connections by user ID
const userConnections = new Map<string, any>();

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "subscribe" && data.userId) {
        userConnections.set(data.userId, ws);
        console.log(`User ${data.userId} subscribed to notifications`);

        ws.send(
          JSON.stringify({
            type: "subscribed",
            message: "Successfully subscribed to notifications",
          })
        );
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    // Remove connection from map
    for (const [userId, connection] of userConnections.entries()) {
      if (connection === ws) {
        userConnections.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Listen for processed notifications and send to connected users
notificationQueue.on("notification:processed", (notification) => {
  const userConnection = userConnections.get(notification.userId);
  if (userConnection && userConnection.readyState === 1) {
    // WebSocket.OPEN
    userConnection.send(
      JSON.stringify({
        type: "notification",
        data: notification,
      })
    );
  }
});

// API Routes

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user with follow status
app.get("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let isFollowing = false;
    if (currentUserId) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId as string,
            followingId: userId,
          },
        },
      });
      isFollowing = !!followRelation;
    }

    res.json({ ...user, isFollowing });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Follow a user
app.post("/api/users/:userId/follow", async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({ error: "followerId is required" });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    // Create notification (queued)
    await NotificationService.createFollowNotification(followerId, userId);

    res.json({ success: true, message: "Successfully followed user" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow a user
app.delete("/api/users/:userId/follow", async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({ error: "followerId is required" });
    }

    // Delete follow relationship
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: userId,
      },
    });

    if (deletedFollow.count === 0) {
      return res.status(400).json({ error: "Not following this user" });
    }

    // Create unfollow notification (queued)
    await NotificationService.createUnfollowNotification(followerId, userId);

    res.json({ success: true, message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Get user notifications
app.get("/api/users/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await NotificationService.getUserNotifications(
      userId
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread notification count
app.get("/api/users/:userId/notifications/unread-count", async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await NotificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark notification as read
app.patch("/api/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await NotificationService.markNotificationAsRead(
      notificationId
    );
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Get queue status (for debugging)
app.get("/api/queue/status", (req, res) => {
  const status = notificationQueue.getQueueStatus();
  res.json(status);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time notifications`);
});

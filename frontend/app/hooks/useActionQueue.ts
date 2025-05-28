import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "/api";

interface QueuedAction {
  id: string;
  type: "FOLLOW" | "UNFOLLOW";
  userId: string;
  currentUserId: string;
  status: "pending" | "processing" | "success" | "failed";
  timestamp: number;
  retryCount: number;
}

export const useActionQueue = (currentUserId: string | null) => {
  const [actionQueue, setActionQueue] = useState<QueuedAction[]>([]);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(
    new Set()
  );
  const queueProcessorRef = useRef<NodeJS.Timeout | null>(null);

  const addToQueue = (
    action: Omit<QueuedAction, "id" | "timestamp" | "retryCount" | "status">
  ) => {
    const existingPendingAction = actionQueue.find(
      (queuedAction) =>
        queuedAction.userId === action.userId &&
        queuedAction.currentUserId === action.currentUserId &&
        (queuedAction.status === "pending" ||
          queuedAction.status === "processing")
    );

    if (existingPendingAction) {
      console.log("Duplicate action prevented for user:", action.userId);
      return existingPendingAction.id;
    }

    const queuedAction: QueuedAction = {
      ...action,
      id: `${action.type}_${action.userId}_${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    };

    setActionQueue((prev) => [...prev, queuedAction]);
    return queuedAction.id;
  };

  const updateQueueItemStatus = (
    id: string,
    status: QueuedAction["status"]
  ) => {
    setActionQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const processQueue = async () => {
    const pendingActions = actionQueue.filter(
      (action) => action.status === "pending"
    );

    if (pendingActions.length === 0) return;

    const action = pendingActions[0];

    try {
      updateQueueItemStatus(action.id, "processing");

      let response;
      if (action.type === "FOLLOW") {
        response = await axios.post(
          `${API_BASE}/users/${action.userId}/follow`,
          {
            followerId: action.currentUserId,
          }
        );
      } else {
        response = await axios.delete(
          `${API_BASE}/users/${action.userId}/follow`,
          {
            data: { followerId: action.currentUserId },
          }
        );
      }

      updateQueueItemStatus(action.id, "success");

      // Remove user from processing state
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(action.userId);
        return newSet;
      });

      // Show success toast
      toast(`Successfully ${action.type.toLowerCase()}ed user`);
    } catch (error: any) {
      console.error(`Error processing ${action.type} action:`, error);

      let shouldRollback = true;

      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || "";
        if (
          errorMessage.includes("Already following") ||
          errorMessage.includes("Not following")
        ) {
          shouldRollback = false;
          updateQueueItemStatus(action.id, "success");
        }
      }

      if (shouldRollback) {
        setActionQueue((prev) =>
          prev.map((item) =>
            item.id === action.id
              ? { ...item, retryCount: item.retryCount + 1, status: "failed" }
              : item
          )
        );

        toast(`Failed to ${action.type.toLowerCase()} user. Will retry...`);
      }

      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(action.userId);
        return newSet;
      });
    }

    // Clean up successful actions after 3 seconds
    setTimeout(() => {
      setActionQueue((prev) =>
        prev.filter((action) => action.status !== "success")
      );
    }, 3000);
  };

  // Start queue processor
  useEffect(() => {
    if (actionQueue.length > 0 && !queueProcessorRef.current) {
      queueProcessorRef.current = setInterval(() => {
        processQueue();
      }, 1000);
    } else if (actionQueue.length === 0 && queueProcessorRef.current) {
      clearInterval(queueProcessorRef.current);
      queueProcessorRef.current = null;
    }

    return () => {
      if (queueProcessorRef.current) {
        clearInterval(queueProcessorRef.current);
        queueProcessorRef.current = null;
      }
    };
  }, [actionQueue.length]);

  // Auto-retry failed actions
  useEffect(() => {
    const failedActions = actionQueue.filter(
      (action) => action.status === "failed" && action.retryCount < 3
    );

    if (failedActions.length > 0) {
      const retryTimer = setTimeout(() => {
        setActionQueue((prev) =>
          prev.map((action) => {
            if (action.status === "failed" && action.retryCount < 3) {
              return { ...action, status: "pending" };
            }
            return action;
          })
        );
      }, 5000);

      return () => clearTimeout(retryTimer);
    }
  }, [actionQueue]);

  return {
    actionQueue,
    processingUsers,
    addToQueue,
    setProcessingUsers,
  };
};

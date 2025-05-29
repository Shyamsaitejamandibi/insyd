import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "/api";
const DEBOUNCE_DELAY = 500; // 500ms debounce delay
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

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
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addToQueue = useCallback(
    (
      action: Omit<QueuedAction, "id" | "timestamp" | "retryCount" | "status">
    ) => {
      // Clear any existing debounce timer for this user
      const existingTimer = debounceTimersRef.current.get(action.userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Check for existing pending/processing action
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

      // Set new debounce timer
      const timer = setTimeout(() => {
        const queuedAction: QueuedAction = {
          ...action,
          id: `${action.type}_${action.userId}_${Date.now()}`,
          timestamp: Date.now(),
          retryCount: 0,
          status: "pending",
        };

        setActionQueue((prev) => [...prev, queuedAction]);
        debounceTimersRef.current.delete(action.userId);
      }, DEBOUNCE_DELAY);

      debounceTimersRef.current.set(action.userId, timer);
      return null; // Return null since the action is debounced
    },
    [actionQueue]
  );

  const updateQueueItemStatus = useCallback(
    (id: string, status: QueuedAction["status"]) => {
      setActionQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    },
    []
  );

  const processQueue = useCallback(async () => {
    const pendingActions = actionQueue.filter(
      (action) => action.status === "pending"
    );

    if (pendingActions.length === 0) return;

    const action = pendingActions[0];

    // Skip if user is already being processed
    if (processingUsers.has(action.userId)) {
      return;
    }

    try {
      setProcessingUsers((prev) => new Set(prev).add(action.userId));
      updateQueueItemStatus(action.id, "processing");

      const endpoint = `${API_BASE}/users/${action.userId}/follow`;

      let response;
      if (action.type === "FOLLOW") {
        response = await axios.post(endpoint, {
          followerId: action.currentUserId,
        });
      } else {
        response = await axios.delete(endpoint, {
          data: { followerId: action.currentUserId },
        });
      }

      updateQueueItemStatus(action.id, "success");
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
    } finally {
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
  }, [actionQueue, processingUsers, updateQueueItemStatus]);

  // Start queue processor
  useEffect(() => {
    if (actionQueue.length > 0 && !queueProcessorRef.current) {
      queueProcessorRef.current = setInterval(processQueue, 1000);
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
  }, [actionQueue.length, processQueue]);

  // Auto-retry failed actions
  useEffect(() => {
    const failedActions = actionQueue.filter(
      (action) => action.status === "failed" && action.retryCount < MAX_RETRIES
    );

    if (failedActions.length > 0) {
      const retryTimer = setTimeout(() => {
        setActionQueue((prev) =>
          prev.map((action) => {
            if (action.status === "failed" && action.retryCount < MAX_RETRIES) {
              return { ...action, status: "pending" };
            }
            return action;
          })
        );
      }, RETRY_DELAY);

      return () => clearTimeout(retryTimer);
    }
  }, [actionQueue]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, []);

  return {
    actionQueue,
    processingUsers,
    addToQueue,
    setProcessingUsers,
  };
};

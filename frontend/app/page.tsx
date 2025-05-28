"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Header } from "./components/Header";
import { UserList } from "./components/UserList";
import { NotificationPanel } from "./components/NotificationPanel";
import { ActionQueuePanel } from "./components/ActionQueuePanel";
import { useActionQueue } from "./hooks/useActionQueue";
import { useNotifications } from "./hooks/useNotifications";
import { useUsers } from "./hooks/useUsers";

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // Custom hooks
  const { users, loading, fetchUsers, updateUserOptimistically } =
    useUsers(currentUserId);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(currentUserId);
  const { actionQueue, processingUsers, addToQueue, setProcessingUsers } =
    useActionQueue(currentUserId);

  // Toggle follow/unfollow
  const toggleFollow = async (
    userId: string,
    isCurrentlyFollowing: boolean
  ) => {
    if (!currentUserId) return;

    const newFollowState = !isCurrentlyFollowing;
    const actionType = newFollowState ? "FOLLOW" : "UNFOLLOW";

    // Optimistic UI update
    updateUserOptimistically(userId, newFollowState);

    // Add to queue
    const queueId = addToQueue({
      type: actionType,
      userId,
      currentUserId,
    });

    // Show immediate feedback
    const user = users.find((u) => u.id === userId);
    if (user && queueId) {
      toast(
        `${actionType === "FOLLOW" ? "Following" : "Unfollowing"} ${
          user.name
        }...`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <Header
          currentUserId={currentUserId}
          users={users}
          unreadCount={unreadCount}
          actionQueueLength={actionQueue.length}
          onUserChange={setCurrentUserId}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          onToggleQueue={() => setShowQueue(!showQueue)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <UserList
              users={users}
              currentUserId={currentUserId}
              onToggleFollow={toggleFollow}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Action Queue Panel */}
            {currentUserId && showQueue && (
              <ActionQueuePanel actionQueue={actionQueue} users={users} />
            )}

            {/* Notifications Panel */}
            {currentUserId && showNotifications && (
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Bell, Clock } from "lucide-react";

interface HeaderProps {
  currentUserId: string;
  users: Array<{ id: string; name: string }>;
  unreadCount: number;
  actionQueueLength: number;
  onUserChange: (userId: string) => void;
  onToggleNotifications: () => void;
  onToggleQueue: () => void;
}

export const Header = ({
  currentUserId,
  users,
  unreadCount,
  actionQueueLength,
  onUserChange,
  onToggleNotifications,
  onToggleQueue,
}: HeaderProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Insyd Notification System POC
      </h1>

      {/* User Selector */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-gray-700">
          Select Current User:
        </label>
        <select
          value={currentUserId}
          onChange={(e) => onUserChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white"
        >
          <option value="">-- Select a user --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      {currentUserId && (
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleNotifications}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Bell size={20} />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleQueue}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            <Clock size={20} />
            Action Queue
            {actionQueueLength > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                {actionQueueLength}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

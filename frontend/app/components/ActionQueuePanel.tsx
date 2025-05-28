import { Clock, CheckCircle, XCircle } from "lucide-react";

interface QueuedAction {
  id: string;
  type: "FOLLOW" | "UNFOLLOW";
  userId: string;
  currentUserId: string;
  status: "pending" | "processing" | "success" | "failed";
  timestamp: number;
  retryCount: number;
}

interface ActionQueuePanelProps {
  actionQueue: QueuedAction[];
  users: Array<{ id: string; name: string }>;
}

export const ActionQueuePanel = ({
  actionQueue,
  users,
}: ActionQueuePanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={20} />
        Action Queue ({actionQueue.length})
      </h3>

      {actionQueue.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending actions</p>
      ) : (
        <div className="space-y-3">
          {actionQueue.map((action) => {
            const user = users.find((u) => u.id === action.userId);
            return (
              <div
                key={action.id}
                className={`p-3 rounded-lg border ${
                  action.status === "success"
                    ? "bg-green-50 border-green-200"
                    : action.status === "failed"
                    ? "bg-red-50 border-red-200"
                    : action.status === "processing"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {action.type} {user?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {action.status === "success" && (
                      <CheckCircle size={16} className="text-green-600" />
                    )}
                    {action.status === "failed" && (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    {action.status === "processing" && (
                      <Clock
                        size={16}
                        className="text-yellow-600 animate-spin"
                      />
                    )}
                    {action.status === "pending" && (
                      <Clock size={16} className="text-gray-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  Status: {action.status}
                  {action.retryCount > 0 && ` (Retry: ${action.retryCount})`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

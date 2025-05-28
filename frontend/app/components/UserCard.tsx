import { UserPlus, UserMinus, Clock } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  _count: {
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

interface UserCardProps {
  user: User;
  currentUserId: string | null;
  isProcessing: boolean;
  onToggleFollow: (userId: string, isCurrentlyFollowing: boolean) => void;
}

export const UserCard = ({
  user,
  currentUserId,
  isProcessing,
  onToggleFollow,
}: UserCardProps) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {user.name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-medium text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>{user._count.followers} followers</span>
          <span className="mx-2">•</span>
          <span>{user._count.following} following</span>
        </div>

        {currentUserId && currentUserId !== user.id && (
          <button
            onClick={() => onToggleFollow(user.id, user.isFollowing || false)}
            disabled={isProcessing}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
              isProcessing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : user.isFollowing
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            {isProcessing ? (
              <>
                <Clock size={16} className="animate-spin" />
                Processing...
              </>
            ) : user.isFollowing ? (
              <>
                <UserMinus size={16} />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Follow
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

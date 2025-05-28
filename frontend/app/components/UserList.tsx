import { Users } from "lucide-react";
import { UserCard } from "./UserCard";

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

interface UserListProps {
  users: User[];
  currentUserId: string | null;
  onToggleFollow: (userId: string, isCurrentlyFollowing: boolean) => void;
}

export const UserList = ({
  users,
  currentUserId,
  onToggleFollow,
}: UserListProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users size={24} />
        Users
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            onToggleFollow={onToggleFollow}
          />
        ))}
      </div>
    </div>
  );
};

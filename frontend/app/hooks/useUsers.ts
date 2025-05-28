import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3001/api";

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

export const useUsers = (currentUserId: string | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (preserveOptimistic = false) => {
    try {
      const response = await axios.get(`${API_BASE}/users`);
      const usersData = response.data;

      if (currentUserId) {
        const usersWithFollowStatus = await Promise.all(
          usersData.map(async (user: User) => {
            if (user.id === currentUserId) return user;

            try {
              const userResponse = await axios.get(
                `${API_BASE}/users/${user.id}?currentUserId=${currentUserId}`
              );
              return userResponse.data;
            } catch (error) {
              return user;
            }
          })
        );
        setUsers(usersWithFollowStatus);
      } else {
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserOptimistically = (userId: string, isFollowing: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            isFollowing,
            _count: {
              ...user._count,
              followers: isFollowing
                ? user._count.followers + 1
                : user._count.followers - 1,
            },
          };
        }
        return user;
      })
    );
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUserId]);

  return {
    users,
    loading,
    fetchUsers,
    updateUserOptimistically,
  };
};

import { User } from '#/types';
import UserItem from '../user-item';
import './index.scss';

interface UserListProps {
  myUserId?: string;
  users: readonly User[];
  unreadCounts: Record<string, number>;
  onUserClick: (id: string) => void;
}

export default function UserList({
  myUserId, unreadCounts, users, onUserClick,
}: UserListProps) {
  return (
    <ul className="user-list">
      {users.map((user) => user.id !== myUserId && (
        <button
          key={user.id}
          type="button"
          onClick={() => onUserClick(user.id)}
        >
          <UserItem
            isMe={user.id === myUserId}
            user={user}
            unreadCount={unreadCounts[user.id] ?? 0}
          />
        </button>
      ))}
    </ul>
  );
}

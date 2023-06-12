import clsx from 'clsx';
import Avatar from '#/components/avatar';
import { User } from '#/types';
import './index.scss';

interface UserItemProps {
  isMe: boolean;
  user: User;
  unreadCount?: number;
  online?: boolean;
  className?: string;
}

export default function UserItem({
  isMe,
  user,
  unreadCount,
  online,
  className,
}: UserItemProps) {
  return (
    <div
      className={clsx('user-item', className, isMe && 'is-me')}
      title={`${user.user_name} ${isMe ? '(is me)' : ''}`}
    >
      <Avatar
        id={user.id}
        badge={unreadCount}
        online={online}
      />
      <div className="user-item__name">{user.user_name}</div>
    </div>
  );
}

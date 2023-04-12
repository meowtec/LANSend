import seedrandom from 'seedrandom';
import BorAvatar from 'boring-avatars';
import { useMemo } from 'react';
import clsx from 'clsx';
import './index.scss';

interface AvatarProps {
  id: string;
  className?: string;
}

function getAvatarColors(id: string) {
  const rand = seedrandom(id);
  const size = Math.floor(rand() * 3);
  return new Array(3 + size).fill(0).map(() => `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0')}`);
}

export default function Avatar({ id, className }: AvatarProps) {
  const colors = useMemo(() => getAvatarColors(id), [id]);

  return (
    <div
      className={clsx('avatar', className)}
    >
      <BorAvatar
        colors={colors}
        size={60}
      />
    </div>
  );
}

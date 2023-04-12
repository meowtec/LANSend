import { useCallback } from 'react';
import { ChatChannel } from '#/model/types';
import { useAppStore } from '#/model';
import { User } from '#/types';
import FullscreenModal from '#/components/fullscreen-modal';
import UserItem from '../user-item';
import MessageList from './message-list';
import InputBox from './input-box';
import './index.scss';

interface ChatProps {
  userInfo: User | null,
  channel: ChatChannel | null;
  onSubmit: (content: File | string) => void;
}

const userPlaceholder: User = {
  id: '',
  user_name: '...',
};

function Chat({
  channel, userInfo, onSubmit,
}: ChatProps) {
  return (
    <div className="chat">
      <div className="chat__header">
        <UserItem
          className="chat__user"
          isMe={false}
          user={userInfo ?? userPlaceholder}
        />
      </div>
      <MessageList
        className="chat__messages"
        messages={channel?.messages ?? []}
      />
      <InputBox
        onSubmit={onSubmit}
      />
    </div>
  );
}

export default function ChatConnected() {
  const showChat = useAppStore((state) => state.showChat);
  const channelInfo = useAppStore(useAppStore.selectors.selectCurrentChannel);
  const userId = channelInfo?.userId;

  const handleSubmit = useCallback((content: File | string) => {
    if (userId) {
      useAppStore.effects.sendMessage({ userId, message: content });
    }
  }, [userId]);

  return (
    <FullscreenModal
      visible={showChat && channelInfo !== null}
      onClose={useAppStore.reducers.exitChat}
    >
      {channelInfo ? (
        <Chat
          userInfo={channelInfo.userInfo ?? null}
          channel={channelInfo.channel ?? null}
          onSubmit={handleSubmit}
        />
      ) : null}
    </FullscreenModal>
  );
}

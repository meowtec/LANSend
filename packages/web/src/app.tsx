import { useCallback, useEffect } from 'react';
import equal from 'fast-deep-equal';
import { useAppStore } from './model';
import UserList from './views/user-list';
import ChatConnected from './views/chat';
import './app.scss';
import MyProfileConnected from './views/my-profile';
import Header from './views/header';

export default function App() {
  const {
    myUserId, users,
  } = useAppStore((state) => ({
    myUserId: state.userInfo?.id,
    users: state.users,
  }));

  const unreadCounts = useAppStore(useAppStore.selectors.selectUnreadCounts, equal);

  useEffect(() => {
    useAppStore.effects.connect();
    return () => {
      useAppStore.effects.disconnect();
    };
  }, []);

  const handleUserClick = useCallback((userId: string) => {
    if (userId === myUserId) {
      useAppStore.reducers.enterMyProfile();
    } else {
      useAppStore.reducers.enterChatWithUser(userId);
    }
  }, [myUserId]);

  return (
    <div>
      <Header
        myUserId={myUserId}
        onMyProfileClick={useAppStore.reducers.enterMyProfile}
      />
      <UserList
        myUserId={myUserId}
        users={users}
        unreadCounts={unreadCounts}
        onUserClick={handleUserClick}
      />
      <ChatConnected />
      <MyProfileConnected />
    </div>
  );
}

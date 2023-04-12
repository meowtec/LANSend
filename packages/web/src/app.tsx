import { useEffect } from 'react';
import { useAppStore } from './model';
import UserList from './views/user-list';
import ChatConnected from './views/chat';
import './app.scss';
import MyProfileConnected from './views/my-profile';

export default function App() {
  const {
    myUserId, users,
  } = useAppStore((state) => ({
    myUserId: state.userInfo?.id,
    users: state.users,
  }));

  useEffect(() => {
    void useAppStore.effects.fetchAndListen();
  }, []);

  return (
    <div>
      <UserList
        myUserId={myUserId}
        users={users}
        onUserClick={useAppStore.reducers.enterChatWithUser}
      />
      <ChatConnected />
      <MyProfileConnected />
    </div>
  );
}

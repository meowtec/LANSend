import { useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import FullscreenModal from '#/components/fullscreen-modal';
import { useAppStore } from '#/model';
import { User } from '#/types';
import Avatar from '#/components/avatar';
import Editable from '#/components/editable';
import './index.scss';

interface MyProfileProps {
  userInfo: User;
  onChange: (userInfo: User) => void;
}

function MyProfile({
  userInfo,
  onChange,
}: MyProfileProps) {
  const handleUserNameChange = useCallback((value: string) => {
    onChange({ ...userInfo, user_name: value });
  }, [userInfo, onChange]);

  return (
    <div className="my-profile">
      <h2>My profile</h2>
      <div className="my-profile__content">
        <Avatar
          id={userInfo.id}
        />
        <Editable
          value={userInfo.user_name}
          onChange={handleUserNameChange}
        />
      </div>
    </div>
  );
}

export default function MyProfileConnected() {
  const {
    userInfo,
    showMyProfile,
  } = useAppStore((state) => ({
    userInfo: state.userInfo,
    showMyProfile: state.showMyProfile,
  }), shallow);

  return (
    <FullscreenModal
      visible={showMyProfile}
      onClose={useAppStore.reducers.exitMyProfile}
    >
      {userInfo ? (
        <MyProfile
          userInfo={userInfo}
          onChange={useAppStore.effects.modifyUserInfo}
        />
      ) : null}
    </FullscreenModal>
  );
}

import logo from '#/assets/logo.svg';
import Avatar from '#/components/avatar';
import './index.scss';

interface HeaderProps {
  myUserId: string | undefined;
  onMyProfileClick: () => void;
}

export default function Header({ myUserId, onMyProfileClick }: HeaderProps) {
  return (
    <div className="header">
      <img src={logo} className="header__logo" alt="logo" />
      <button type="button" className="header__avatar-btn" onClick={onMyProfileClick}>
        <Avatar id={myUserId ?? ''} className="header__avatar" />
      </button>
    </div>
  );
}

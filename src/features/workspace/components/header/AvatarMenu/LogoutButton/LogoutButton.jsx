import './LogoutButton.css';
import logoutIcon from '../../../../../../assets/icons/account-logout.svg';
import IconImage from '../Shared/IconImage';

export default function LogoutButton() {
  return (
    <div className="avatar-menu__logout-wrap">
      <button className="avatar-menu__logout" type="button">
        <IconImage src={logoutIcon} />
        <span>Log out</span>
      </button>
    </div>
  );
}

import './AccountProfile.css';
import editAvatarIcon from '../../../../../../assets/icons/account-edit-avatar.svg';
import IconImage from '../Shared/IconImage';

export default function AccountProfile() {
  return (
    <div className="avatar-menu__profile">
      <div className="avatar-menu__avatar-wrap">
        <div className="avatar-menu__avatar" />
        <button className="avatar-menu__avatar-edit" type="button" aria-label="Edit profile photo">
          <IconImage src={editAvatarIcon} />
        </button>
      </div>
      <div className="avatar-menu__name">Q X</div>
      <div className="avatar-menu__email-wrap">
        <div className="avatar-menu__email">lowvincent8@gmail.com</div>
      </div>
    </div>
  );
}

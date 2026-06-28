import './AvatarMenu.css';
import appearanceIcon from '../../../../assets/icons/account-appearance.svg';
import closeIcon from '../../../../assets/icons/account-close.svg';
import helpIcon from '../../../../assets/icons/account-help.svg';
import languageIcon from '../../../../assets/icons/account-language.svg';
import logoutIcon from '../../../../assets/icons/account-logout.svg';

function IconImage({ src }) {
  return <img src={src} alt="" aria-hidden="true" />;
}

function DownChevronIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3.2 5.2 7 9l3.8-3.8" />
    </svg>
  );
}

export default function AvatarMenu({ onClose }) {
  return (
    <div className="avatar-menu__backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="avatar-menu" onClick={(event) => event.stopPropagation()}>
        <div className="avatar-menu__top">
          <button className="avatar-menu__close" onClick={onClose} aria-label="Close menu">
            <IconImage src={closeIcon} />
          </button>
        </div>

        <div className="avatar-menu__profile">
          <div className="avatar-menu__avatar" />
          <div className="avatar-menu__name">Q X</div>
          <div className="avatar-menu__email-wrap">
            <div className="avatar-menu__email">lowvincent8@gmail.com</div>
          </div>
        </div>

        <div className="avatar-menu__storage-card">
          <div className="avatar-menu__storage-header">
            <span className="avatar-menu__storage-title">Storage</span>
            <span className="avatar-menu__storage-usage">
              <strong>0.2GB</strong> / 2GB
            </span>
          </div>
          <div className="avatar-menu__storage-progress">
            <div className="avatar-menu__storage-progress-bar" style={{ width: '12%' }} />
          </div>
          <div className="avatar-menu__storage-footer">Manage storage</div>
        </div>

        <div className="avatar-menu__settings-card">
          <div className="avatar-menu__row">
            <div className="avatar-menu__row-left">
              <div className="avatar-menu__icon">
                <IconImage src={languageIcon} />
              </div>
              <span className="avatar-menu__row-label">Language</span>
            </div>
            <div className="avatar-menu__row-right">
              <span className="avatar-menu__row-value">EN</span>
              <div className="avatar-menu__chevron">
                <DownChevronIcon />
              </div>
            </div>
          </div>

          <div className="avatar-menu__row">
            <div className="avatar-menu__row-left">
              <div className="avatar-menu__icon">
                <IconImage src={appearanceIcon} />
              </div>
              <span className="avatar-menu__row-label">Appearance</span>
            </div>
            <div className="avatar-menu__row-right">
              <span className="avatar-menu__row-value">Light</span>
              <div className="avatar-menu__chevron">
                <DownChevronIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="avatar-menu__settings-card avatar-menu__help-card">
          <div className="avatar-menu__row">
            <div className="avatar-menu__row-left">
              <div className="avatar-menu__icon">
                <IconImage src={helpIcon} />
              </div>
              <span className="avatar-menu__row-label">Help & Feedback</span>
            </div>
          </div>
        </div>

        <div className="avatar-menu__logout-wrap">
          <button className="avatar-menu__logout" type="button">
            <IconImage src={logoutIcon} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

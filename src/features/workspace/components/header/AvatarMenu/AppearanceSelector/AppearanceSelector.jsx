import '../Shared/MenuRow.css';
import './AppearanceSelector.css';
import appearanceIcon from '../../../../../../assets/icons/account-appearance.svg';
import checkIcon from '../../../../../../assets/icons/account-check.svg';
import IconImage from '../Shared/IconImage';
import DownChevronIcon from '../Shared/DownChevronIcon';

export default function AppearanceSelector({ appearanceOpen, toggleAppearanceMenu, closeAppearanceMenu }) {
  return (
    <div className="avatar-menu__row avatar-menu__row--appearance">
      <div className="avatar-menu__row-left">
        <div className="avatar-menu__icon">
          <IconImage src={appearanceIcon} />
        </div>
        <span className="avatar-menu__row-label">Appearance</span>
      </div>
      <button
        className="avatar-menu__row-right avatar-menu__select-trigger avatar-menu__appearance-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={appearanceOpen}
        onClick={toggleAppearanceMenu}
      >
        <span className="avatar-menu__row-value">Light</span>
        <div className="avatar-menu__chevron">
          <DownChevronIcon />
        </div>
      </button>
      {appearanceOpen && (
        <div className="avatar-menu__select-menu avatar-menu__appearance-menu" role="menu" aria-label="Appearance">
          <button className="avatar-menu__select-option avatar-menu__appearance-option" type="button" onClick={closeAppearanceMenu} role="menuitem">
            <span>Light</span>
            <IconImage src={checkIcon} />
          </button>
          <button className="avatar-menu__select-option avatar-menu__appearance-option" type="button" onClick={closeAppearanceMenu} role="menuitem">
            <span>Dark</span>
          </button>
        </div>
      )}
    </div>
  );
}

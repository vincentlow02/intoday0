import './LanguageSelector.css';
import '../Shared/MenuRow.css';
import languageIcon from '../../../../../../assets/icons/account-language.svg';
import checkIcon from '../../../../../../assets/icons/account-check.svg';
import IconImage from '../Shared/IconImage';
import DownChevronIcon from '../Shared/DownChevronIcon';

const LANGUAGE_OPTIONS = ['English', '日本語', '简体中文', '繁體中文', 'ไทย'];

export default function LanguageSelector({ languageOpen, closeLanguageMenu, toggleLanguageMenu }) {
  return (
    <div className="avatar-menu__row avatar-menu__row--language">
      <div className="avatar-menu__row-left">
        <div className="avatar-menu__icon">
          <IconImage src={languageIcon} />
        </div>
        <span className="avatar-menu__row-label">Language</span>
      </div>
      <button
        className="avatar-menu__row-right avatar-menu__select-trigger avatar-menu__language-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={languageOpen}
        onClick={toggleLanguageMenu}
      >
        <span className="avatar-menu__row-value">EN</span>
        <div className="avatar-menu__chevron">
          <DownChevronIcon />
        </div>
      </button>
      {languageOpen && (
        <div className="avatar-menu__select-menu avatar-menu__language-menu" role="menu" aria-label="Language">
          {LANGUAGE_OPTIONS.map((language, index) => (
            <button
              className="avatar-menu__select-option avatar-menu__language-option"
              type="button"
              onClick={closeLanguageMenu}
              role="menuitem"
              key={language}
            >
              <span>{language}</span>
              {index === 0 && <IconImage src={checkIcon} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

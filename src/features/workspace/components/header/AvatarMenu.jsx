import { useState } from 'react';
import './AvatarMenu.css';
import appearanceIcon from '../../../../assets/icons/account-appearance.svg';
import arrowRightIcon from '../../../../assets/icons/account-arrow-right.svg';
import backIcon from '../../../../assets/icons/account-back.svg';
import checkIcon from '../../../../assets/icons/account-check.svg';
import closeIcon from '../../../../assets/icons/account-close.svg';
import helpIcon from '../../../../assets/icons/account-help.svg';
import languageIcon from '../../../../assets/icons/account-language.svg';
import logoutIcon from '../../../../assets/icons/account-logout.svg';
import recentlyDeletedEmptyIcon from '../../../../assets/icons/recently-deleted-empty.svg';
import recentlyDeletedIcon from '../../../../assets/icons/account-recently-deleted.svg';

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

const LANGUAGE_OPTIONS = ['English', '日本語', '简体中文', '繁體中文', 'ไทย'];

export default function AvatarMenu({ onClose }) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [recentlyDeletedOpen, setRecentlyDeletedOpen] = useState(false);

  const toggleLanguageMenu = () => {
    setAppearanceOpen(false);
    setLanguageOpen((isOpen) => !isOpen);
  };

  const closeLanguageMenu = () => {
    setLanguageOpen(false);
  };

  const toggleAppearanceMenu = () => {
    setLanguageOpen(false);
    setAppearanceOpen((isOpen) => !isOpen);
  };

  const closeAppearanceMenu = () => {
    setAppearanceOpen(false);
  };

  const openRecentlyDeleted = () => {
    setLanguageOpen(false);
    setAppearanceOpen(false);
    setRecentlyDeletedOpen(true);
  };

  const closeRecentlyDeleted = () => {
    setRecentlyDeletedOpen(false);
  };

  return (
    <div
      className={`avatar-menu__backdrop${recentlyDeletedOpen ? ' avatar-menu__backdrop--deleted' : ''}`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {recentlyDeletedOpen ? (
        <div className="recently-deleted-panel" onClick={(event) => event.stopPropagation()}>
          <div className="recently-deleted-panel__content">
            <div className="recently-deleted-panel__top">
              <button className="recently-deleted-panel__back" type="button" onClick={closeRecentlyDeleted} aria-label="Back to account panel">
                <IconImage src={backIcon} />
              </button>
              <button className="recently-deleted-panel__close" type="button" onClick={onClose} aria-label="Close recently deleted">
                <IconImage src={closeIcon} />
              </button>
            </div>

            <div className="recently-deleted-panel__header">
              <h2>Recently deleted</h2>
              <p>Items will be permanently deleted after 30 days.</p>
            </div>
          </div>

          <div className="recently-deleted-panel__empty">
            <IconImage src={recentlyDeletedEmptyIcon} />
            <div className="recently-deleted-panel__empty-copy">
              <h3>No items here</h3>
              <p>Deleted items will appear here</p>
            </div>
          </div>
        </div>
      ) : (
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

          <button className="avatar-menu__row avatar-menu__row-button" type="button" onClick={openRecentlyDeleted}>
            <div className="avatar-menu__row-left avatar-menu__row-left--deleted">
              <div className="avatar-menu__icon avatar-menu__icon--deleted">
                <IconImage src={recentlyDeletedIcon} />
              </div>
              <span className="avatar-menu__row-label">Recently deleted</span>
            </div>
            <div className="avatar-menu__row-right">
              <div className="avatar-menu__arrow-right">
                <IconImage src={arrowRightIcon} />
              </div>
            </div>
          </button>
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
      )}
    </div>
  );
}

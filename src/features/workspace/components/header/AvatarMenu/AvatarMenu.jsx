import { useState } from 'react';
import './AvatarMenu.css';
import closeIcon from '../../../../../assets/icons/account-close.svg';
import IconImage from './Shared/IconImage';
import AccountProfile from './AccountProfile/AccountProfile';
import StorageCard from './StorageCard/StorageCard';
import SettingsCard from './SettingsCard/SettingsCard';
import LanguageSelector from './LanguageSelector/LanguageSelector';
import AppearanceSelector from './AppearanceSelector/AppearanceSelector';
import RecentlyDeletedButton from './RecentlyDeletedButton/RecentlyDeletedButton';
import RecentlyDeletedPanel from './RecentlyDeletedPanel/RecentlyDeletedPanel';
import HelpCard from './HelpCard/HelpCard';
import LogoutButton from './LogoutButton/LogoutButton';

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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      {recentlyDeletedOpen ? (
        <RecentlyDeletedPanel closeRecentlyDeleted={closeRecentlyDeleted} onClose={onClose} />
      ) : (
        <div className="avatar-menu">
          <div className="avatar-menu__top">
            <button className="avatar-menu__close" onClick={onClose} aria-label="Close menu">
              <IconImage src={closeIcon} />
            </button>
          </div>

          <AccountProfile />
          
          <StorageCard />

          <SettingsCard>
            <LanguageSelector
              languageOpen={languageOpen}
              closeLanguageMenu={closeLanguageMenu}
              toggleLanguageMenu={toggleLanguageMenu}
            />
            <AppearanceSelector
              appearanceOpen={appearanceOpen}
              toggleAppearanceMenu={toggleAppearanceMenu}
              closeAppearanceMenu={closeAppearanceMenu}
            />
            <RecentlyDeletedButton openRecentlyDeleted={openRecentlyDeleted} />
          </SettingsCard>

          <HelpCard />

          <LogoutButton />
        </div>
      )}
    </div>
  );
}

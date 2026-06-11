import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLanguageLabel, PROFILE_LANGUAGE_OPTIONS } from '../lib/language';
import { translations } from '../lib/translations';
import { getUserProfile } from '../userProfile';

const APPEARANCE_OPTIONS = ['dark', 'light'];
const COMPACT_LANGUAGE_OPTIONS = PROFILE_LANGUAGE_OPTIONS.filter((option) => (
  ['EN', 'ZH', 'MS', 'JA', 'TH'].includes(option.value)
));

const getAppearanceOptionLabel = (option, t) => {
  if (option === 'dark') return t.dark;
  return t.light;
};

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 17.5C11.6625 17.4999 13.2779 16.9477 14.5925 15.93C15.9072 14.9124 16.8466 13.4869 17.2633 11.8775M10 17.5C8.33751 17.4999 6.72212 16.9477 5.40748 15.93C4.09284 14.9124 3.1534 13.4869 2.73667 11.8775M10 17.5C12.0708 17.5 13.75 14.1417 13.75 10C13.75 5.85833 12.0708 2.5 10 2.5M10 17.5C7.92917 17.5 6.25 14.1417 6.25 10C6.25 5.85833 7.92917 2.5 10 2.5M17.2633 11.8775C17.4175 11.2775 17.5 10.6483 17.5 10C17.5021 8.71009 17.1699 7.44166 16.5358 6.31833M17.2633 11.8775C15.041 13.1095 12.541 13.754 10 13.75C7.365 13.75 4.88917 13.0708 2.73667 11.8775M2.73667 11.8775C2.57896 11.2641 2.49944 10.6333 2.5 10C2.5 8.6625 2.85 7.40583 3.46417 6.31833M10 2.5C11.3302 2.49945 12.6366 2.8528 13.7852 3.5238C14.9337 4.19481 15.8831 5.15931 16.5358 6.31833M10 2.5C8.6698 2.49945 7.3634 2.8528 6.21484 3.5238C5.06628 4.19481 4.11692 5.15931 3.46417 6.31833M16.5358 6.31833C14.7214 7.88994 12.4004 8.75345 10 8.75C7.50167 8.75 5.21667 7.83333 3.46417 6.31833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4.93 4.93L6.34 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17.66 17.66L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M2 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4.93 19.07L6.34 17.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06472C14.6713 8.60793 14.9211 9.29414 14.92 10.002C14.92 12.002 11.92 13.002 11.92 13.002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10 7V5.5C10 4.67 10.67 4 11.5 4H18C18.83 4 19.5 4.67 19.5 5.5V18.5C19.5 19.33 18.83 20 18 20H11.5C10.67 20 10 19.33 10 18.5V17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M14 12H4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M7.5 9L4.5 12L7.5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SettingsRow = ({
  icon,
  label,
  value,
  expanded,
  onClick,
  children,
  panelClassName = '',
  chevronVariant = 'right',
}) => (
  <div className={`desktop-profile-setting ${expanded ? 'is-expanded' : ''}`}>
    <button type="button" className="desktop-profile-setting-trigger" onClick={onClick}>
      <span className="desktop-profile-setting-main">
        <span className="desktop-profile-setting-icon">{icon}</span>
        <span className="desktop-profile-setting-label">{label}</span>
      </span>
      <span className="desktop-profile-setting-end">
        <span className="desktop-profile-setting-value">{value}</span>
        <span className={`desktop-profile-setting-chevron desktop-profile-setting-chevron-${chevronVariant}`}>
          <ChevronRightIcon />
        </span>
      </span>
    </button>
    {expanded ? <div className={`desktop-profile-setting-popover ${panelClassName}`.trim()}>{children}</div> : null}
  </div>
);

function DesktopProfilePage({
  open,
  onClose,
  user,
  language,
  setLanguage,
  appearance,
  appearancePreference = appearance,
  setAppearance,
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const contentRef = useRef(null);
  const profile = useMemo(() => getUserProfile(user), [user]);
  const hasCustomAvatar = Boolean(profile.avatarUrl && !profile.avatarUrl.includes('default-user'));
  const t = translations[language] || translations.EN;
  const handleClose = useCallback(() => {
    setExpandedSection(null);
    onClose();
  }, [onClose]);
  const handlePageClick = useCallback((event) => {
    // If the click is on the backdrop (.desktop-profile-page), close it
    if (event.target.classList.contains('desktop-profile-page')) {
      handleClose();
    }
  }, [handleClose]);
  const handleStageClick = useCallback((event) => {
    event.stopPropagation();
    if (!event.target.closest('.desktop-profile-setting')) {
      setExpandedSection(null);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className={`desktop-profile-page desktop-profile-page-${appearance}`} role="dialog" aria-modal="true" aria-labelledby="desktop-profile-title" onClick={handlePageClick}>
      <div className="desktop-profile-page-orb desktop-profile-page-orb-left" aria-hidden="true" />
      <div className="desktop-profile-page-orb desktop-profile-page-orb-right" aria-hidden="true" />

      <div className="desktop-profile-stage" onClick={handleStageClick}>
        <button type="button" className="desktop-profile-page-close" onClick={handleClose} aria-label={t.close}>
          <CloseIcon />
        </button>

        <div className="desktop-profile-content" ref={contentRef}>
          <div className="desktop-profile-header-block">
            <div className="desktop-profile-avatar-frame">
              {hasCustomAvatar ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="desktop-profile-avatar-image" />
              ) : (
                <span className="desktop-profile-avatar-fallback">{profile.initial}</span>
              )}
            </div>
            <h2 className="desktop-profile-title" id="desktop-profile-title">
              {(profile.fullName || 'USER').toUpperCase()}
            </h2>
            <p className="desktop-profile-subtitle">{profile.email || ''}</p>
          </div>

          <div className="desktop-profile-storage-card">
            <div className="desktop-profile-storage-header">
              <span>Storage</span>
              <span><strong>0.2GB</strong> / 2GB</span>
            </div>
            <div className="desktop-profile-storage-track" aria-hidden="true">
              <span className="desktop-profile-storage-fill" />
            </div>
            <div className="desktop-profile-storage-footer">
              <span>Manage storage</span>
            </div>
          </div>

          <div className="desktop-profile-card">
            <SettingsRow
              icon={<GlobeIcon />}
              label={t.language}
              value={getLanguageLabel(language)}
              expanded={expandedSection === 'language'}
              onClick={() => setExpandedSection((current) => (current === 'language' ? null : 'language'))}
              panelClassName="desktop-profile-select-popover"
              chevronVariant="down"
            >
              <div className="desktop-profile-select-menu">
                {COMPACT_LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`desktop-profile-select-option ${language === option.value ? 'is-active' : ''}`}
                    onClick={() => {
                      setLanguage(option.value);
                      setExpandedSection(null);
                    }}
                  >
                    <span>{option.label}</span>
                    {language === option.value ? <CheckIcon /> : null}
                  </button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow
              icon={<SunIcon />}
              label={t.appearance}
              value={getAppearanceOptionLabel(appearancePreference, t)}
              expanded={expandedSection === 'appearance'}
              onClick={() => setExpandedSection((current) => (current === 'appearance' ? null : 'appearance'))}
              panelClassName="desktop-profile-select-popover"
              chevronVariant="down"
            >
              <div className="desktop-profile-select-menu">
                {APPEARANCE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`desktop-profile-select-option ${appearancePreference === option ? 'is-active' : ''}`}
                    onClick={() => {
                      setAppearance(option);
                      setExpandedSection(null);
                    }}
                  >
                    <span>{getAppearanceOptionLabel(option, t)}</span>
                    {appearancePreference === option ? <CheckIcon /> : null}
                  </button>
                ))}
              </div>
            </SettingsRow>
          </div>

          <div className="desktop-profile-card desktop-profile-card-single">
            <div className="desktop-profile-static-row">
              <span className="desktop-profile-setting-main">
                <span className="desktop-profile-setting-icon">
                  <HelpIcon />
                </span>
                <span className="desktop-profile-setting-label">{t.helpFeedback}</span>
              </span>
            </div>
          </div>

          <button type="button" className="desktop-profile-logout-button" onClick={handleClose}>
            <LogoutIcon />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DesktopProfilePage;

import React from 'react';

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2.5 2.5l7 7m0-7l-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5" />
      <path d="M2 7h10M7 2c-2 3-2 7 0 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5" />
      <path d="M7 2v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5" />
      <path d="M7 4.5v3M7 10h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M8.5 3.5v-1a1 1 0 00-1-1h-4a1 1 0 00-1 1v9a1 1 0 001 1h4a1 1 0 001-1v-1m2.5-3.5h-7m4-2.5l2.5 2.5-2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AvatarMenu({ onClose }) {
  return (
    <div className="avatar-menu">
      <button className="avatar-menu__close" onClick={onClose} aria-label="Close menu">
        <CloseIcon />
      </button>

      <div className="avatar-menu__profile">
        <div className="avatar-menu__avatar"></div>
        <div className="avatar-menu__name">Q X</div>
        <div className="avatar-menu__email">lowvincent8@gmail.com</div>
      </div>

      <div className="avatar-menu__storage-card">
        <div className="avatar-menu__storage-header">
          <span className="avatar-menu__storage-title">Storage</span>
          <span className="avatar-menu__storage-usage">
            <strong>0.2GB</strong> / 2GB
          </span>
        </div>
        <div className="avatar-menu__storage-progress">
          <div className="avatar-menu__storage-progress-bar" style={{ width: '10%' }}></div>
        </div>
        <div className="avatar-menu__storage-footer">
          Manage storage
        </div>
      </div>

      <div className="avatar-menu__settings-card">
        <div className="avatar-menu__row">
          <div className="avatar-menu__row-left">
            <div className="avatar-menu__icon"><LanguageIcon /></div>
            <span className="avatar-menu__row-label">Language</span>
          </div>
          <div className="avatar-menu__row-right">
            <span className="avatar-menu__row-value">EN</span>
            <div className="avatar-menu__chevron">
               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M4.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        <div className="avatar-menu__row">
          <div className="avatar-menu__row-left">
            <div className="avatar-menu__icon"><AppearanceIcon /></div>
            <span className="avatar-menu__row-label">Appearance</span>
          </div>
          <div className="avatar-menu__row-right">
            <span className="avatar-menu__row-value">Light</span>
            <div className="avatar-menu__chevron">
               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M4.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="avatar-menu__settings-card">
        <div className="avatar-menu__row">
          <div className="avatar-menu__row-left">
            <div className="avatar-menu__icon"><HelpIcon /></div>
            <span className="avatar-menu__row-label">Help & Feedback</span>
          </div>
        </div>
      </div>

      <button className="avatar-menu__logout" type="button">
        <LogoutIcon />
        <span>退出登录</span>
      </button>
    </div>
  );
}

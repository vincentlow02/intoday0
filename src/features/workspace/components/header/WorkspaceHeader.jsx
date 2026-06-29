import { useState } from 'react';
import './WorkspaceHeader.css';
import AvatarMenu from './AvatarMenu';
import SearchPanel from './SearchPanel';
import WorkspaceSwitcherMenu from './WorkspaceSwitcherMenu';

function ChevronDownIcon() {
  return (
    <svg className="workspace-header-icon workspace-header-icon--menu" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.4 4.8 6 7.2l2.6-2.4" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="workspace-header-icon workspace-header-icon--view" viewBox="0 0 6 9" aria-hidden="true">
      <path d="M4.7 1.1 1.3 4.5l3.4 3.4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="workspace-header-icon workspace-header-icon--view" viewBox="0 0 6 9" aria-hidden="true">
      <path d="M1.3 1.1 4.7 4.5 1.3 7.9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="workspace-header-icon workspace-header-icon--search" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m11.4 11.4 2.1 2.1" />
      <circle cx="7.2" cy="7.2" r="4.7" />
    </svg>
  );
}

export default function WorkspaceHeader({ activeView = "Canvas", setActiveView }) {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

  return (
    <header className="workspace-header" aria-label="Workspace header">
      <div className="workspace-header-section left">
        <div className="workspace-brand-wrap">
          <button
            type="button"
            className="workspace-brand-switcher"
            aria-label="Workspace menu"
            aria-expanded={isWorkspaceMenuOpen}
            onClick={() => {
              setIsWorkspaceMenuOpen((value) => !value);
              setIsAvatarMenuOpen(false);
              setIsSearchPanelOpen(false);
            }}
          >
            <span className="workspace-brand-title">testing3</span>
            <span className="workspace-brand-menu" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </button>

          {isWorkspaceMenuOpen && (
            <WorkspaceSwitcherMenu />
          )}
        </div>
      </div>

      <div className="workspace-header-section center">
        <div className="workspace-view-toggle" aria-label={`${activeView} view`}>
          <button
            type="button"
            className="workspace-view-icon-button active"
            aria-label="Previous view"
            disabled={activeView === "Canvas"}
            onClick={() => setActiveView?.("Canvas")}
          >
            <ChevronLeftIcon />
          </button>

          <button
            type="button"
            className="workspace-view-label"
            aria-current="page"
            onClick={() => setActiveView?.(activeView === "Canvas" ? "Collection" : "Canvas")}
          >
            {activeView}
          </button>

          <button
            type="button"
            className="workspace-view-icon-button"
            aria-label="Next view"
            disabled={activeView === "Collection"}
            onClick={() => setActiveView?.("Collection")}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="workspace-header-section right">
        <div className="workspace-header-actions">
          <button
            type="button"
            className="workspace-header-icon-button"
            aria-label="Search"
            aria-expanded={isSearchPanelOpen}
            onClick={() => {
              setIsSearchPanelOpen((value) => !value);
              setIsAvatarMenuOpen(false);
              setIsWorkspaceMenuOpen(false);
            }}
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            className="workspace-avatar-button"
            aria-label="Account"
            aria-expanded={isAvatarMenuOpen}
            onClick={() => {
              setIsAvatarMenuOpen((value) => !value);
              setIsWorkspaceMenuOpen(false);
              setIsSearchPanelOpen(false);
            }}
          >
            <span className="workspace-avatar-core" aria-hidden="true" />
          </button>

          {isAvatarMenuOpen && (
            <AvatarMenu onClose={() => setIsAvatarMenuOpen(false)} />
          )}

          {isSearchPanelOpen && (
            <SearchPanel onClose={() => setIsSearchPanelOpen(false)} />
          )}
        </div>
      </div>
    </header>
  );
}

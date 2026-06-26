function ChevronDownIcon() {
  return (
    <svg
      className="workspace-header-icon"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        d="M3.25 4.75 6 7.25l2.75-2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      className="workspace-header-icon"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        d="M7.25 3.25 4.75 6l2.5 2.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="workspace-header-icon"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        d="M4.75 3.25 7.25 6l-2.5 2.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="workspace-header-icon search"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="m11.3 11.3 2.2 2.2M7.3 12a4.7 4.7 0 1 1 0-9.4 4.7 4.7 0 0 1 0 9.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

export default function WorkspaceHeader({ activeView = "Canvas", setActiveView }) {
  return (
    <header className="workspace-header" aria-label="Workspace header">
      <div className="workspace-header-section left">
        <button
          type="button"
          className="workspace-brand-switcher"
          aria-label="Workspace menu"
          disabled
        >
          <span className="workspace-brand-title">testing3</span>
          <span className="workspace-brand-menu" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
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
            disabled
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
            disabled
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            className="workspace-avatar-button"
            aria-label="Account"
            disabled
          >
            <span className="workspace-avatar-core" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

import './QuickNotePanel.css';

function CollapseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.9 4.5 9.1 8l-3.2 3.5" />
      <path d="M9.1 4.5 12.3 8l-3.2 3.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4.7 4.7 13.3 13.3" />
      <path d="M13.3 4.7 4.7 13.3" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" rx="1.5" />
      <path d="M5.4 6.1h5.2" />
      <path d="M5.4 8.1h3.9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7.1" />
      <path d="M9 5.7v6.6" />
      <path d="M5.7 9h6.6" />
    </svg>
  );
}

export default function QuickNotePanel({ onClose }) {
  return (
    <section className="quick-note-panel" aria-label="Quick Note editor">
      <div className="quick-note-panel__chrome">
        <button
          type="button"
          className="quick-note-panel__collapse"
          aria-label="Collapse quick note"
        >
          <CollapseIcon />
        </button>

        <button
          type="button"
          className="quick-note-panel__close"
          aria-label="Close quick note"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="quick-note-panel__bar">
        <span className="quick-note-panel__note-icon">
          <NoteIcon />
        </span>
        <span className="quick-note-panel__bar-title">Quick Note</span>
      </div>

      <div className="quick-note-panel__body">
        <div className="quick-note-panel__title-row">
          <h2 className="quick-note-panel__title">Untitled note</h2>
        </div>
        <p className="quick-note-panel__placeholder">Start typing...</p>
      </div>

      <div className="quick-note-panel__footer">
        <button type="button" className="quick-note-panel__add-button" disabled>
          <PlusIcon />
          <span>Add to Canvas</span>
        </button>
      </div>
    </section>
  );
}

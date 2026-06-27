import './QuickNotePanel.css';

function CollapseIcon() {
  return (
    <svg className="quick-note-panel__collapse-glyph" viewBox="0 0 11 12" aria-hidden="true">
      <path d="M2.3 3.3 5 6l-2.7 2.7" />
      <path d="M5.6 3.3 8.3 6 5.6 8.7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="quick-note-panel__close-glyph" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.2 3.2 8.8 8.8" />
      <path d="M8.8 3.2 3.2 8.8" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg className="quick-note-panel__note-icon-glyph" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M4 3.5h6" />
      <path d="M7 3.5v7" />
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

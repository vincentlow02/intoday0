import React from 'react';
import { CloseIcon } from './icons/AppIcons';

const DesktopQuickNoteSidePanel = ({
  open,
  title,
  body,
  labels,
  onTitleChange,
  onBodyChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  const displayTitle = title.trim() || 'Quick Note';
  const canSubmit = title.trim().length > 0 || body.trim().length > 0;

  return (
    <div className="desktop-note-side-layer" role="presentation" onClick={onClose}>
      <aside
        className="desktop-note-side-panel desktop-note-side-panel-quick"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-quick-note-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="desktop-note-side-toolbar">
          <button type="button" className="desktop-note-side-icon-button" aria-label="Collapse note" onClick={onClose}>
            <span aria-hidden="true">&raquo;</span>
          </button>
          <button type="button" className="desktop-note-side-icon-button" aria-label="New note">
            <span aria-hidden="true">+</span>
          </button>
          <button type="button" className="desktop-note-side-close" aria-label={labels.close || 'Close'} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="desktop-note-side-meta">
          <span className="desktop-note-side-chevron" aria-hidden="true">v</span>
          <span className="desktop-note-side-doc-icon" aria-hidden="true" />
          <span className="desktop-note-side-meta-title">{displayTitle}</span>
        </div>
        <div className="desktop-note-side-content">
          <input
            id="desktop-quick-note-title"
            className="desktop-note-side-title-input"
            value={title}
            placeholder="Untitled note"
            onChange={(event) => onTitleChange(event.target.value)}
            autoFocus
          />
          <div className="desktop-note-side-title-divider" aria-hidden="true" />
          <textarea
            className="desktop-note-side-body-editor"
            value={body}
            placeholder="Start typing..."
            onChange={(event) => onBodyChange(event.target.value)}
          />
        </div>
        <div className="desktop-note-side-footer">
          <button
            type="button"
            className="desktop-note-side-add-button"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            <span className="desktop-note-side-add-icon" aria-hidden="true">+</span>
            <span>Add to Canvas</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default DesktopQuickNoteSidePanel;

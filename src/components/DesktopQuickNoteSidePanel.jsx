import React from 'react';
import { CloseIcon } from './icons/AppIcons';
import BlockEditor from './BlockEditor';
import { Undo2, Redo2, Type, Bold, Italic, Strikethrough, Code, Link as LinkIcon, MoreHorizontal } from 'lucide-react';

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
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="desktop-note-side-toolbar">
          <button type="button" className="desktop-note-side-icon-button" aria-label="Collapse note" onClick={onClose}>
            <span aria-hidden="true">&raquo;</span>
          </button>

          <button type="button" className="desktop-note-side-close" aria-label={labels?.close || 'Close'} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="desktop-note-side-meta">
          <span className="desktop-note-side-custom-icon" aria-hidden="true">
            <img src="/text.png" alt="" width={14} height={14} style={{ objectFit: 'contain' }} />
          </span>
          <span className="desktop-note-side-meta-title">{displayTitle}</span>
        </div>
        <div className="desktop-note-side-content block-editor-container-wrapper" style={{ paddingLeft: '64px', overflowX: 'visible' }}>
          <input
            id="desktop-quick-note-title"
            className="desktop-note-side-title-input"
            value={title}
            placeholder="Untitled note"
            style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', paddingBottom: '12px', borderBottom: 'none' }}
            onChange={(event) => onTitleChange(event.target.value)}
            autoFocus
          />
          <BlockEditor
            value={body}
            onChange={(newBody) => onBodyChange(newBody)}
          />
        </div>

        <div className="desktop-note-side-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
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

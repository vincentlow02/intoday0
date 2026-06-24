import React from 'react';
import { CloseIcon, DocumentTextIcon } from './icons/AppIcons';
import { getTaskCardPresentation } from '../taskCardUtils';
import { composeDesktopNoteText } from '../lib/noteUtils';
import BlockEditor from './BlockEditor';
import { Undo2, Redo2, Type, Bold, Italic, Strikethrough, Code, Link as LinkIcon, MoreHorizontal } from 'lucide-react';

const getDesktopNotePanelContent = (task, labels) => {
  const { displayTitle, displaySub } = getTaskCardPresentation(task, labels || {});
  const rawText = String(task?.text || '').replace(/\r\n/g, '\n');
  const delimiterIndex = rawText.indexOf('\n');
  
  let title = '';
  let body = '';
  
  if (delimiterIndex === -1) {
    title = rawText;
  } else {
    title = rawText.substring(0, delimiterIndex);
    body = rawText.substring(delimiterIndex + 1);
  }

  // Fallback to displayTitle if this is a legacy task with no text at all
  if (!rawText && displayTitle && displayTitle !== 'Untitled note') {
    title = displayTitle;
  }

  return {
    title,
    subtitle: displaySub || 'Note',
    body,
  };
};

const DesktopNoteSidePanel = ({
  task,
  labels,
  onClose,
  collapsed,
  onCollapse,
  onExpand,
  onTextChange,
  onEdit,
}) => {
  if (!task) return null;

  const { title, body } = getDesktopNotePanelContent(task, labels);

  if (collapsed) {
    return (
      <button
        type="button"
        className="desktop-note-side-collapsed"
        aria-label={`Open note ${title}`}
        onClick={onExpand}
      >
        <span className="desktop-note-side-collapsed-icon" aria-hidden="true" />
        <span className="desktop-note-side-collapsed-title">{title}</span>
        <span className="desktop-note-side-collapsed-arrow" aria-hidden="true">&laquo;</span>
      </button>
    );
  }

  return (
    <div className="desktop-note-side-layer" role="presentation" onClick={onClose}>
      <aside
        className="desktop-note-side-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-note-side-title"
        onClick={(event) => event.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="desktop-note-side-toolbar">
          <button type="button" className="desktop-note-side-icon-button" aria-label="Collapse note" onClick={onCollapse}>
            <span aria-hidden="true">&raquo;</span>
          </button>
          <button type="button" className="desktop-note-side-close" aria-label={labels?.close || 'Close'} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="desktop-note-side-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="desktop-note-side-custom-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/text.png" alt="" width={14} height={14} style={{ objectFit: 'contain' }} />
          </span>
          <span className="desktop-note-side-meta-title">{title || 'Untitled note'}</span>
        </div>
        <div className="desktop-note-side-content block-editor-container-wrapper" style={{ paddingLeft: '64px', overflowX: 'visible' }}>
          <input
            id="desktop-note-side-title"
            className="desktop-note-side-title-input"
            value={title}
            placeholder="Untitled note"
            style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', paddingBottom: '12px', borderBottom: 'none' }}
            onChange={(event) => onTextChange?.(task.id, composeDesktopNoteText(event.target.value, body))}
          />
          <BlockEditor
            value={body}
            onChange={(newBody) => onTextChange?.(task.id, composeDesktopNoteText(title, newBody))}
          />
        </div>
      </aside>
    </div>
  );
};

export default DesktopNoteSidePanel;

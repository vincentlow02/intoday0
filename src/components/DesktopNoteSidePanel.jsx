import React from 'react';
import { CloseIcon } from './icons/AppIcons';
import { getTaskCardPresentation } from '../taskCardUtils';
import { composeDesktopNoteText } from '../lib/noteUtils';

const getDesktopNotePanelContent = (task, labels) => {
  const { displayTitle, displaySub } = getTaskCardPresentation(task, labels || {});
  const rawText = String(task?.text || '').replace(/\r\n/g, '\n');
  const lines = rawText.split('\n');
  const firstContentIndex = lines.findIndex((line) => line.trim());
  const hasContent = firstContentIndex >= 0;
  const title = hasContent ? lines[firstContentIndex].trim() : displayTitle || 'Untitled note';
  const body = hasContent ? lines.slice(firstContentIndex + 1).join('\n').replace(/^\n+/, '') : '';

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
      >
        <div className="desktop-note-side-toolbar">
          <button type="button" className="desktop-note-side-icon-button" aria-label="Collapse note" onClick={onCollapse}>
            <span aria-hidden="true">&raquo;</span>
          </button>
          <button
            type="button"
            className="desktop-note-side-icon-button"
            aria-label="Edit note"
            onClick={() => onEdit?.(task)}
          >
            <span aria-hidden="true">+</span>
          </button>
          <button type="button" className="desktop-note-side-close" aria-label={labels.close || 'Close'} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="desktop-note-side-meta">
          <span className="desktop-note-side-chevron" aria-hidden="true">v</span>
          <span className="desktop-note-side-doc-icon" aria-hidden="true" />
          <span className="desktop-note-side-meta-title">{title}</span>
        </div>
        <div className="desktop-note-side-content">
          <input
            id="desktop-note-side-title"
            className="desktop-note-side-title-input"
            value={title}
            placeholder="Untitled note"
            onChange={(event) => onTextChange?.(task.id, composeDesktopNoteText(event.target.value, body))}
          />
          <div className="desktop-note-side-title-divider" aria-hidden="true" />
          <textarea
            className="desktop-note-side-body-editor"
            value={body}
            placeholder="Start typing..."
            onChange={(event) => onTextChange?.(task.id, composeDesktopNoteText(title, event.target.value))}
          />
        </div>
      </aside>
    </div>
  );
};

export default DesktopNoteSidePanel;

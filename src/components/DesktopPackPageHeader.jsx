import React, { useState, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  getDesktopGroupDisplayName,
  getDesktopGroupIcon,
  getDesktopGroupDisplayTags,
} from '../lib/groupMetadata';
import { getPackMetadataTextFromItems } from '../lib/packMetadata';
import { normalizePackTags } from '../lib/packPageUtils';

const DesktopPackPageHeader = ({
  tasks,
  onUpdateGroup,
  appearance,
  language,
  labels = {},
  isSelectMode = false,
  selectedCount = 0,
  onEnterSelectMode,
  onExitSelectMode,
  onDeleteSelected,
}) => {
  const groupTitle = getDesktopGroupDisplayName(tasks);
  const groupIcon = getDesktopGroupIcon(tasks);
  const groupTags = getDesktopGroupDisplayTags(tasks);
  const updatedLabel = getPackMetadataTextFromItems(tasks);
  const metadataParts = [
    `${tasks.length} ${tasks.length === 1 ? 'item' : 'items'}`,
    updatedLabel,
  ].filter(Boolean);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [draftTag, setDraftTag] = useState('');

  const commitTitle = useCallback(() => {
    const nextTitle = draftTitle.trim();
    setIsTitleEditing(false);
    if (!nextTitle || nextTitle === groupTitle) return;
    onUpdateGroup({ desktopGroupName: nextTitle });
  }, [draftTitle, groupTitle, onUpdateGroup]);

  const handleTitleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitTitle();
    }
    if (event.key === 'Escape') {
      setDraftTitle(groupTitle);
      setIsTitleEditing(false);
    }
  }, [commitTitle, groupTitle]);

  const handleTagSubmit = useCallback(() => {
    const nextTag = draftTag.trim();
    if (!nextTag) {
      setDraftTag('');
      setIsTagInputOpen(false);
      return;
    }

    const nextTags = normalizePackTags([...groupTags, nextTag]);
    onUpdateGroup({ desktopGroupTags: nextTags });
    setDraftTag('');
    setIsTagInputOpen(false);
  }, [draftTag, groupTags, onUpdateGroup]);


  return (
    <div className="desktop-pack-page-header">
      <div className="desktop-pack-page-header-body">
        <div className="desktop-pack-page-header-tools">
          {groupIcon ? (
            <button
              type="button"
              className="desktop-pack-page-icon"
              onClick={() => setIsIconPickerOpen((current) => !current)}
              aria-label="Change icon"
            >
              {groupIcon}
            </button>
          ) : (
            <button
              type="button"
              className="desktop-pack-page-inline-action"
              onClick={() => setIsIconPickerOpen((current) => !current)}
            >
              {labels.addIcon || 'Add icon'}
            </button>
          )}
          {!groupTags.length && !isTagInputOpen ? (
            <button
              type="button"
              className="desktop-pack-page-inline-action"
              onClick={() => setIsTagInputOpen(true)}
            >
              {labels.addTag || 'Add tag'}
            </button>
          ) : null}
        </div>

        {isIconPickerOpen ? (
          <div className="desktop-pack-page-icon-picker" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', zIndex: 9999 }}>
            <EmojiPicker
              theme={appearance === 'dark' ? 'dark' : 'light'}
              onEmojiClick={(emojiData) => {
                onUpdateGroup({ desktopGroupIcon: emojiData.emoji });
                setIsIconPickerOpen(false);
              }}
              skinTonesDisabled
              autoFocusSearch={false}
              width={320}
              height={400}
            />
            {groupIcon ? (
              <button
                type="button"
                className="desktop-pack-page-inline-action is-inline"
                style={{
                  marginTop: 8,
                  width: '100%',
                  justifyContent: 'center',
                  background: 'var(--desktop-cancel-bg)',
                  padding: '8px',
                  borderRadius: 8,
                }}
                onClick={() => {
                  onUpdateGroup({ desktopGroupIcon: null });
                  setIsIconPickerOpen(false);
                }}
              >
                {labels.removeIcon || 'Remove icon'}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="desktop-pack-page-title-area">
          {isTitleEditing ? (
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitTitle}
              onKeyDown={handleTitleKeyDown}
              className="desktop-pack-page-title-input"
              autoFocus
            />
          ) : (
            <button
              type="button"
              id="desktop-group-full-view-title"
              className="desktop-pack-page-title"
              onClick={() => {
                setDraftTitle(groupTitle);
                setIsTitleEditing(true);
              }}
            >
              {groupTitle}
            </button>
          )}
          <div className="desktop-pack-page-metadata">
            {metadataParts.join(' / ')}
          </div>
        </div>

        <div className="desktop-pack-page-tags">
          {groupTags.map((tag) => (
            <span key={tag} className="desktop-pack-page-tag">
              <span>{tag}</span>
              <button
                type="button"
                className="desktop-pack-page-tag-remove"
                onClick={() => onUpdateGroup({
                  desktopGroupTags: groupTags.filter((currentTag) => currentTag !== tag),
                })}
                aria-label={`Remove ${tag}`}
              >
                x
              </button>
            </span>
          ))}
          {isTagInputOpen ? (
            <input
              value={draftTag}
              onChange={(event) => setDraftTag(event.target.value)}
              onBlur={handleTagSubmit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleTagSubmit();
                }
                if (event.key === 'Escape') {
                  setDraftTag('');
                  setIsTagInputOpen(false);
                }
              }}
              className="desktop-pack-page-tag-input"
              placeholder={labels.addTag || 'Add tag'}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="desktop-pack-page-inline-action is-inline"
              onClick={() => setIsTagInputOpen(true)}
            >
              {labels.addTag || 'Add tag'}
            </button>
          )}
        </div>
      </div>
      {isSelectMode ? (
        <div className="desktop-pack-page-selection-bar">
          <button
            type="button"
            className="desktop-pack-page-selection-action"
            onClick={onExitSelectMode}
          >
            {labels.cancel || 'Cancel'}
          </button>
          <div className="desktop-pack-page-selection-count">
            {(labels.selectionCount || '{count} selected').replace('{count}', selectedCount)}
          </div>
          <button
            type="button"
            className="desktop-pack-page-selection-delete"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
          >
            {labels.deleteSelectedCount || 'Delete selected'}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default DesktopPackPageHeader;

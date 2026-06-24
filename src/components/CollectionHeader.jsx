import React, { useState, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  getCollectionDisplayName,
  getCollectionIcon,
  getCollectionDisplayTags,
} from '../lib/collectionUtils';
import { getCollectionMetadataText } from '../lib/collectionMetadataUtils';
import { normalizeCollectionTags } from '../lib/collectionAppearanceUtils';

const CollectionHeader = ({
  tasks,
  onUpdateCollection,
  appearance,
  language,
  labels = {},
  isSelectMode = false,
  selectedCount = 0,
  onEnterSelectMode,
  onExitSelectMode,
  onDeleteSelected,
}) => {
  const collectionTitle = getCollectionDisplayName(tasks);
  const collectionIcon = getCollectionIcon(tasks);
  const collectionTags = getCollectionDisplayTags(tasks);
  const updatedLabel = getCollectionMetadataText(tasks);
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
    if (!nextTitle || nextTitle === collectionTitle) return;
    onUpdateCollection({
      desktopGroupName: nextTitle,
      collectionName: nextTitle,
    });
  }, [draftTitle, collectionTitle, onUpdateCollection]);

  const handleTitleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitTitle();
    }
    if (event.key === 'Escape') {
      setDraftTitle(collectionTitle);
      setIsTitleEditing(false);
    }
  }, [commitTitle, collectionTitle]);

  const handleTagSubmit = useCallback(() => {
    const nextTag = draftTag.trim();
    if (!nextTag) {
      setDraftTag('');
      setIsTagInputOpen(false);
      return;
    }

    const nextTags = normalizeCollectionTags([...collectionTags, nextTag]);
    onUpdateCollection({
      desktopGroupTags: nextTags,
      collectionTags: nextTags,
    });
    setDraftTag('');
    setIsTagInputOpen(false);
  }, [draftTag, collectionTags, onUpdateCollection]);

  return (
    <div className="desktop-pack-page-header">
      <div className="desktop-pack-page-header-body">
        <div className="desktop-pack-page-header-tools">
          {collectionIcon ? (
            <button
              type="button"
              className="desktop-pack-page-icon"
              onClick={() => setIsIconPickerOpen((current) => !current)}
              aria-label="Change icon"
            >
              {collectionIcon}
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
          {!collectionTags.length && !isTagInputOpen ? (
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
                onUpdateCollection({
                  desktopGroupIcon: emojiData.emoji,
                  collectionIcon: emojiData.emoji,
                });
                setIsIconPickerOpen(false);
              }}
              skinTonesDisabled
              autoFocusSearch={false}
              width={320}
              height={400}
            />
            {collectionIcon ? (
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
                  onUpdateCollection({
                    desktopGroupIcon: null,
                    collectionIcon: null,
                  });
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
                setDraftTitle(collectionTitle);
                setIsTitleEditing(true);
              }}
            >
              {collectionTitle}
            </button>
          )}
          <div className="desktop-pack-page-metadata">
            {metadataParts.join(' / ')}
          </div>
        </div>

        <div className="desktop-pack-page-tags">
          {collectionTags.map((tag) => (
            <span key={tag} className="desktop-pack-page-tag">
              <span>{tag}</span>
              <button
                type="button"
                className="desktop-pack-page-tag-remove"
                onClick={() => onUpdateCollection({
                  desktopGroupTags: collectionTags.filter((currentTag) => currentTag !== tag),
                  collectionTags: collectionTags.filter((currentTag) => currentTag !== tag),
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

export default CollectionHeader;

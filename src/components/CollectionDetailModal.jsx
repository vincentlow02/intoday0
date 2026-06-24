import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { CloseIcon, SearchIcon, PackSelectIcon, PackExportIcon, EditIcon } from './icons/AppIcons';
import CollectionHeader from './CollectionHeader';
import DesktopDeleteConfirmModal from './DesktopDeleteConfirmModal';
import CollectionShareModal from './CollectionShareModal';
import { getCollectionDisplayName, getCollectionDisplayTags } from '../lib/collectionUtils';
import { getTaskCardPresentation, normalizeCardType, CARD_TYPES } from '../taskCardUtils';
import PackItemSourceIcon from './PackItemSourceIcon';
import { getCollectionItemSourceMeta, getCollectionExportBodyText, getCollectionItemPrimaryUrl } from '../lib/collectionItemUtils';
import { deriveTaskDisplayTitle } from '../lib/taskDisplayUtils';
import { getCollectionMetadataText } from '../lib/collectionMetadataUtils';
import {
  COLLECTION_EXPORT_SECTION_ORDER,
  getCollectionRoleHeading,
  getCollectionFilterLabel,
  getCollectionTaskRoles,
  getPrimaryCollectionTaskRole,
  getCollectionTasksByRole,
  sanitizeCollectionFilename,
  collectCollectionAssets,
  buildCollectionExportItemMarkdown,
  buildCollectionSectionMarkdown,
  buildCollectionExportHeaderLines,
  buildRoleMarkdown,
  buildCopyForAIText,
  buildCollectionMarkdown,
  downloadBlob,
  downloadMarkdown,
  copyTextToClipboard,
} from '../lib/collectionExport';

import { Search, Check, Share2, Upload } from 'lucide-react';

const NewSearchIcon = ({ color = 'currentColor' }) => <Search color={color} size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />;
const NewSelectIcon = ({ color = 'currentColor' }) => <Check color={color} size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />;
const NewShareIcon = ({ color = 'currentColor' }) => <Share2 color={color} size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />;
const NewExportIcon = ({ color = 'currentColor' }) => <Upload color={color} size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />;


const PACK_FILE_CARD_TYPES = new Set([
  CARD_TYPES.DOCUMENT,
  CARD_TYPES.PHOTO,
]);

const PACK_LINK_CARD_TYPES = new Set([
  CARD_TYPES.LINK,
  CARD_TYPES.VIDEO,
  CARD_TYPES.PODCAST,
  CARD_TYPES.MUSIC,
  CARD_TYPES.PLACE,
]);

const PACK_MEMO_CARD_TYPES = new Set([
  CARD_TYPES.TEXT,
  CARD_TYPES.AI_TOOL,
]);

const getCollectionTaskFilterCategories = (task) => {
  const cardType = normalizeCardType(task?.cardType);
  const categories = [];
  const primaryUrl = getCollectionItemPrimaryUrl(task).trim();
  const hasUrl = Boolean(primaryUrl);
  const hasUploadedFile = Boolean(task?.uploadedFileStorageKey);

  if (PACK_FILE_CARD_TYPES.has(cardType) || hasUploadedFile) {
    categories.push('file');
  }
  if (PACK_LINK_CARD_TYPES.has(cardType) || (hasUrl && !PACK_FILE_CARD_TYPES.has(cardType))) {
    categories.push('link');
  }
  if (PACK_MEMO_CARD_TYPES.has(cardType) || categories.length === 0) {
    categories.push('memo');
  }

  return categories;
};

const CollectionDetailModal = ({
  view,
  appearance,
  labels,
  language,
  onClose,
  onTaskOpen,
  onTaskEdit,
  onDeleteTasks,
  onUpdateCollection,
  onToast,
}) => {
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBackdropVisible, setIsBackdropVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAtSourcePosition, setIsAtSourcePosition] = useState(false);
  const [flipSnapshot, setFlipSnapshot] = useState(null);
  const [hasOriginTransition, setHasOriginTransition] = useState(false);
  const exportMenuRef = useRef(null);
  const shellRef = useRef(null);
  const openContentTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const tasks = view?.tasks || [];
  const open = Boolean(view);

  useEffect(() => {
    if (!open) {
      setItemSearchQuery('');
      setActiveFilter('all');
      setIsSearchVisible(false);
      setIsExportMenuOpen(false);
      setHighlightedTaskId(null);
      setIsSelectMode(false);
      setSelectedItemIds([]);
      setIsDeleteConfirmOpen(false);
      setIsBackdropVisible(false);
      setIsContentVisible(false);
      setIsClosing(false);
      setIsAtSourcePosition(false);
      setFlipSnapshot(null);
      setHasOriginTransition(false);
    }
  }, [open]);

  useEffect(() => () => {
    if (openContentTimerRef.current) window.clearTimeout(openContentTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!open || !view?.groupId || !shellRef.current) return;

    if (openContentTimerRef.current) window.clearTimeout(openContentTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    const finalRect = shellRef.current.getBoundingClientRect();
    const originRect = view.originRect;

    setIsClosing(false);

    if (!originRect || !finalRect.width || !finalRect.height) {
      setFlipSnapshot(null);
      setHasOriginTransition(false);
      setIsAtSourcePosition(false);
      setIsBackdropVisible(true);
      setIsContentVisible(true);
      return;
    }

    const scaleX = Math.max(0.36, originRect.width / finalRect.width);
    const scaleY = Math.max(0.22, originRect.height / finalRect.height);
    const translateX = (originRect.left + (originRect.width / 2)) - (finalRect.left + (finalRect.width / 2));
    const translateY = (originRect.top + (originRect.height / 2)) - (finalRect.top + (finalRect.height / 2));

    setFlipSnapshot({
      translateX,
      translateY,
      scaleX,
      scaleY,
    });
    setHasOriginTransition(true);
    setIsAtSourcePosition(true);
    setIsBackdropVisible(false);
    setIsContentVisible(false);

    window.requestAnimationFrame(() => {
      setIsBackdropVisible(true);
      setIsAtSourcePosition(false);
      openContentTimerRef.current = window.setTimeout(() => {
        setIsContentVisible(true);
      }, 110);
    });
  }, [open, view?.groupId]);

  useEffect(() => {
    const existingIds = new Set(tasks.map((task) => task.id));
    setSelectedItemIds((current) => {
      const next = current.filter((taskId) => existingIds.has(taskId));
      const changed = next.length !== current.length;
      return changed ? next : current;
    });
  }, [tasks]);

  useEffect(() => {
    if (!open || !isExportMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen, open]);

  useEffect(() => {
    if (!open || !view?.focusTaskId) return undefined;

    const targetId = view.focusTaskId;
    setHighlightedTaskId(targetId);
    const scrollTimer = window.setTimeout(() => {
      const node = document.getElementById(`desktop-pack-page-item-${targetId}`);
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 60);
    const clearTimer = window.setTimeout(() => {
      setHighlightedTaskId((current) => (current === targetId ? null : current));
    }, 2200);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [open, view?.focusTaskId]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (activeFilter !== 'all') {
      list = list.filter(task => {
        const categories = getCollectionTaskFilterCategories(task);
        return categories.includes(activeFilter);
      });
    }

    if (itemSearchQuery.trim()) {
      const sq = itemSearchQuery.toLowerCase();
      list = list.filter(task => {
        const { displayTitle, displaySub } = getTaskCardPresentation(task, labels);
        const { domain } = getCollectionItemSourceMeta(task, labels);
        return (
          (displayTitle || '').toLowerCase().includes(sq) ||
          (displaySub || '').toLowerCase().includes(sq) ||
          (task.text || '').toLowerCase().includes(sq) ||
          (domain || '').toLowerCase().includes(sq) ||
          (task.tags || []).some(t => t.toLowerCase().includes(sq))
        );
      });
    }

    return list;
  }, [tasks, itemSearchQuery, activeFilter, labels]);

  if (!open || !tasks?.length) return null;

  const filters = ['all', 'file', 'link', 'memo'];
  const isDark = appearance === 'dark';
  const selectedCount = selectedItemIds.length;
  const toggleSelectItem = (taskId) => {
    setSelectedItemIds((current) => (
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    ));
  };
  const enterSelectMode = () => {
    setIsSearchVisible(false);
    setIsExportMenuOpen(false);
    setIsSelectMode(true);
    setSelectedItemIds([]);
    setIsDeleteConfirmOpen(false);
  };
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedItemIds([]);
    setIsDeleteConfirmOpen(false);
  };
  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    setIsDeleteConfirmOpen(true);
  };
  const confirmDeleteSelected = () => {
    if (selectedCount === 0) {
      setIsDeleteConfirmOpen(false);
      return;
    }
    onDeleteTasks?.(selectedItemIds);
    setIsDeleteConfirmOpen(false);
    setSelectedItemIds([]);
    setIsSelectMode(false);
  };
  const handleExportWholeCollection = () => {
    const markdown = buildCollectionMarkdown(tasks, labels);
    const filename = `${sanitizeCollectionFilename(getCollectionDisplayName(tasks))}.md`;
    downloadMarkdown(filename, markdown);
    setIsExportMenuOpen(false);
  };
  const handleExportCollectionBundle = async () => {
    try {
      const { assets, assetPathByStorageKey, assetPathByTaskId } = await collectCollectionAssets(tasks);
      const markdown = buildCollectionMarkdown(tasks, labels, { assetPathByStorageKey, assetPathByTaskId });
      const zip = new JSZip();
      zip.file('context.md', markdown);
      assets.forEach((asset) => {
        zip.file(asset.path, asset.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const collectionSlug = sanitizeCollectionFilename(getCollectionDisplayName(tasks));
      const filename = collectionSlug === 'untitled-collection' ? 'untitled-collection.zip' : `${collectionSlug}-collection.zip`;
      downloadBlob(filename, zipBlob);
    } catch (error) {
      console.error('Failed to export collection bundle:', error);
      onToast?.('Unable to export collection bundle');
    }
    setIsExportMenuOpen(false);
  };
  const handleCopyWholeCollectionForAi = async () => {
    const text = buildCopyForAIText(tasks, labels, 'all');
    if (!text) {
      onToast?.('No collection content to copy');
      setIsExportMenuOpen(false);
      return;
    }
    try {
      await copyTextToClipboard(text);
      onToast?.('Copied whole collection for AI');
    } catch {
      onToast?.('Unable to copy whole collection');
    }
    setIsExportMenuOpen(false);
  };
  const handleCopyRoleForAi = async (role, exportType) => {
    const text = buildCopyForAIText(tasks, labels, exportType);
    const roleHeading = getCollectionRoleHeading(role);
    if (!text) {
      onToast?.(`No ${roleHeading} items to copy`);
      setIsExportMenuOpen(false);
      return;
    }
    try {
      await copyTextToClipboard(text);
      onToast?.(`Copied ${roleHeading} for AI`);
    } catch {
      onToast?.(`Unable to copy ${roleHeading}`);
    }
    setIsExportMenuOpen(false);
  };
  const handleExportByRole = (role) => {
    const markdown = buildRoleMarkdown(tasks, labels, role);
    const roleHeading = getCollectionRoleHeading(role);
    const roleSlug = roleHeading.toLowerCase();
    if (!markdown) {
      onToast?.(`No ${roleHeading} items to export`);
      setIsExportMenuOpen(false);
      return;
    }
    const filename = `${sanitizeCollectionFilename(getCollectionDisplayName(tasks))}-${roleSlug}.md`;
    downloadMarkdown(filename, markdown);
    setIsExportMenuOpen(false);
  };
  const handleExportMenuAction = (action) => {
    if (action === 'copy-for-ai') {
      handleCopyWholeCollectionForAi();
      return;
    }
    if (action === 'copy-context') {
      handleCopyRoleForAi('Context', 'context');
      return;
    }
    if (action === 'copy-code') {
      handleCopyRoleForAi('Code', 'code');
      return;
    }
    if (action === 'copy-notes') {
      handleCopyRoleForAi('Notes', 'notes');
      return;
    }
    if (action === 'copy-reference') {
      handleCopyRoleForAi('Reference', 'reference');
      return;
    }
    if (action === 'whole-collection') {
      handleExportWholeCollection();
      return;
    }
    if (action === 'collection-bundle') {
      void handleExportCollectionBundle();
      return;
    }
    if (action === 'context') {
      handleExportByRole('Context');
      return;
    }
    if (action === 'code') {
      handleExportByRole('Code');
      return;
    }
    if (action === 'notes') {
      handleExportByRole('Notes');
      return;
    }
    if (action === 'reference') {
      handleExportByRole('Reference');
      return;
    }
    setIsExportMenuOpen(false);
  };
  const exportMenuOptions = [
    { id: 'copy-for-ai', label: 'Copy for Ai' },
    { id: 'whole-collection', label: 'Export as Markdown' },
    { id: 'collection-bundle', label: 'Download ZIP' },
  ];

  const handleShareCollection = () => {
    setIsShareModalOpen(true);
  };

  const handleRequestClose = () => {
    if (isClosing) return;

    if (openContentTimerRef.current) window.clearTimeout(openContentTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    setIsExportMenuOpen(false);
    setIsDeleteConfirmOpen(false);
    setIsContentVisible(false);
    setIsBackdropVisible(false);
    setIsClosing(true);

    closeTimerRef.current = window.setTimeout(() => {
      onClose?.();
    }, view?.originRect ? 260 : 180);
  };

  const shellMotionStyle = flipSnapshot ? {
    '--desktop-pack-flip-x': `${flipSnapshot.translateX}px`,
    '--desktop-pack-flip-y': `${flipSnapshot.translateY}px`,
    '--desktop-pack-flip-scale-x': `${flipSnapshot.scaleX}`,
    '--desktop-pack-flip-scale-y': `${flipSnapshot.scaleY}`,
  } : undefined;

  return (
    <div
      role="presentation"
      onClick={handleRequestClose}
      className="desktop-pack-page-modal desktop-collection-detail-modal"
    >
      <div className={`desktop-pack-page-backdrop ${isBackdropVisible ? 'is-visible' : ''}`} />
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-group-full-view-title"
        onClick={(event) => event.stopPropagation()}
        className={`desktop-pack-page-shell desktop-collection-detail-modal-shell ${isDark ? 'is-dark' : ''} ${hasOriginTransition ? 'has-origin-transition' : ''} ${isAtSourcePosition ? 'is-from-card' : ''} ${isClosing ? 'is-closing' : ''}`}
        style={shellMotionStyle}
      >
        <div className={`desktop-pack-page-shell-inner ${isContentVisible ? 'is-visible' : ''}`}>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={labels.close}
            className="desktop-pack-page-close"
          >
            <CloseIcon />
          </button>

          <CollectionHeader
            tasks={tasks}
            onUpdateCollection={onUpdateCollection}
            appearance={appearance}
            language={language}
            labels={labels}
            isSelectMode={isSelectMode}
            selectedCount={selectedCount}
            onEnterSelectMode={enterSelectMode}
            onExitSelectMode={exitSelectMode}
            onDeleteSelected={handleDeleteSelected}
          />

          <div className="desktop-pack-page-controls desktop-collection-controls">
            <div className="desktop-pack-page-controls-bar">
              <div className="desktop-pack-page-filters" role="tablist" aria-label="Collection filters">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`desktop-pack-page-filter-btn ${activeFilter === filter ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveFilter(filter);
                      setIsSearchVisible(false);
                      setIsExportMenuOpen(false);
                    }}
                  >
                    {getCollectionFilterLabel(filter, labels)}
                  </button>
                ))}
              </div>
              <div className={`desktop-pack-page-control-actions ${isSelectMode ? 'is-select-mode' : ''}`}>
                {isSelectMode ? (
                  <button
                    type="button"
                    className="desktop-pack-page-toolbar-action is-active-pill"
                    onClick={exitSelectMode}
                  >
                    <NewSelectIcon color="currentColor" />
                    <span>{labels.select || 'Select'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`desktop-pack-page-toolbar-action ${isSearchVisible ? 'is-active-pill' : ''}`}
                      onClick={() => {
                        setIsSearchVisible((current) => !current);
                        setIsExportMenuOpen(false);
                      }}
                      aria-label="Search items"
                      aria-expanded={isSearchVisible}
                    >
                      <NewSearchIcon color="currentColor" />
                      <span>{labels.search || 'Search'}</span>
                    </button>
                    
                    <button
                      type="button"
                      className="desktop-pack-page-toolbar-action"
                      onClick={enterSelectMode}
                    >
                      <NewSelectIcon color="currentColor" />
                      <span>{labels.select || 'Select'}</span>
                    </button>

                    <button
                      type="button"
                      className="desktop-pack-page-toolbar-action desktop-pack-page-toolbar-share"
                      onClick={handleShareCollection}
                    >
                      <NewShareIcon color="var(--color-grey-46, #6B7280)" />
                      <span>{labels.share || 'Share'}</span>
                    </button>

                    <div className="desktop-pack-page-toolbar-menu-anchor" ref={exportMenuRef}>
                      <button
                        type="button"
                        className={`desktop-pack-page-toolbar-action desktop-pack-page-toolbar-export ${isExportMenuOpen ? 'is-active' : ''}`}
                        aria-haspopup="menu"
                        aria-expanded={isExportMenuOpen}
                        onClick={() => setIsExportMenuOpen((current) => !current)}
                      >
                        <NewExportIcon color="currentColor" />
                        <span>{labels.exportPack || 'Export'}</span>
                      </button>
                      {isExportMenuOpen ? (
                        <div className="desktop-pack-page-toolbar-menu" role="menu" aria-label="Export collection">
                          {exportMenuOptions.map(({ id, label }) => (
                            <button
                              key={id}
                              type="button"
                              role="menuitem"
                              className="desktop-pack-page-toolbar-menu-item"
                              onClick={() => handleExportMenuAction(id)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>
            {isSearchVisible && (
              <div className="desktop-pack-page-search-wrapper is-revealed">
                <NewSearchIcon color="currentColor" />
                <input
                  type="text"
                  placeholder={labels.searchInPack || 'Search in collection...'}
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="desktop-pack-page-search-input"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="desktop-pack-page-content">
            <div className="desktop-pack-page-item-list">
              {filteredTasks.length === 0 ? (
                <div className="desktop-pack-page-empty">{labels.noItemsFound || 'No items found'}</div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    id={`desktop-pack-page-item-${task.id}`}
                    className={`desktop-pack-page-item desktop-collection-item ${highlightedTaskId === task.id ? 'is-highlighted' : ''}`}
                  >
                    {isSelectMode ? (
                      <button
                        type="button"
                        className={`desktop-pack-page-item-checkbox ${selectedItemIds.includes(task.id) ? 'is-selected' : ''}`}
                        aria-pressed={selectedItemIds.includes(task.id)}
                        aria-label={`${selectedItemIds.includes(task.id) ? 'Deselect' : 'Select'} ${task.text || 'item'}`}
                        onClick={() => toggleSelectItem(task.id)}
                      >
                        <span className="desktop-pack-page-item-checkbox-mark" aria-hidden="true">
                          {selectedItemIds.includes(task.id) ? '✓' : ''}
                        </span>
                      </button>
                    ) : null}
                    {(() => {
                      const { label } = getCollectionItemSourceMeta(task, labels);
                      const { displayTitle } = getTaskCardPresentation(task, labels);
                      return (
                        <>
                          <PackItemSourceIcon task={task} appearance={appearance} labels={labels} />
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelectMode) {
                                toggleSelectItem(task.id);
                                return;
                              }
                              onTaskOpen(task);
                            }}
                            className="desktop-pack-page-item-main"
                          >
                            <div className="desktop-pack-page-item-title">
                              {displayTitle || task.text || 'Untitled item'}
                            </div>
                            <div className="desktop-pack-page-item-subtitle">
                              {label}
                            </div>
                          </button>
                        </>
                      );
                    })()}
                    {!isSelectMode ? (
                      <div className="desktop-pack-page-item-actions">
                        <button
                          type="button"
                          className="desktop-pack-page-item-action"
                          aria-label={`Edit ${task.text || 'item'}`}
                          onClick={() => onTaskEdit?.(task)}
                        >
                          <EditIcon />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <DesktopDeleteConfirmModal
            open={isDeleteConfirmOpen}
            title={selectedCount === 1 
              ? (labels.deleteItemQuestion || 'Delete this item?') 
              : (labels.deleteMultipleItemsQuestion || 'Delete {count} selected items?').replace('{count}', selectedCount)}
            onCancel={() => setIsDeleteConfirmOpen(false)}
            onConfirm={confirmDeleteSelected}
          />
        </div>
      </div>
      <CollectionShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        collectionName={getCollectionDisplayName(tasks)} 
        labels={labels}
      />
    </div>
  );
};

export default CollectionDetailModal;

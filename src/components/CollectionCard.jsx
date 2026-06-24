import React, { useState } from 'react';
import { TaskCardContent } from './TaskCard';
import { OpenFullViewIcon } from './icons/AppIcons';
import {
  getCollectionDisplayName,
  getCollectionIcon,
  getCollectionDisplayTags,
  getTaskCollectionId,
} from '../lib/collectionUtils';
import { getCollectionMetadataText } from '../lib/collectionMetadataUtils';
import {
  DESKTOP_COLLECTION_CARD_COLLAPSED_LIST_MAX_HEIGHT,
  DESKTOP_COLLECTION_CARD_EXPANDED_LIST_MAX_HEIGHT,
  getDesktopVisibleCollectionTaskCount,
  getDesktopCollectionCardHeight,
  getDesktopCollectionListHeight,
} from '../lib/collectionCardLayout';

const CollectionCard = ({
  tasks,
  appearance,
  labels,
  isDragging,
  isGroupDragActive,
  isSelected,
  // eslint-disable-next-line no-unused-vars
  isGroupReady,
  draggedTaskId,
  onOpenItem,
  onOpenFullView,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) => {
  const leadTask = tasks[0];
  const [isExpanded, setIsExpanded] = useState(false);
  const collectionTitle = getCollectionDisplayName(tasks);
  const collectionMetadataText = getCollectionMetadataText(tasks);
  const collectionChips = getCollectionDisplayTags(tasks);
  const collectionIcon = getCollectionIcon(tasks);
  const collectionTask = {
    ...leadTask,
    groupTaskIds: tasks.map((task) => task.id),
    groupSize: tasks.length,
    desktopGroupName: collectionTitle,
    collectionId: getTaskCollectionId(leadTask),
    collectionName: collectionTitle,
    updatedAt: leadTask.updatedAt,
    isGroupInitiator: true,
  };

  const isDraggingCollection = isDragging && isGroupDragActive;
  const filteredTasks = tasks.filter((t) => isDraggingCollection || t.id !== draggedTaskId);
  const collapsedVisibleCount = getDesktopVisibleCollectionTaskCount(filteredTasks, DESKTOP_COLLECTION_CARD_COLLAPSED_LIST_MAX_HEIGHT);
  const expandedVisibleCount = getDesktopVisibleCollectionTaskCount(filteredTasks, DESKTOP_COLLECTION_CARD_EXPANDED_LIST_MAX_HEIGHT);
  const visibleItemCount = isExpanded ? expandedVisibleCount : collapsedVisibleCount;
  const collapsedHiddenTaskCount = Math.max(0, filteredTasks.length - collapsedVisibleCount);
  const hiddenTaskCount = Math.max(0, filteredTasks.length - visibleItemCount);
  const collectionCardMinHeight = getDesktopCollectionCardHeight(filteredTasks, visibleItemCount);
  const collectionListMaxHeight = getDesktopCollectionListHeight(filteredTasks, visibleItemCount);
  const canScrollExpandedList = isExpanded && hiddenTaskCount > 0;

  return (
      <div id={`desktop-task-wrapper-${leadTask.id}`} className={`desktop-task-wrapper desktop-task-group-wrapper ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-selected' : ''}`}>
        <div
          id={`desktop-group-card-${leadTask.id}`}
          className={`desktop-task-card desktop-task-group-card ${isDragging ? 'is-dragging' : ''} ${isExpanded ? 'is-expanded' : ''}`}
          onPointerDown={(event) => onPointerDown(collectionTask, event)}
          onPointerMove={(event) => onPointerMove(collectionTask, event)}
          onPointerUp={(event) => onPointerUp(collectionTask, event)}
          onPointerCancel={(event) => onPointerCancel(collectionTask, event)}
          onMouseLeave={() => setIsExpanded(false)}
          style={{ width: '100%', minHeight: collectionCardMinHeight, touchAction: 'none', userSelect: 'none' }}
        >
        <div
          role="button"
          tabIndex={0}
          className="desktop-task-group-summary-button"
          aria-label="Open full view"
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.stopPropagation();
            onPointerDown?.(collectionTask, event);
          }}
          onClick={(event) => {
            event.stopPropagation();
            onOpenFullView?.(event);
          }}
        >
            <div className="desktop-task-group-header">
              <div className="desktop-task-group-title-wrap">
                {collectionIcon ? (
                  <span className="desktop-task-group-title-icon">{collectionIcon}</span>
                ) : (
                  <span className="desktop-task-group-title-dot" />
                )}
                <div className="desktop-task-group-title-block">
                  <span
                    className="desktop-task-group-title"
                    onDragStart={(e) => e.preventDefault()}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  >
                    {collectionTitle}
                  </span>
                  {collectionMetadataText ? (
                    <span
                      className="desktop-task-group-metadata"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
                      {collectionMetadataText}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="desktop-task-group-header-actions">
                <span className="desktop-task-group-open-icon" aria-hidden="true">
                  <OpenFullViewIcon />
                </span>
              </div>
            </div>
            {collectionChips.length > 0 ? (
              <div className="desktop-task-group-chip-row">
                {collectionChips.map((chip) => (
                  <span key={chip} className="desktop-task-group-chip">{chip}</span>
                ))}
              </div>
            ) : null}
        </div>
        <div className="desktop-task-group-divider" />
        <div
          className="desktop-task-group-list"
          style={{ maxHeight: collectionListMaxHeight, overflowY: canScrollExpandedList ? 'auto' : 'hidden' }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              onPointerDown?.(collectionTask, event);
            }
          }}
          onPointerMove={(event) => {
            if (event.target === event.currentTarget) {
              onPointerMove?.(collectionTask, event);
            }
          }}
          onPointerUp={(event) => {
            if (event.target === event.currentTarget) {
              onPointerUp?.(collectionTask, event);
            }
          }}
          onPointerCancel={(event) => {
            if (event.target === event.currentTarget) {
              onPointerCancel?.(collectionTask, event);
            }
          }}
        >
          {filteredTasks.map((task) => {
            const isTaskDragging = draggedTaskId === task.id && !isDraggingCollection;
            return (
              <div id={`desktop-task-wrapper-${task.id}`} key={task.id} style={{ display: 'block', width: '100%', visibility: isTaskDragging ? 'hidden' : 'visible' }}>
                <button
                  id={`desktop-task-card-${task.id}`}
                  type="button"
                  className="desktop-task-group-row"
                  onMouseDown={(event) => event.stopPropagation()}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onPointerDown?.(task, event);
                  }}
                  onPointerMove={(event) => {
                    event.stopPropagation();
                    onPointerMove?.(task, event);
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    onPointerUp?.(task, event);
                  }}
                  onPointerCancel={(event) => {
                    onPointerCancel?.(task, event);
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenItem?.(task);
                  }}
                >
                  <TaskCardContent task={task} appearance={appearance} labels={labels} />
                </button>
              </div>
            );
          })}
        </div>
        {(collapsedHiddenTaskCount > 0 || (isExpanded && hiddenTaskCount > 0)) && (
          <button
            type="button"
            className="desktop-task-group-more-label"
            onMouseEnter={() => setIsExpanded(true)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setIsExpanded(false)}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.preventDefault()}
          >
            {isExpanded && hiddenTaskCount > 0 
              ? (labels.scrollForMore || 'Scroll for {count} more').replace('{count}', hiddenTaskCount) 
              : (labels.plusMore || '+ {count} more').replace('{count}', collapsedHiddenTaskCount)}
          </button>
        )}
      </div>
    </div>
  );
};

export default CollectionCard;

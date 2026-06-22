import React, { useState } from 'react';
import { TaskCardContent } from './TaskCard';
import { OpenFullViewIcon } from './icons/AppIcons';
import {
  getDesktopGroupDisplayName,
  getDesktopGroupIcon,
  getDesktopGroupDisplayTags,
} from '../lib/groupMetadata';
import { getPackMetadataTextFromItems } from '../lib/packMetadata';
import {
  DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT,
  DESKTOP_GROUP_CARD_EXPANDED_LIST_MAX_HEIGHT,
  getDesktopVisibleGroupTaskCount,
  getDesktopGroupCardHeight,
  getDesktopGroupListHeight,
} from '../lib/groupCardLayout';

const GroupedTaskCard = ({
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
  const groupTitle = getDesktopGroupDisplayName(tasks);
  const groupMetadataText = getPackMetadataTextFromItems(tasks);
  const groupChips = getDesktopGroupDisplayTags(tasks);
  const groupIcon = getDesktopGroupIcon(tasks);
  const groupTask = {
    ...leadTask,
    groupTaskIds: tasks.map((task) => task.id),
    groupSize: tasks.length,
    desktopGroupName: groupTitle,
    updatedAt: leadTask.updatedAt,
    isGroupInitiator: true,
  };

  // If we are dragging a single item out of this group, hide it from the group preview
  const isDraggingGroup = isDragging && isGroupDragActive;
  const filteredTasks = tasks.filter((t) => isDraggingGroup || t.id !== draggedTaskId);
  const collapsedVisibleCount = getDesktopVisibleGroupTaskCount(filteredTasks, DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT);
  const expandedVisibleCount = getDesktopVisibleGroupTaskCount(filteredTasks, DESKTOP_GROUP_CARD_EXPANDED_LIST_MAX_HEIGHT);
  const visibleItemCount = isExpanded ? expandedVisibleCount : collapsedVisibleCount;
  const collapsedHiddenTaskCount = Math.max(0, filteredTasks.length - collapsedVisibleCount);
  const hiddenTaskCount = Math.max(0, filteredTasks.length - visibleItemCount);
  const groupCardMinHeight = getDesktopGroupCardHeight(filteredTasks, visibleItemCount);
  const groupListMaxHeight = getDesktopGroupListHeight(filteredTasks, visibleItemCount);
  const canScrollExpandedList = isExpanded && hiddenTaskCount > 0;

  return (
      <div id={`desktop-task-wrapper-${leadTask.id}`} className={`desktop-task-wrapper desktop-task-group-wrapper ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-selected' : ''}`}>
        <div
          id={`desktop-group-card-${leadTask.id}`}
          className={`desktop-task-card desktop-task-group-card ${isDragging ? 'is-dragging' : ''} ${isExpanded ? 'is-expanded' : ''}`}
          onPointerDown={(event) => onPointerDown(groupTask, event)}
          onPointerMove={(event) => onPointerMove(groupTask, event)}
          onPointerUp={(event) => onPointerUp(groupTask, event)}
          onPointerCancel={(event) => onPointerCancel(groupTask, event)}
          onMouseLeave={() => setIsExpanded(false)}
          style={{ width: '100%', minHeight: groupCardMinHeight, touchAction: 'none', userSelect: 'none' }}
        >
          <button
            type="button"
            className="desktop-task-group-summary-button"
            aria-label="Open full view"
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
              event.stopPropagation();
              onPointerDown?.(groupTask, event);
            }}
            onClick={(event) => {
              event.stopPropagation();
              onOpenFullView?.(event);
            }}
          >
            <div className="desktop-task-group-header">
              <div className="desktop-task-group-title-wrap">
                {groupIcon ? (
                  <span className="desktop-task-group-title-icon">{groupIcon}</span>
                ) : (
                  <span className="desktop-task-group-title-dot" />
                )}
                <div className="desktop-task-group-title-block">
                  <span
                    className="desktop-task-group-title"
                    onDragStart={(e) => e.preventDefault()}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  >
                    {groupTitle}
                  </span>
                  {groupMetadataText ? (
                    <span
                      className="desktop-task-group-metadata"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
                      {groupMetadataText}
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
            {groupChips.length > 0 ? (
              <div className="desktop-task-group-chip-row">
                {groupChips.map((chip) => (
                  <span key={chip} className="desktop-task-group-chip">{chip}</span>
                ))}
              </div>
            ) : null}
          </button>
          <div className="desktop-task-group-divider" />
        <div
          className="desktop-task-group-list"
          style={{ maxHeight: groupListMaxHeight, overflowY: canScrollExpandedList ? 'auto' : 'hidden' }}
          onPointerDown={(event) => {
            // Only trigger if clicking the list container itself (empty space)
            if (event.target === event.currentTarget) {
              onPointerDown?.(groupTask, event);
            }
          }}
          onPointerMove={(event) => {
            if (event.target === event.currentTarget) {
              onPointerMove?.(groupTask, event);
            }
          }}
          onPointerUp={(event) => {
            if (event.target === event.currentTarget) {
              onPointerUp?.(groupTask, event);
            }
          }}
          onPointerCancel={(event) => {
            if (event.target === event.currentTarget) {
              onPointerCancel?.(groupTask, event);
            }
          }}
        >
          {filteredTasks.map((task) => {
            const isTaskDragging = draggedTaskId === task.id && !isDraggingGroup;
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

export default GroupedTaskCard;

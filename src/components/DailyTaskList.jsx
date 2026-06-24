import React from 'react';
import { DESKTOP_MAIN_CONTENT_MAX_WIDTH, DESKTOP_CANVAS_CARD_WIDTH } from '../lib/desktopConstants';
import { TaskCard } from './TaskCard';
import CollectionCard from './CollectionCard';

const DailyTaskList = ({
  entries,
  canvasHeight,
  appearance,
  labels,
  connectionLinks = [],
  connectionDraft = null,
  selectedConnectionKey = null,
  onTaskClick,
  onGroupOpenFullView,
  onTaskEdit,
  onTaskDelete,
  onTaskPointerDown,
  onTaskPointerMove,
  onTaskPointerUp,
  onTaskPointerCancel,
  onConnectionPointerDown,
  onConnectionMouseDown,
  onConnectionPointerMove,
  onConnectionPointerUp,
  onConnectionPointerCancel,
  onConnectionSelect,
  onConnectionDelete,
  draggedTaskId,
  isGroupDragActive,
  selectedTaskIds,
  selectionRect,
  dragOverlapTargetId,
  layoutWidth = DESKTOP_MAIN_CONTENT_MAX_WIDTH,
  getConnectionPath,
  getConnectionMidpoint,
}) => (
  <div style={{ width: layoutWidth, minHeight: canvasHeight, height: canvasHeight, margin: '0 auto', position: 'relative' }}>
    <svg className="desktop-canvas-connection-layer" aria-hidden="true">
      {connectionLinks.map((link) => {
        const connectionKey = `${link.sourceId}->${link.targetId}`;
        const path = getConnectionPath(link.from, link.to);
        const isSelected = selectedConnectionKey === connectionKey;
        return (
          <g key={connectionKey} className={`desktop-canvas-connection ${isSelected ? 'is-selected' : ''}`}>
            <path
              className="desktop-canvas-connection-hit-path"
              data-connection-key={connectionKey}
              d={path}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onConnectionSelect?.(connectionKey);
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onConnectionSelect?.(connectionKey);
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onConnectionSelect?.(connectionKey);
              }}
            />
            <path
              className="desktop-canvas-connection-path"
              d={path}
            />
            {isSelected ? (
              <>
                <circle className="desktop-canvas-connection-control-point" cx={link.from.x} cy={link.from.y} r="4" />
                <circle className="desktop-canvas-connection-control-point" cx={link.to.x} cy={link.to.y} r="4" />
              </>
            ) : null}
          </g>
        );
      })}
      {connectionDraft ? (
        <path
          className="desktop-canvas-connection-path is-draft"
          d={getConnectionPath(connectionDraft.from, connectionDraft.to)}
        />
      ) : null}
    </svg>
    {connectionLinks.map((link) => {
      const connectionKey = `${link.sourceId}->${link.targetId}`;
      if (selectedConnectionKey !== connectionKey) return null;
      const midpoint = getConnectionMidpoint(link.from, link.to);
      return (
        <button
          key={`delete-${connectionKey}`}
          type="button"
          className="desktop-canvas-connection-delete"
          aria-label="Delete connection"
          style={{ left: midpoint.x, top: midpoint.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onConnectionDelete?.(connectionKey);
          }}
        >
          &times;
        </button>
      );
    })}
    {entries.length > 0 ? (
      entries.map((entry) => {
        const dragTask = entry.type === 'group'
          ? { ...entry.task, groupTaskIds: entry.tasks.map((task) => task.id), groupSize: entry.tasks.length }
          : entry.task;
        const isGroupReady = dragOverlapTargetId === dragTask.id;
        const isDragging = entry.type === 'group'
          ? (draggedTaskId === dragTask.id && isGroupDragActive) // Only hide whole card if lead task (group drag) is active
          : (draggedTaskId === entry.task.id && !isGroupDragActive);
        return (
          <div
            key={entry.type === 'group' ? `group-${entry.id}` : entry.task.id}
            id={`desktop-canvas-entry-${dragTask.id}`}
            data-desktop-layout-id={`task-${dragTask.id}`}
            data-desktop-connection-id={dragTask.id}
            className="desktop-canvas-card-node"
            style={{ left: entry.x, top: entry.y, width: DESKTOP_CANVAS_CARD_WIDTH }}
          >
            <div
              className={`desktop-canvas-card-shell ${isGroupReady ? 'desktop-canvas-card-shell--group-ready' : ''} ${isDragging ? 'is-dragging' : ''}`}
            >
              {['left', 'right', 'top', 'bottom'].map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`desktop-canvas-connection-handle desktop-canvas-connection-handle-${side}`}
                  aria-label="Start connection"
                  onPointerDown={(event) => onConnectionPointerDown?.(dragTask.id, side, event)}
                  onMouseDown={(event) => onConnectionMouseDown?.(dragTask.id, side, event)}
                  onPointerMove={onConnectionPointerMove}
                  onPointerUp={onConnectionPointerUp}
                  onPointerCancel={onConnectionPointerCancel}
                />
              ))}
              {entry.type === 'group' ? (
                <CollectionCard
                  tasks={entry.tasks}
                  appearance={appearance}
                  labels={labels}
                  isDragging={isDragging}
                  isGroupDragActive={isGroupDragActive}
                  isSelected={entry.tasks.every((task) => selectedTaskIds.includes(task.id))}
                  isGroupReady={isGroupReady}
                  draggedTaskId={draggedTaskId}
                  onOpenItem={onTaskClick}
                  onOpenFullView={(event) => onGroupOpenFullView(entry.tasks, event)}
                  onPointerDown={onTaskPointerDown}
                  onPointerMove={onTaskPointerMove}
                  onPointerUp={onTaskPointerUp}
                  onPointerCancel={onTaskPointerCancel}
                />
              ) : (
                <TaskCard
                  task={entry.task}
                  appearance={appearance}
                  labels={labels}
                  isDragging={isDragging}
                  isSelected={selectedTaskIds.includes(entry.task.id)}
                  isGroupReady={isGroupReady}
                  draggedTaskId={draggedTaskId}
                  onClick={(event) => onTaskClick(entry.task, event)}
                  onEdit={() => onTaskEdit(entry.task)}
                  onDelete={() => onTaskDelete(entry.task)}
                  onPointerDown={(event) => onTaskPointerDown(entry.task, event)}
                  onPointerMove={(event) => onTaskPointerMove(entry.task, event)}
                  onPointerUp={(event) => onTaskPointerUp(entry.task, event)}
                  onPointerCancel={(event) => onTaskPointerCancel(entry.task, event)}
                  editLabel={labels.edit}
                  deleteLabel={labels.delete}
                />
              )}
            </div>
          </div>
        );
      })
    ) : (
      <div
        aria-hidden="true"
        style={{
          minHeight: 220,
          borderRadius: 28,
          border: appearance === 'dark' ? 'none' : '1px dashed var(--desktop-divider)',
          background: appearance === 'dark' ? 'transparent' : 'var(--desktop-section-bg)',
        }}
      />
    )}
    {selectionRect ? (
      <div
        className="desktop-canvas-selection-rect"
        aria-hidden="true"
        style={{
          left: selectionRect.x,
          top: selectionRect.y,
          width: selectionRect.width,
          height: selectionRect.height,
        }}
      />
    ) : null}
  </div>
);

export default DailyTaskList;

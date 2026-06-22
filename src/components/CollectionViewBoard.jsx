import React, { useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { TaskCardFaviconIcon } from './TaskCard';
import PackItemSourceIcon from './PackItemSourceIcon';
import { getTaskCardPresentation, normalizeCardType, CARD_TYPES } from '../taskCardUtils';
import { getPackItemSourceMeta, getPackExportBodyText } from '../lib/packItemUtils';
import { getLocaleForLanguage, dateKey, shiftDateByDays, parseSharedSelectedDate } from '../lib/dateUtils';
import { getDesktopGroupDisplayName, getDesktopGroupIcon } from '../lib/groupMetadata';

const getDesktopCollectionTimestamp = (tasks) => Math.max(
  0,
  ...tasks.map((task) => {
    const candidates = [task?.updatedAt, task?.createdAt, task?.dateString];
    for (const candidate of candidates) {
      const parsed = Date.parse(candidate || '');
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 0;
  }),
);

const getDesktopCollectionDateLabel = (task, language) => {
  const date = parseSharedSelectedDate(task?.dateString);
  if (!date) return 'Undated';

  const today = new Date();
  const taskDateKey = dateKey(date);
  if (taskDateKey === dateKey(today)) return 'Today';
  if (taskDateKey === dateKey(shiftDateByDays(today, -1))) return 'Yesterday';
  return date.toLocaleDateString(getLocaleForLanguage(language), { month: 'short', day: 'numeric' });
};

const DEFAULT_DESKTOP_COLLECTION_LABEL = 'School work';

const getDesktopCollectionLabel = (tasks) => (
  tasks.find((task) => typeof task.desktopCollectionLabel === 'string' && task.desktopCollectionLabel.trim())?.desktopCollectionLabel.trim()
  || DEFAULT_DESKTOP_COLLECTION_LABEL
);

const getDesktopCollectionDescription = (task, labels) => {
  const { displayTitle, displaySub } = getTaskCardPresentation(task, labels || {});
  const bodyText = getPackExportBodyText(task);
  if (bodyText && bodyText !== displayTitle) return bodyText;
  return displaySub || '';
};

const buildDesktopCollectionRows = (tasks) => {
  const grouped = new Map();
  const taskGroupById = new Map();

  tasks.forEach((task) => {
    if (!task.desktopGroupId) return;

    if (!grouped.has(task.desktopGroupId)) {
      grouped.set(task.desktopGroupId, []);
    }
    grouped.get(task.desktopGroupId).push(task);
    taskGroupById.set(String(task.id), task.desktopGroupId);
  });

  const baseGroupEntries = [...grouped.entries()].map(([groupId, groupTasks]) => {
    const normalizedGroupTasks = [...groupTasks].sort((a, b) => getDesktopCollectionTimestamp([b]) - getDesktopCollectionTimestamp([a]));
    return {
      id: groupId,
      type: 'group',
      tasks: normalizedGroupTasks,
      timestamp: getDesktopCollectionTimestamp(normalizedGroupTasks),
    };
  });
  const groupById = new Map(baseGroupEntries.map((entry) => [entry.id, entry]));
  const adjacency = new Map(baseGroupEntries.map((entry) => [entry.id, new Set()]));
  const groupEdges = [];
  const seenEdges = new Set();

  tasks.forEach((task) => {
    const sourceGroupId = taskGroupById.get(String(task.id));
    if (!sourceGroupId || !Array.isArray(task.desktopLinkIds)) return;

    task.desktopLinkIds.forEach((targetId) => {
      const targetGroupId = taskGroupById.get(String(targetId));
      if (!targetGroupId || sourceGroupId === targetGroupId) return;

      adjacency.get(sourceGroupId)?.add(targetGroupId);
      adjacency.get(targetGroupId)?.add(sourceGroupId);

      const edgeKey = `${sourceGroupId}->${targetGroupId}`;
      if (seenEdges.has(edgeKey)) return;
      seenEdges.add(edgeKey);
      groupEdges.push({
        id: edgeKey,
        sourceGroupId,
        targetGroupId,
      });
    });
  });

  const visited = new Set();
  const groupEntries = baseGroupEntries.map((entry) => {
    if (visited.has(entry.id)) return null;

    const componentGroupIds = [];
    const queue = [entry.id];
    visited.add(entry.id);
    while (queue.length) {
      const groupId = queue.shift();
      componentGroupIds.push(groupId);
      adjacency.get(groupId)?.forEach((nextGroupId) => {
        if (visited.has(nextGroupId)) return;
        visited.add(nextGroupId);
        queue.push(nextGroupId);
      });
    }

    const componentGroups = componentGroupIds
      .map((groupId) => groupById.get(groupId))
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);
    const orderedGroupIds = componentGroups.map((group) => group.id);
    const groupIdSet = new Set(orderedGroupIds);
    const componentEdges = groupEdges.filter((edge) => (
      groupIdSet.has(edge.sourceGroupId) && groupIdSet.has(edge.targetGroupId)
    ));
    const componentTasks = componentGroups.flatMap((group) => group.tasks);

    return {
      id: orderedGroupIds.join('::'),
      type: componentGroups.length > 1 ? 'linked-groups' : 'group',
      groups: componentGroups,
      groupIds: orderedGroupIds,
      primaryGroupId: componentGroups[0]?.id || entry.id,
      tasks: componentTasks,
      edges: componentEdges,
      timestamp: getDesktopCollectionTimestamp(componentTasks),
    };
  }).filter(Boolean);

  return {
    groupEntries: groupEntries.sort((a, b) => b.timestamp - a.timestamp),
  };
};

const CollectionConnectionLayer = ({ edges, markerId }) => {
  const layerRef = useRef(null);
  const [geometry, setGeometry] = useState({ width: 1, height: 1, paths: [] });

  useLayoutEffect(() => {
    const layer = layerRef.current;
    const container = layer?.parentElement;
    if (!container || !edges.length) return undefined;

    const updateGeometry = () => {
      const containerRect = container.getBoundingClientRect();
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      const scaleX = containerRect.width ? width / containerRect.width : 1;
      const scaleY = containerRect.height ? height / containerRect.height : 1;
      const nodeByGroupId = new Map(
        [...container.querySelectorAll('[data-collection-group-id]')]
          .map((node) => [node.getAttribute('data-collection-group-id'), node]),
      );

      const paths = edges.flatMap((edge) => {
        const sourceNode = nodeByGroupId.get(String(edge.sourceGroupId));
        const targetNode = nodeByGroupId.get(String(edge.targetGroupId));
        if (!sourceNode || !targetNode) return [];

        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        const sourceCenter = {
          x: sourceRect.left + (sourceRect.width / 2),
          y: sourceRect.top + (sourceRect.height / 2),
        };
        const targetCenter = {
          x: targetRect.left + (targetRect.width / 2),
          y: targetRect.top + (targetRect.height / 2),
        };
        const dx = targetCenter.x - sourceCenter.x;
        const dy = targetCenter.y - sourceCenter.y;
        let from;
        let to;

        if (Math.abs(dx) >= Math.abs(dy)) {
          from = dx >= 0
            ? { x: sourceRect.right, y: sourceCenter.y }
            : { x: sourceRect.left, y: sourceCenter.y };
          to = dx >= 0
            ? { x: targetRect.left, y: targetCenter.y }
            : { x: targetRect.right, y: targetCenter.y };
        } else {
          from = dy >= 0
            ? { x: sourceCenter.x, y: sourceRect.bottom }
            : { x: sourceCenter.x, y: sourceRect.top };
          to = dy >= 0
            ? { x: targetCenter.x, y: targetRect.top }
            : { x: targetCenter.x, y: targetRect.bottom };
        }

        const normalizePoint = (point) => ({
          x: (point.x - containerRect.left) * scaleX,
          y: (point.y - containerRect.top) * scaleY,
        });
        const normalizedFrom = normalizePoint(from);
        const normalizedTo = normalizePoint(to);
        return [{
          id: edge.id,
          d: `M ${normalizedFrom.x.toFixed(1)} ${normalizedFrom.y.toFixed(1)} L ${normalizedTo.x.toFixed(1)} ${normalizedTo.y.toFixed(1)}`,
        }];
      });

      setGeometry({ width, height, paths });
    };

    updateGeometry();
    const frameId = window.requestAnimationFrame(updateGeometry);
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(updateGeometry) : null;
    resizeObserver?.observe(container);
    container.querySelectorAll('[data-collection-group-id]').forEach((node) => resizeObserver?.observe(node));
    window.addEventListener('resize', updateGeometry);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateGeometry);
    };
  }, [edges]);

  return (
    <svg
      ref={layerRef}
      className="desktop-collection-edge-layer"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 7 3.5 L 0 7 z" className="desktop-collection-edge-arrow" />
        </marker>
      </defs>
      {geometry.paths.map((path) => (
        <path
          key={path.id}
          className="desktop-collection-edge-path"
          d={path.d}
          markerEnd={`url(#${markerId})`}
        />
      ))}
    </svg>
  );
};

const CollectionViewBoard = ({
  tasks,
  appearance,
  labels,
  language,
  onTaskOpen,
  onGroupOpen,
  onGroupLabelUpdate,
}) => {
  const { groupEntries } = useMemo(() => buildDesktopCollectionRows(tasks), [tasks]);
  const [editingCollectionLabelId, setEditingCollectionLabelId] = useState(null);
  const [collectionLabelDraft, setCollectionLabelDraft] = useState('');

  const startCollectionLabelEdit = useCallback((entry) => {
    setEditingCollectionLabelId(entry.id);
    setCollectionLabelDraft(getDesktopCollectionLabel(entry.tasks));
  }, []);

  const cancelCollectionLabelEdit = useCallback(() => {
    setEditingCollectionLabelId(null);
    setCollectionLabelDraft('');
  }, []);

  const commitCollectionLabelEdit = useCallback((entry) => {
    const nextLabel = collectionLabelDraft.trim() || DEFAULT_DESKTOP_COLLECTION_LABEL;
    (entry.groupIds || [entry.primaryGroupId || entry.id]).forEach((groupId) => {
      onGroupLabelUpdate?.(groupId, nextLabel);
    });
    setEditingCollectionLabelId(null);
    setCollectionLabelDraft('');
  }, [collectionLabelDraft, onGroupLabelUpdate]);

  const renderTaskCard = (task) => {
    const { cfg, displayTitle, faviconUrl } = getTaskCardPresentation(task, labels || {});
    const sourceMeta = getPackItemSourceMeta(task, labels || {});
    const description = getDesktopCollectionDescription(task, labels);
    const isVisual = [CARD_TYPES.PHOTO, CARD_TYPES.VIDEO].includes(normalizeCardType(task?.cardType));
    const photoPreview = task?.photoDataUrl || task?.photoUrl;

    return (
      <button
        key={task.id}
        type="button"
        className={`desktop-collection-card desktop-collection-card-item ${isVisual ? 'has-visual-preview' : ''}`}
        onClick={(event) => onTaskOpen(task, event)}
      >
        <span className="desktop-collection-card-icon" aria-hidden="true">
          <TaskCardFaviconIcon task={task} appearance={appearance} cfg={cfg} faviconUrl={faviconUrl} />
        </span>
        <div className="desktop-collection-card-body">
          <div className="desktop-collection-card-meta">
            <span>{sourceMeta.label}</span>
            <span>{getDesktopCollectionDateLabel(task, language)}</span>
          </div>
          <h3>{displayTitle}</h3>
          {isVisual ? (
            <div className="desktop-collection-visual-preview" aria-hidden="true">
              {photoPreview ? (
                <img src={photoPreview} alt="" draggable={false} />
              ) : (
                <span>
                  <PackItemSourceIcon task={task} appearance={appearance} labels={labels} />
                </span>
              )}
            </div>
          ) : null}
          {description ? <p>{description}</p> : null}
        </div>
      </button>
    );
  };

  const renderGroupColumn = (entry, index) => {
    const collectionLabel = getDesktopCollectionLabel(entry.tasks);
    const isEditingCollectionLabel = editingCollectionLabelId === entry.id;
    const groupCardWidth = 336;
    const groupCardGap = 44;
    const columnCount = Math.min(2, entry.groups.length);
    const linkedLayoutWidth = (columnCount * groupCardWidth) + ((columnCount - 1) * groupCardGap);
    const markerId = `desktop-collection-arrow-${index}`;

    return (
      <section
        key={entry.id}
        className={`desktop-collection-column desktop-collection-group-column ${entry.groups.length > 1 ? 'is-linked-collection' : ''}`}
        style={{ width: linkedLayoutWidth + 36, flexBasis: linkedLayoutWidth + 36 }}
      >
        <div className="desktop-collection-label-anchor">
          {isEditingCollectionLabel ? (
            <input
              className="desktop-collection-label-input"
              value={collectionLabelDraft}
              onChange={(event) => setCollectionLabelDraft(event.target.value)}
              onBlur={() => commitCollectionLabelEdit(entry)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitCollectionLabelEdit(entry);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelCollectionLabelEdit();
                }
              }}
              autoFocus
              aria-label="Collection label"
            />
          ) : (
            <button
              type="button"
              className="desktop-collection-label-button"
              onClick={() => startCollectionLabelEdit(entry)}
              title="Rename collection label"
            >
              <span>{collectionLabel}</span>
              <span aria-hidden="true">...</span>
            </button>
          )}
        </div>
        <div
          className="desktop-collection-linked-layout"
          style={{ width: linkedLayoutWidth, gridTemplateColumns: `repeat(${columnCount}, ${groupCardWidth}px)` }}
        >
          {entry.edges.length > 0 ? (
            <CollectionConnectionLayer edges={entry.edges} markerId={markerId} />
          ) : null}
          {entry.groups.map((group, groupIndex) => {
            const groupTitle = getDesktopGroupDisplayName(group.tasks);
            const groupIcon = getDesktopGroupIcon(group.tasks);
            return (
              <div key={group.id} className="desktop-collection-group-node" data-collection-group-id={group.id}>
                <div className="desktop-collection-group-card">
                  <header className="desktop-collection-column-header">
                    <button
                      type="button"
                      className="desktop-collection-column-title-button"
                      onClick={() => onGroupOpen(group.tasks)}
                    >
                      <span className="desktop-collection-column-kicker">
                        {groupIcon || `Group ${index + 1}.${groupIndex + 1}`}
                      </span>
                      <h2>{groupTitle}</h2>
                    </button>
                    <span>{String(group.tasks.length).padStart(2, '0')} items</span>
                  </header>
                  <div className="desktop-collection-column-list">
                    {group.tasks.map((task) => renderTaskCard(task))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  if (groupEntries.length === 0) {
    return (
      <main className="desktop-collection-view" style={{ flex: 1, minHeight: 0 }}>
        <section className="desktop-collection-empty-state" aria-label="Collection View">
          <h1>Collection View</h1>
          <p>Collections in this workspace will appear here.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="desktop-collection-view" style={{ flex: 1, minHeight: 0 }}>
      <div className="desktop-collection-board" aria-label="Collection View">
        {groupEntries.map(renderGroupColumn)}
      </div>
    </main>
  );
};

export default CollectionViewBoard;

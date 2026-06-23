import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import { ChevronRight, FileText, ImageIcon, PenLine, Trash2, X } from 'lucide-react';
import { useSyncedTodos } from '../todoSync';
import { getUserProfile } from '../userProfile';
import DesktopProfilePage from '../components/DesktopProfilePage';
import DesktopHistoryModal from '../components/DesktopHistoryModal';
import IntoDayLogo from '../components/IntoDayLogo';
import { DAY_BOUNDARY_HOUR, getLogicalToday } from '../lib/dateHelpers';
import { useDesktopPreferences } from '../hooks/useDesktopPreferences';
import { useUploadedFileCleanup } from '../hooks/useUploadedFileCleanup';
import { useDesktopWorkspaceState, MAX_DESKTOP_WORKSPACES, DEFAULT_DESKTOP_WORKSPACE_ID } from '../hooks/useDesktopWorkspaceState';
import { useDesktopSelection } from '../hooks/useDesktopSelection';
import {
  useDesktopViewportState,
  DESKTOP_CANVAS_DEFAULT_ZOOM,
  DESKTOP_CANVAS_MIN_SCALE,
  DESKTOP_CANVAS_MAX_SCALE,
  DESKTOP_CANVAS_SCALE_STEP,
  DESKTOP_APP_WINDOW_SCALE,
  DESKTOP_FIXED_UI_SCALE,
} from '../hooks/useDesktopViewportState';
import { createUpdatedTimestamp } from '../lib/packMetadata';
import { getUploadedFileRecord, saveUploadedFileBlob } from '../lib/uploadedFileStorage';
import {
  normalizePackCover,
  normalizePackIcon,
  normalizePackTags,
  PACK_ICON_SUGGESTIONS,
} from '../lib/packPageUtils';

import {
  CARD_TYPES,
  fetchMapMeta,
  fetchVideoMeta,
  fetchSpotifyMeta,
  fetchLinkPreviewMeta,
  getDerivedTaskFields,
  getTaskCardPresentation,
  normalizeCardType,
} from '../taskCardUtils';
import { useTaskInteraction } from '../task-interactions/useTaskInteraction';
import { PlusIcon, CanvasControlSlidersIcon, CanvasControlFitIcon, SearchIcon, CloseIcon, OpenFullViewIcon, ArrowUpIcon, HeaderChevronIcon, EditIcon, LinkGlobeIcon, DocumentTextIcon, VideoGlyphIcon, SparkRosetteIcon, NotionGlyphIcon, GithubGlyphIcon, YouTubeGlyphIcon, ZoomChevronIcon, WorkspaceChevronIcon, WorkspaceMoreIcon, WorkspacePlusIcon } from '../components/icons/AppIcons';
import GlobalStyles from '../components/GlobalStyles';
import DesktopZoomControl from '../components/DesktopZoomControl';
import { TaskCardFaviconIcon, TaskCardContent, TaskCard } from '../components/TaskCard';
import DesktopQuickNoteSidePanel from '../components/DesktopQuickNoteSidePanel';
import DesktopNoteSidePanel from '../components/DesktopNoteSidePanel';
import { composeDesktopNoteText } from '../lib/noteUtils';
import DesktopAddResourcesModal from '../components/DesktopAddResourcesModal';
import DesktopDeleteConfirmModal from '../components/DesktopDeleteConfirmModal';
import DesktopGroupPrompt from '../components/DesktopGroupPrompt';
import DesktopPackPageHeader from '../components/DesktopPackPageHeader';
import GroupedTaskCard from '../components/GroupedTaskCard';
import DailyTaskList from '../components/DailyTaskList';
import AddPanel from '../components/AddPanel';
import PackItemSourceIcon from '../components/PackItemSourceIcon';
import DesktopGroupFullViewModal from '../components/DesktopGroupFullViewModal';
import CollectionViewBoard from '../components/CollectionViewBoard';
import {
  DESKTOP_GROUP_CARD_MIN_HEIGHT,
  DESKTOP_GROUP_CARD_ITEM_HEIGHT,
  DESKTOP_GROUP_CARD_ROW_GAP,
  DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT,
  DESKTOP_GROUP_CARD_EXPANDED_LIST_MAX_HEIGHT,
  DESKTOP_GROUP_CARD_BASE_HEIGHT,
  DESKTOP_GROUP_CARD_MORE_LABEL_HEIGHT,
  getDesktopCollapsedGroupVisibleCount,
  getDesktopGroupCardHeight,
} from '../lib/groupCardLayout';
import {
  dateKey,
  sameDay,
  getTranslationsForLanguage,
  parseSharedSelectedDate,
} from '../lib/dateUtils';
import {
  createQuickLinkPreviews,
  removeQuickAddUrlFromText,
  fetchYouTubeQuickLinkPreview,
} from '../lib/quickLinkUtils';
import {
  getSupportedUploadKind,
  isSupportedUploadFile,
  hasSupportedUploadFiles,
  createUploadedFileStorageKey,
  serializeUploadAttachment,
} from '../lib/uploadUtils';
import {
  getTaskWorkspaceId,
  taskBelongsToWorkspace,
  areTaskIdSelectionsEqual,
} from '../lib/workspaceUtils';
import {
  getDesktopGroupDisplayName,
  getDesktopGroupDisplayTags,
  getSuggestedDesktopGroupName,
} from '../lib/groupMetadata';
import {
  sectionIdToMobileId,
  currentSection,
} from '../lib/timeSectionUtils';
import { getCanvasDeletionSummary } from '../lib/canvasDeletionSummary';
import {
  sections,
  DAY_TASK_TIME_ORDER,
  UPLOADED_FILE_SOURCE_LABEL,
  SUPPORTED_UPLOAD_ACCEPT,
  SUPPORTED_CONVERT_ACCEPT,
  DESKTOP_IMAGE_DROP_MAX_EDGE,
  DESKTOP_IMAGE_DROP_QUALITY,
} from '../lib/desktopConstants';








const DESKTOP_DRAG_START_DISTANCE = 8;
const DESKTOP_GROUP_OVERLAP_THRESHOLD = 0.5;
const DESKTOP_MAIN_CONTENT_MAX_WIDTH = 1008;
const DESKTOP_MAIN_CONTENT_HORIZONTAL_PADDING = 72;
const DESKTOP_DRAG_EDGE_OVERFLOW_TOP = 20;
const DESKTOP_DRAG_EDGE_OVERFLOW_BOTTOM = 64;
const DESKTOP_DRAG_EDGE_RESISTANCE = 0.22;
const DESKTOP_DRAG_MAX_EDGE_OVERFLOW = 96;
const DESKTOP_BASE_SLOT_COUNT = 4;
const DESKTOP_TIME_AXIS_LINE_TOP = 26;
const DESKTOP_TIME_AXIS_LINE_BOTTOM = 36;
const DESKTOP_TIME_MARKER_SIZE = 7;
const DESKTOP_SLOT_MIN_HEIGHT = 98;
const DESKTOP_SLOT_GAP = 22;
const DESKTOP_CANVAS_CARD_WIDTH = 336;
const DESKTOP_CANVAS_CARD_HEIGHT = 92;
const DESKTOP_PHOTO_CARD_HEIGHT = 236;
const DESKTOP_CANVAS_CARD_GAP = 20;

const DESKTOP_CANVAS_MIN_HEIGHT = 560;
const DESKTOP_CANVAS_HITBOX_HORIZONTAL_PADDING = 10;
const DESKTOP_CANVAS_HITBOX_VERTICAL_PADDING = 18;



const isValidDesktopSlot = (value) => Number.isInteger(value) && value >= 0;
const getDesktopSlotCapacity = (tasks) => {
  const preferredSlotCount = tasks.reduce((max, task) => (
    isValidDesktopSlot(task.desktopSlot) ? Math.max(max, task.desktopSlot + 1) : max
  ), 0);
  const itemCount = Math.max(tasks.length, preferredSlotCount);
  return Math.max(
    DESKTOP_BASE_SLOT_COUNT,
    itemCount <= DESKTOP_BASE_SLOT_COUNT ? DESKTOP_BASE_SLOT_COUNT : Math.ceil(itemCount / 2) * 2,
  );
};
const resolveDesktopSectionSlots = (tasks) => {
  const slots = Array.from({ length: getDesktopSlotCapacity(tasks) }, () => null);
  const orderedTasks = tasks
    .map((task, index) => ({
      task,
      index,
      preferredSlot: isValidDesktopSlot(task.desktopSlot) ? task.desktopSlot : null,
    }))
    .sort((a, b) => {
      const aHasSlot = a.preferredSlot !== null;
      const bHasSlot = b.preferredSlot !== null;
      if (aHasSlot && bHasSlot) {
        return a.preferredSlot - b.preferredSlot || a.index - b.index;
      }
      if (aHasSlot) return -1;
      if (bHasSlot) return 1;
      return a.index - b.index;
    });

  orderedTasks.forEach(({ task, preferredSlot }) => {
    let slot = preferredSlot;
    if (slot === null || slots[slot]) {
      slot = slots.findIndex((entry) => entry === null);
    }
    slots[slot] = normalizeTask({ ...task, desktopSlot: slot });
  });

  return { slots };
};
const getFirstAvailableDesktopSlot = (tasks, dateString, timeOfDay) => {
  const { slots } = resolveDesktopSectionSlots(
    tasks.filter((task) => task.dateString === dateString && task.timeOfDay === timeOfDay),
  );
  const index = slots.findIndex((task) => task === null);
  return index === -1 ? null : index;
};
const getDesktopSectionTaskOrder = (tasks, dateString, timeOfDay) => {
  const sectionTasks = tasks.filter((task) => task.dateString === dateString && task.timeOfDay === timeOfDay);
  const { slots } = resolveDesktopSectionSlots(sectionTasks);
  return slots.filter(Boolean);
};
const getDayTaskOrder = (tasks, dateString) => tasks
  .map((task, index) => ({ task, index }))
  .filter(({ task }) => task.dateString === dateString)
  .sort((a, b) => {
    const timeRankA = DAY_TASK_TIME_ORDER.indexOf(a.task.timeOfDay);
    const timeRankB = DAY_TASK_TIME_ORDER.indexOf(b.task.timeOfDay);
    const normalizedTimeRankA = timeRankA === -1 ? DAY_TASK_TIME_ORDER.length : timeRankA;
    const normalizedTimeRankB = timeRankB === -1 ? DAY_TASK_TIME_ORDER.length : timeRankB;
    const slotA = isValidDesktopSlot(a.task.desktopSlot) ? a.task.desktopSlot : Number.POSITIVE_INFINITY;
    const slotB = isValidDesktopSlot(b.task.desktopSlot) ? b.task.desktopSlot : Number.POSITIVE_INFINITY;

    return normalizedTimeRankA - normalizedTimeRankB || slotA - slotB || a.index - b.index;
  })
  .map(({ task }) => task);
const reflowDesktopSectionSlots = (tasks, dateString, timeOfDay, orderedIds = null) => {
  const currentOrderedTasks = getDesktopSectionTaskOrder(tasks, dateString, timeOfDay);
  const orderedTasks = orderedIds
    ? [
      ...orderedIds
        .map((id) => currentOrderedTasks.find((task) => task.id === id))
        .filter(Boolean),
      ...currentOrderedTasks.filter((task) => !orderedIds.includes(task.id)),
    ]
    : currentOrderedTasks;

  orderedTasks.forEach((task, index) => {
    const targetTask = tasks.find((item) => item.id === task.id);
    if (!targetTask) return;
    targetTask.desktopSlot = index;
  });
};
const buildDesktopRenderSections = ({ tasks, selectedDateKey, draggedTaskId, dragOverSection, dragOverSlot }) => {
  const selectedTasks = tasks.filter((task) => task.dateString === selectedDateKey);
  const baseSections = Object.fromEntries(
    sections.map((section) => {
      const { slots } = resolveDesktopSectionSlots(
        selectedTasks.filter((task) => task.timeOfDay === section.mobileId),
      );
      return [section.mobileId, {
        renderSlots: slots.map((task) => (task ? { type: 'task', task } : { type: 'empty' })),
      }];
    }),
  );

  if (!draggedTaskId) return baseSections;

  const draggedTask = tasks.find((task) => task.id === draggedTaskId);
  if (!draggedTask) return baseSections;

  let previewTasks = tasks;
  if (dragOverSection && isValidDesktopSlot(dragOverSlot)) {
    previewTasks = applyDesktopTaskDrop({
      tasks,
      draggedTaskId,
      sourceDateString: draggedTask.dateString,
      sourceSection: draggedTask.timeOfDay,
      sourceSlot: draggedTask.desktopSlot,
      targetDateString: selectedDateKey,
      targetSection: dragOverSection,
      targetSlot: dragOverSlot,
    });
  }

  const previewDraggedTask = previewTasks.find((task) => task.id === draggedTaskId) || draggedTask;
  const previewSections = Object.fromEntries(
    sections.map((section) => {
      const { slots } = resolveDesktopSectionSlots(
        previewTasks.filter((task) => task.dateString === selectedDateKey && task.timeOfDay === section.mobileId),
      );
      const renderSlots = slots.map((task, slotIndex) => {
        if (
          previewDraggedTask.dateString === selectedDateKey
          &&
          previewDraggedTask.timeOfDay === section.mobileId
          && previewDraggedTask.desktopSlot === slotIndex
        ) {
          return { type: 'placeholder' };
        }
        if (task && task.id === draggedTaskId) {
          return { type: 'empty' };
        }
        return task ? { type: 'task', task } : { type: 'empty' };
      });

      return [section.mobileId, { renderSlots }];
    }),
  );

  return previewSections;
};
const applyDesktopTaskDrop = ({
  tasks,
  draggedTaskId,
  sourceDateString,
  sourceSection,
  sourceSlot,
  targetDateString,
  targetSection,
  targetSlot,
}) => {
  if (!targetSection || !isValidDesktopSlot(targetSlot)) return tasks;

  const nextTasks = tasks.map((task) => ({ ...task }));
  const draggedTask = nextTasks.find((task) => task.id === draggedTaskId);
  if (!draggedTask) return tasks;
  const resolvedSourceDateString = sourceDateString || draggedTask.dateString;
  const resolvedTargetDateString = targetDateString || resolvedSourceDateString;
  const targetOrder = getDesktopSectionTaskOrder(
    nextTasks.filter((task) => task.id !== draggedTaskId),
    resolvedTargetDateString,
    targetSection,
  ).map((task) => task.id);
  const insertIndex = Math.max(0, Math.min(targetSlot, targetOrder.length));
  targetOrder.splice(insertIndex, 0, draggedTaskId);

  draggedTask.dateString = resolvedTargetDateString;
  draggedTask.timeOfDay = targetSection;
  draggedTask.desktopSlot = null;

  if (resolvedSourceDateString !== resolvedTargetDateString || sourceSection !== targetSection) {
    reflowDesktopSectionSlots(nextTasks, resolvedSourceDateString, sourceSection);
  }
  reflowDesktopSectionSlots(nextTasks, resolvedTargetDateString, targetSection, targetOrder);
  return nextTasks.map(normalizeTask);
};

const isEditableElement = (target) => (
  target instanceof HTMLElement
  && Boolean(target.closest('input, textarea, button, select, [contenteditable="true"], [role="dialog"]'))
);
const isFiniteCanvasCoordinate = (value) => Number.isFinite(value);
const getDesktopCanvasTaskHeight = (task) => (
  normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO
    ? DESKTOP_PHOTO_CARD_HEIGHT
    : DESKTOP_CANVAS_CARD_HEIGHT
);
const getDesktopDragTaskIds = (task) => (
  Array.isArray(task?.groupTaskIds) && task.groupTaskIds.length > 0
    ? task.groupTaskIds
    : task?.id !== undefined && task?.id !== null
      ? [task.id]
      : []
);
const getDesktopCanvasEntryHeight = (entry) => (
  entry?.type === 'group'
    ? getDesktopGroupCardHeight(entry.tasks, getDesktopCollapsedGroupVisibleCount(entry.tasks))
    : getDesktopCanvasTaskHeight(entry?.task)
);
const getDesktopCanvasEntryTaskIds = (entry) => (
  entry?.type === 'group'
    ? entry.tasks.map((task) => task.id)
    : entry?.task?.id !== undefined && entry?.task?.id !== null
      ? [entry.task.id]
      : []
);
const getDesktopSelectionRect = (start, end) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});


const doDesktopRectsIntersect = (first, second) => !(
  first.x + first.width < second.x
  || second.x + second.width < first.x
  || first.y + first.height < second.y
  || second.y + second.height < first.y
);
const getDefaultDesktopCanvasPosition = (index) => {
  const column = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: column * (DESKTOP_CANVAS_CARD_WIDTH + DESKTOP_CANVAS_CARD_GAP),
    y: row * (DESKTOP_CANVAS_CARD_HEIGHT + DESKTOP_CANVAS_CARD_GAP),
  };
};
const resolveDesktopCanvasEntries = (tasks, dateString) => {
  const selectedTasks = tasks
    .filter((task) => task.dateString === dateString)
    .sort((a, b) => {
      const layerA = Number.isFinite(a.desktopZ) ? a.desktopZ : 0;
      const layerB = Number.isFinite(b.desktopZ) ? b.desktopZ : 0;
      return layerA - layerB || Number(a.id) - Number(b.id);
    });
  const processedGroupIds = new Set();

  return selectedTasks.reduce((entries, task, index) => {
    const fallback = getDefaultDesktopCanvasPosition(index);
    if (task.desktopGroupId) {
      if (processedGroupIds.has(task.desktopGroupId)) {
        return entries;
      }
      const activeGroupTasks = selectedTasks.filter((item) => item.desktopGroupId === task.desktopGroupId);
      const groupedTasks = tasks.filter((item) => item.desktopGroupId === task.desktopGroupId);
      if (groupedTasks.length > 0) {
        processedGroupIds.add(task.desktopGroupId);
        const anchorTask = activeGroupTasks.find((item) => (
          isFiniteCanvasCoordinate(item.desktopCanvasX) && isFiniteCanvasCoordinate(item.desktopCanvasY)
        )) || groupedTasks.find((item) => (
          isFiniteCanvasCoordinate(item.desktopCanvasX) && isFiniteCanvasCoordinate(item.desktopCanvasY)
        )) || task;
        entries.push({
          type: 'group',
          id: task.desktopGroupId,
          task: groupedTasks[0],
          tasks: groupedTasks,
          x: isFiniteCanvasCoordinate(anchorTask.desktopCanvasX) ? anchorTask.desktopCanvasX : fallback.x,
          y: isFiniteCanvasCoordinate(anchorTask.desktopCanvasY) ? anchorTask.desktopCanvasY : fallback.y,
        });
        return entries;
      }
    }

    entries.push({
      type: 'task',
      task,
      x: isFiniteCanvasCoordinate(task.desktopCanvasX) ? task.desktopCanvasX : fallback.x,
      y: isFiniteCanvasCoordinate(task.desktopCanvasY) ? task.desktopCanvasY : fallback.y,
    });
    return entries;
  }, []);
};
const getDesktopCanvasHeight = (entries) => Math.max(
  DESKTOP_CANVAS_MIN_HEIGHT,
  entries.reduce((max, entry) => Math.max(max, entry.y + getDesktopCanvasEntryHeight(entry) + 96), 0),
);
const getNextDesktopCanvasPosition = (tasks, dateString) => {
  const entries = resolveDesktopCanvasEntries(tasks, dateString);
  if (entries.length === 0) return getDefaultDesktopCanvasPosition(0);

  const maxBottom = entries.reduce((max, entry) => Math.max(max, entry.y + getDesktopCanvasEntryHeight(entry)), 0);
  return { x: 0, y: maxBottom + DESKTOP_CANVAS_CARD_GAP };
};
const getDesktopCanvasRectIntersectionArea = (first, second) => {
  const overlapWidth = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x));
  const overlapHeight = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y));
  return overlapWidth * overlapHeight;
};
const getRectCenterPoint = (rect) => ({
  x: rect.x + (rect.width / 2),
  y: rect.y + (rect.height / 2),
});
const DESKTOP_CANVAS_CONNECTION_EDGE_OFFSET = 8;
const getDesktopCanvasEntryRect = (entry) => ({
  x: entry.x,
  y: entry.y,
  width: DESKTOP_CANVAS_CARD_WIDTH,
  height: getDesktopCanvasEntryHeight(entry),
});
const getDesktopCanvasConnectionAnchor = (entry, side = 'right') => {
  const rect = getDesktopCanvasEntryRect(entry);
  const center = getRectCenterPoint(rect);
  const offset = DESKTOP_CANVAS_CONNECTION_EDGE_OFFSET;

  if (side === 'left') {
    return { x: rect.x - offset, y: center.y, side };
  }
  if (side === 'top') {
    return { x: center.x, y: rect.y - offset, side };
  }
  if (side === 'bottom') {
    return { x: center.x, y: rect.y + rect.height + offset, side };
  }

  return {
    x: rect.x + rect.width + offset,
    y: center.y,
    side: 'right',
  };
};
const getDesktopCanvasConnectionSidePair = (sourceEntry, targetEntry) => {
  const sourceCenter = getRectCenterPoint(getDesktopCanvasEntryRect(sourceEntry));
  const targetCenter = getRectCenterPoint(getDesktopCanvasEntryRect(targetEntry));
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left', toSide: 'right' };
  }

  return dy >= 0
    ? { fromSide: 'bottom', toSide: 'top' }
    : { fromSide: 'top', toSide: 'bottom' };
};
const getDesktopCanvasConnectionPoints = (sourceEntry, targetEntry) => {
  const { fromSide, toSide } = getDesktopCanvasConnectionSidePair(sourceEntry, targetEntry);
  return {
    from: getDesktopCanvasConnectionAnchor(sourceEntry, fromSide),
    to: getDesktopCanvasConnectionAnchor(targetEntry, toSide),
  };
};
const inferDesktopCanvasConnectionSide = (point, otherPoint, fallback = 'right') => {
  if (point?.side) return point.side;
  const dx = (otherPoint?.x ?? 0) - (point?.x ?? 0);
  const dy = (otherPoint?.y ?? 0) - (point?.y ?? 0);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
};
const getDesktopCanvasConnectionTangent = (side, from, to) => {
  const dx = Math.abs((to?.x ?? 0) - (from?.x ?? 0));
  const dy = Math.abs((to?.y ?? 0) - (from?.y ?? 0));
  const strength = Math.max(52, Math.min(180, (side === 'top' || side === 'bottom' ? dy : dx) * 0.45));
  if (side === 'left') return { x: -strength, y: 0 };
  if (side === 'top') return { x: 0, y: -strength };
  if (side === 'bottom') return { x: 0, y: strength };
  return { x: strength, y: 0 };
};
const getDesktopCanvasConnectionPath = (from, to) => {
  const fromSide = inferDesktopCanvasConnectionSide(from, to, 'right');
  const toSide = inferDesktopCanvasConnectionSide(to, from, 'left');
  const fromTangent = getDesktopCanvasConnectionTangent(fromSide, from, to);
  const toTangent = getDesktopCanvasConnectionTangent(toSide, to, from);
  const c1x = from.x + fromTangent.x;
  const c1y = from.y + fromTangent.y;
  const c2x = to.x + toTangent.x;
  const c2y = to.y + toTangent.y;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
};
const getDesktopCanvasConnectionMidpoint = (from, to) => ({
  x: (from.x + to.x) / 2,
  y: (from.y + to.y) / 2,
});
const expandDesktopCanvasRect = (rect, horizontal = DESKTOP_CANVAS_HITBOX_HORIZONTAL_PADDING, vertical = DESKTOP_CANVAS_HITBOX_VERTICAL_PADDING) => ({
  x: rect.x - horizontal,
  y: rect.y - vertical,
  width: rect.width + (horizontal * 2),
  height: rect.height + (vertical * 2),
});
const isDesktopCanvasPointInsideRect = (point, rect) => (
  point.x >= rect.x
  && point.x <= rect.x + rect.width
  && point.y >= rect.y
  && point.y <= rect.y + rect.height
);
const getDesktopCanvasOverlapEntry = (tasks, dateString, movingTaskIds, nextPosition, threshold = DESKTOP_GROUP_OVERLAP_THRESHOLD) => {
  const movingTasks = tasks.filter((task) => movingTaskIds.has(task.id));
  if (movingTasks.length === 0) return null;

  const movingHeight = movingTasks.length > 1
    ? getDesktopGroupCardHeight(movingTasks, getDesktopCollapsedGroupVisibleCount(movingTasks))
    : DESKTOP_CANVAS_CARD_HEIGHT;
  const movingRect = {
    x: nextPosition.x,
    y: nextPosition.y,
    width: DESKTOP_CANVAS_CARD_WIDTH,
    height: movingHeight,
  };
  const movingHitRect = expandDesktopCanvasRect(movingRect);
  const movingCenter = {
    x: movingRect.x + (movingRect.width / 2),
    y: movingRect.y + (movingRect.height / 2),
  };

  let bestMatch = null;
  let bestRatio = 0;
  resolveDesktopCanvasEntries(tasks, dateString).forEach((entry) => {
    const entryTaskIds = entry.type === 'group' ? entry.tasks.map((item) => item.id) : [entry.task.id];
    
    // Ignore this entry ONLY if we are moving the exact same set of tasks (all of them).
    // This allows pulling 1 task out of a group and then "putting it back" (overlapping with the group).
    const isMovingExactSameItems = entryTaskIds.length === movingTaskIds.size && entryTaskIds.every(id => movingTaskIds.has(id));
    if (isMovingExactSameItems) return;

    const targetWidth = DESKTOP_CANVAS_CARD_WIDTH;
    const targetHeight = getDesktopCanvasEntryHeight(entry);
    const targetArea = targetWidth * targetHeight;
    const movingArea = movingRect.width * movingRect.height;
    const targetRect = {
      x: entry.x,
      y: entry.y,
      width: targetWidth,
      height: targetHeight,
    };
    const targetHitRect = expandDesktopCanvasRect(targetRect);
    const targetCenter = {
      x: targetRect.x + (targetRect.width / 2),
      y: targetRect.y + (targetRect.height / 2),
    };

    const overlapArea = getDesktopCanvasRectIntersectionArea(movingHitRect, targetHitRect);
    
    const movingCenterInsideTarget = isDesktopCanvasPointInsideRect(movingCenter, targetHitRect);
    const targetCenterInsideMoving = isDesktopCanvasPointInsideRect(targetCenter, movingHitRect);
    if (overlapArea <= 0 && !movingCenterInsideTarget && !targetCenterInsideMoving) return;

    const movingCoverageRatio = overlapArea / movingArea;
    const targetCoverageRatio = overlapArea / targetArea;
    const overlapRatio = Math.max(movingCoverageRatio, targetCoverageRatio);
    const qualifies = (
      movingCoverageRatio >= threshold
      || targetCoverageRatio >= threshold
      || movingCenterInsideTarget
      || targetCenterInsideMoving
    );
    if (qualifies && overlapRatio >= bestRatio) {
      bestRatio = overlapRatio;
      bestMatch = entry;
    }
  });

  return bestMatch ? { entry: bestMatch, ratio: bestRatio } : null;
};
const getDesktopCanvasResolvedPosition = (tasks, dateString, movingTaskIds, preferredPosition) => {
  const movingTasks = tasks.filter((task) => movingTaskIds.has(task.id));
  if (movingTasks.length === 0) return preferredPosition;

  const movingHeight = movingTasks.length > 1
    ? getDesktopGroupCardHeight(movingTasks, getDesktopCollapsedGroupVisibleCount(movingTasks))
    : DESKTOP_CANVAS_CARD_HEIGHT;
  const maxX = Math.max(0, DESKTOP_MAIN_CONTENT_MAX_WIDTH - DESKTOP_CANVAS_CARD_WIDTH);
  const clampedX = Math.min(maxX, preferredPosition.x);
  const stepY = DESKTOP_CANVAS_CARD_GAP + 12;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const candidate = {
      x: clampedX,
      y: preferredPosition.y + (attempt * stepY),
    };
    const result = getDesktopCanvasOverlapEntry(tasks, dateString, movingTaskIds, candidate, 0.01);
    if (!result) return candidate;
    const overlapEntry = result.entry;
    preferredPosition = {
      x: overlapEntry.x,
      y: overlapEntry.y + getDesktopCanvasEntryHeight(overlapEntry) + DESKTOP_CANVAS_CARD_GAP,
    };
  }

  return {
    x: clampedX,
    y: preferredPosition.y,
  };
};

const cleanupDesktopGroupMetadata = (tasks) => {
  // Keep group metadata even when one task remains so dragging one item out of a
  // group does not collapse the pack into a plain standalone task.
  return tasks;
};



const normalizeTask = (task) => {
  const derivedFields = getDerivedTaskFields(task.text || '');

  return {
    ...derivedFields,
    ...task,
    text: task.text || '',
    completed: task.completed ?? false,
    dateString: task.dateString || dateKey(getLogicalToday()),
    timeOfDay: task.timeOfDay || sectionIdToMobileId(task.section),
    cardType: normalizeCardType(task.cardType || derivedFields.cardType),
    updatedAt: typeof task.updatedAt === 'string' && task.updatedAt.trim() ? task.updatedAt : null,
    desktopSlot: isValidDesktopSlot(task.desktopSlot) ? task.desktopSlot : null,
    desktopCanvasX: isFiniteCanvasCoordinate(task.desktopCanvasX) ? task.desktopCanvasX : null,
    desktopCanvasY: isFiniteCanvasCoordinate(task.desktopCanvasY) ? task.desktopCanvasY : null,
    desktopZ: Number.isFinite(task.desktopZ) ? task.desktopZ : null,
    desktopWorkspaceId: getTaskWorkspaceId(task),
    desktopGroupId: typeof task.desktopGroupId === 'string' && task.desktopGroupId.trim() ? task.desktopGroupId : null,
    desktopGroupName: typeof task.desktopGroupName === 'string' && task.desktopGroupName.trim() ? task.desktopGroupName : null,
    desktopGroupIcon: normalizePackIcon(task.desktopGroupIcon),
    desktopGroupCover: normalizePackCover(task.desktopGroupCover),
    desktopGroupTags: normalizePackTags(task.desktopGroupTags),
    desktopCollectionLabel: typeof task.desktopCollectionLabel === 'string' && task.desktopCollectionLabel.trim() ? task.desktopCollectionLabel.trim() : null,
    desktopLinkIds: Array.isArray(task.desktopLinkIds)
      ? [...new Set(task.desktopLinkIds.map((id) => String(id).trim()).filter(Boolean))]
      : [],
    photoDataUrl: typeof task.photoDataUrl === 'string' && task.photoDataUrl.trim() ? task.photoDataUrl : null,
    photoFileName: typeof task.photoFileName === 'string' && task.photoFileName.trim() ? task.photoFileName : null,
    photoMimeType: typeof task.photoMimeType === 'string' && task.photoMimeType.trim() ? task.photoMimeType : null,
    photoWidth: Number.isFinite(task.photoWidth) ? task.photoWidth : null,
    photoHeight: Number.isFinite(task.photoHeight) ? task.photoHeight : null,
    photoUrl: typeof task.photoUrl === 'string' && task.photoUrl.trim() ? task.photoUrl : null,
    photoTitle: typeof task.photoTitle === 'string' && task.photoTitle.trim() ? task.photoTitle : null,
    uploadedFileStorageKey: typeof task.uploadedFileStorageKey === 'string' && task.uploadedFileStorageKey.trim() ? task.uploadedFileStorageKey : null,
    uploadedFileType: typeof task.uploadedFileType === 'string' && task.uploadedFileType.trim() ? task.uploadedFileType : null,
    uploadedOriginalFileName: typeof task.uploadedOriginalFileName === 'string' && task.uploadedOriginalFileName.trim() ? task.uploadedOriginalFileName : null,
    uploadedMimeType: typeof task.uploadedMimeType === 'string' && task.uploadedMimeType.trim() ? task.uploadedMimeType : null,
    uploadedFileSize: Number.isFinite(task.uploadedFileSize) ? task.uploadedFileSize : null,
    uploadedSourceLabel: typeof task.uploadedSourceLabel === 'string' && task.uploadedSourceLabel.trim() ? task.uploadedSourceLabel : null,
    uploadedCreatedAt: typeof task.uploadedCreatedAt === 'string' && task.uploadedCreatedAt.trim() ? task.uploadedCreatedAt : null,
    uploadedUpdatedAt: typeof task.uploadedUpdatedAt === 'string' && task.uploadedUpdatedAt.trim() ? task.uploadedUpdatedAt : null,
    extractedText: typeof task.extractedText === 'string' && task.extractedText.trim() ? task.extractedText : null,
  };
};




























const PACK_EXPORT_SECTION_ORDER = [
  { role: 'Context', heading: 'Context' },
  { role: 'Code', heading: 'Tech' },
  { role: 'Notes', heading: 'Notes' },
  { role: 'Reference', heading: 'Reference' },
];
const PACK_FILTER_ORDER = ['all', 'file', 'link', 'memo'];
const PACK_FILTER_LABELS = {
  all: 'すべて',
  file: 'ファイル',
  link: 'リンク',
  memo: 'メモ',
};

const DEFAULT_DESKTOP_COLLECTION_LABEL = 'School work';





















const MOCK_USER = {
  id: 'prototype-user',
  email: 'lowvincent8@gmail.com',
  user_metadata: {
    full_name: 'Q X',
    avatar_url: '',
  },
};

const DESKTOP_VIEW_MODES = {
  CANVAS: 'canvas',
  COLLECTION: 'collection',
};

function App() {
  const user = MOCK_USER;
  const {
    selectedDate,
    setSelectedDate,
    language,
    setLanguage,
    appearancePreference,
    setAppearancePreference,
    appearance,
    profileOpen,
    setProfileOpen,
    historyOpen,
    setHistoryOpen,
  } = useDesktopPreferences();
  const {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    workspaceMenuOpen,
    setWorkspaceMenuOpen,
    isWorkspaceNameEditing,
    workspaceNameDraft,
    setWorkspaceNameDraft,
    workspaceActionMenu,
    setWorkspaceActionMenu,
    workspaceActionTarget,
    pendingWorkspaceDeletion,
    setPendingWorkspaceDeletion,
    canAddWorkspace,
    workspaceMenuRef,
    workspaceNameInputRef,

    // Handlers
    handleSelectWorkspace,
    handleStartWorkspaceRename,
    handleCommitWorkspaceRename,
    handleCancelWorkspaceRename,
    handleAddWorkspace,
    handleWorkspaceActionsToggle,
    handleWorkspaceDeleteRequest,
    cancelWorkspaceDeletion,
  } = useDesktopWorkspaceState({
    onWorkspaceChange: () => {
      clearSelection();
      setPendingCanvasDeletion(null);
      setActiveGroupView(null);
      setHistoryOpen(false);
    },
  });
  const [desktopViewMode, setDesktopViewMode] = useState(DESKTOP_VIEW_MODES.CANVAS);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [panelOpen, setPanelOpen] = useState(false);
  const [showAddPreview, setShowAddPreview] = useState(false);
  const hoverAddTimeoutRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddMenuOpen, setQuickAddMenuOpen] = useState(false);
  const [quickAddAttachments, setQuickAddAttachments] = useState([]);
  const [quickLinkPreviews, setQuickLinkPreviews] = useState([]);
  const [quickAddReviewOpen, setQuickAddReviewOpen] = useState(false);
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteBody, setQuickNoteBody] = useState('');
  const [addPanelAttachments, setAddPanelAttachments] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCopied, setEditCopied] = useState(false);
  const [notePanelTaskId, setNotePanelTaskId] = useState(null);
  const [notePanelCollapsed, setNotePanelCollapsed] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [isGroupDragActive, setIsGroupDragActive] = useState(false);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [isCanvasFileDragActive, setIsCanvasFileDragActive] = useState(false);
  const [desktopDragOverlapTargetId, setDesktopDragOverlapTargetId] = useState(null);
  const [desktopDragOverlayActive, setDesktopDragOverlayActive] = useState(false);
  const [desktopDragOverlaySnapshot, setDesktopDragOverlaySnapshot] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [pendingGroupPrompt, setPendingGroupPrompt] = useState(null);
  const [pendingGroupName, setPendingGroupName] = useState('');
  const [activeGroupView, setActiveGroupView] = useState(null);
  const [pendingCanvasDeletion, setPendingCanvasDeletion] = useState(null);

  const quickAddMenuRef = useRef(null);
  const quickAddTextareaRef = useRef(null);
  const quickAddFileInputRef = useRef(null);
  const quickAddPhotoInputRef = useRef(null);

  const [tasks, setTasks] = useSyncedTodos({
    normalizeTodo: normalizeTask,
  });
  useUploadedFileCleanup(tasks);
  const t = useMemo(() => getTranslationsForLanguage(language), [language]);
  const userProfile = useMemo(() => getUserProfile(user), [user]);
  const currentWorkspaceTasks = useMemo(
    () => tasks.filter((task) => taskBelongsToWorkspace(task, activeWorkspaceId)),
    [activeWorkspaceId, tasks],
  );
  const selectedDayEntriesRef = useRef([]);
  const {
    selectedTaskIds,
    setSelectedTaskIds,
    selectedTaskIdsRef,
    desktopSelectionRect,
    setDesktopSelectionRect,
    desktopSelectionStateRef,
    updateDesktopSelectionFromRect,
    clearSelection,
  } = useDesktopSelection({
    currentWorkspaceTasks,
    selectedDayEntriesRef,
    getDesktopCanvasEntryHeight,
    getDesktopCanvasEntryTaskIds,
    doDesktopRectsIntersect,
    DESKTOP_CANVAS_CARD_WIDTH,
  });
  const selectedDateRef = useRef(selectedDate);
  const tasksRef = useRef(currentWorkspaceTasks);
  const desktopDragStateRef = useRef({
    pointerId: null,
    taskId: null,
    startX: 0,
    startY: 0,
  });
  const activePointerTaskRef = useRef(null);
  const desktopDragPointerRef = useRef({ x: 0, y: 0 });
  const desktopDragContainerRectRef = useRef(null);
  const desktopDragModeRef = useRef(false);
  const desktopDragSelectedTaskIdsRef = useRef(new Set());
  const desktopDragSelectionPositionsRef = useRef(new Map());
  const desktopDragAnchorStartPositionRef = useRef(null);
  const desktopDragAnchorSizeRef = useRef({ width: DESKTOP_CANVAS_CARD_WIDTH, height: DESKTOP_CANVAS_CARD_HEIGHT });
  const desktopDragAnchorPointerOffsetRef = useRef(null);
  const desktopDragSourceRectRef = useRef(null);
  const desktopDragDetachedFromGroupRef = useRef(false);
  const desktopDragVisualRafRef = useRef(null);
  const desktopDragVisualPendingRef = useRef(null);
  const desktopDragSourceDateKeyRef = useRef(null);
  const desktopDragIsGroupRef = useRef(false);
  const desktopDragOverlayNodeRef = useRef(null);
  const desktopDragOverlaySnapshotRef = useRef(null);
  const desktopDragSourceEntryIdRef = useRef(null);
  const desktopDragOverlapTimeoutRef = useRef(null);
  const desktopDragOverlapStateLastTsRef = useRef(0);
  const dragOverSectionRef = useRef(null);
  const dragOverSlotRef = useRef(null);
  const desktopDragOverlapTargetIdRef = useRef(null);
  const desktopDragOverlapRafRef = useRef(null);
  const desktopDragOverlapPendingRef = useRef(null);
  const suppressTaskClickRef = useRef(null);
  const suppressAllTaskClicksUntilRef = useRef(0);
  const suppressTaskClickTimeoutRef = useRef(null);
  const desktopLayoutRectsRef = useRef(new Map());
  const desktopCanvasContentRef = useRef(null);
  const searchDragSeparateRef = useRef(false);
  const editCopyResetTimerRef = useRef(null);
  const canvasFileDragDepthRef = useRef(0);
  const [desktopConnectionDraft, setDesktopConnectionDraft] = useState(null);
  const [selectedDesktopConnectionKey, setSelectedDesktopConnectionKey] = useState(null);
  const desktopConnectionDraftRef = useRef(null);

  const {
    viewport,
    setViewport,
    viewportRef,
    viewportContainerRef,
    desktopCanvasPanReady,
    setDesktopCanvasPanReady,
    desktopCanvasPanActive,
    setDesktopCanvasPanActive,
    desktopCanvasPanStateRef,
    desktopZoomMenuOpen,
    setDesktopZoomMenuOpen,

    fitDesktopCanvas,
    getCanvasPointFromClient,
    getDragCanvasPointFromClient,
    clampViewportPan,
    updateDesktopCanvasZoom,
    handleDesktopCanvasWheel,
    handleDesktopZoomPresetSelect,
  } = useDesktopViewportState({
    desktopDragContainerRectRef,
  });

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    tasksRef.current = currentWorkspaceTasks;
  }, [currentWorkspaceTasks]);
  useEffect(() => {
    if (!quickAddMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (quickAddMenuRef.current && quickAddMenuRef.current.contains(event.target)) return;
      setQuickAddMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setQuickAddMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quickAddMenuOpen]);
  useLayoutEffect(() => {
    const textarea = quickAddTextareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
    const verticalPadding = 2;
    const maxHeight = (lineHeight * 5) + verticalPadding;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [quickAddText]);
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => () => {
    if (suppressTaskClickTimeoutRef.current !== null) {
      window.clearTimeout(suppressTaskClickTimeoutRef.current);
      suppressTaskClickTimeoutRef.current = null;
    }
    if (editCopyResetTimerRef.current !== null) {
      window.clearTimeout(editCopyResetTimerRef.current);
      editCopyResetTimerRef.current = null;
    }
  }, []);




  const logicalToday = getLogicalToday();
  const todaySelected = sameDay(selectedDate, logicalToday);
  const currentBlock = currentSection(currentTime);





  const getDesktopDragAnchorPosition = useCallback((canvasPoint) => {
    if (!canvasPoint) return null;

    const pointerOffset = desktopDragAnchorPointerOffsetRef.current;
    if (pointerOffset) {
      return {
        x: canvasPoint.x - pointerOffset.x,
        y: canvasPoint.y - pointerOffset.y,
      };
    }

    const anchorSize = desktopDragAnchorSizeRef.current || {
      width: DESKTOP_CANVAS_CARD_WIDTH,
      height: DESKTOP_CANVAS_CARD_HEIGHT,
    };
    return {
      x: canvasPoint.x - (anchorSize.width / 2),
      y: canvasPoint.y - (anchorSize.height / 2),
    };
  }, []);



  const handleDesktopCanvasPointerDown = useCallback((event) => {
    if (event.button !== 0 || isEditableElement(event.target)) return;

    if (event.target instanceof Element && event.target.closest('.desktop-canvas-connection-hit-path, .desktop-canvas-connection-delete')) {
      return;
    }

    setSelectedDesktopConnectionKey(null);

    if (desktopCanvasPanReady) {
      event.preventDefault();
      event.stopPropagation();

      desktopCanvasPanStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPanX: viewportRef.current.panX,
        startPanY: viewportRef.current.panY,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDesktopCanvasPanActive(true);
      return;
    }

    if (event.target instanceof HTMLElement && event.target.closest('.desktop-task-card, .desktop-task-group-row, .desktop-task-actions, .desktop-task-action-button')) {
      return;
    }

    const origin = getCanvasPointFromClient(event.clientX, event.clientY);
    if (!origin) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    desktopSelectionStateRef.current = {
      pointerId: event.pointerId,
      origin,
    };
    setDesktopSelectionRect({ x: origin.x, y: origin.y, width: 0, height: 0 });
    clearSelection();
  }, [clearSelection, desktopCanvasPanReady, desktopSelectionStateRef, getCanvasPointFromClient, setDesktopSelectionRect, desktopCanvasPanStateRef, setDesktopCanvasPanActive, viewportRef]);

  const handleDesktopCanvasPointerMove = useCallback((event) => {
    if (desktopSelectionStateRef.current.pointerId === event.pointerId) {
      const nextPoint = getCanvasPointFromClient(event.clientX, event.clientY);
      if (!nextPoint || !desktopSelectionStateRef.current.origin) return;

      const nextRect = getDesktopSelectionRect(desktopSelectionStateRef.current.origin, nextPoint);
      setDesktopSelectionRect(nextRect);
      updateDesktopSelectionFromRect(nextRect);
      return;
    }

    if (!desktopCanvasPanActive || desktopCanvasPanStateRef.current.pointerId !== event.pointerId) return;

    const dx = event.clientX - desktopCanvasPanStateRef.current.startX;
    const dy = event.clientY - desktopCanvasPanStateRef.current.startY;
    const nextPanX = desktopCanvasPanStateRef.current.startPanX + dx;
    const nextPanY = desktopCanvasPanStateRef.current.startPanY + dy;
    const nextVp = clampViewportPan({ ...viewportRef.current, panX: nextPanX, panY: nextPanY });
    viewportRef.current = nextVp;
    setViewport(nextVp);
  }, [clampViewportPan, desktopCanvasPanActive, desktopSelectionStateRef, getCanvasPointFromClient, setDesktopSelectionRect, updateDesktopSelectionFromRect, desktopCanvasPanStateRef, setViewport, viewportRef]);

  const handleDesktopCanvasPointerEnd = useCallback((event) => {
    if (desktopSelectionStateRef.current.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      desktopSelectionStateRef.current = { pointerId: null, origin: null };
      setDesktopSelectionRect(null);
      return;
    }

    if (desktopCanvasPanStateRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    desktopCanvasPanStateRef.current.pointerId = null;
    setDesktopCanvasPanActive(false);
  }, [desktopSelectionStateRef, setDesktopSelectionRect, desktopCanvasPanStateRef, setDesktopCanvasPanActive]);
  const handleDesktopConnectionPointerDown = useCallback((sourceId, side, event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const normalizedSourceId = String(sourceId);
    const sourceEntry = selectedDayEntriesRef.current.find((entry) => (
      getDesktopCanvasEntryTaskIds(entry).some((taskId) => String(taskId) === normalizedSourceId)
    ));
    const sourceButtonRect = event.currentTarget.getBoundingClientRect();
    const from = getDragCanvasPointFromClient(
      sourceButtonRect.left + (sourceButtonRect.width / 2),
      sourceButtonRect.top + (sourceButtonRect.height / 2),
    );
    const currentPoint = getDragCanvasPointFromClient(event.clientX, event.clientY);
    if (!sourceEntry || !from || !currentPoint) return;

    const draft = {
      pointerId: event.pointerId,
      sourceId: normalizedSourceId,
      from,
      to: currentPoint,
    };
    desktopConnectionDraftRef.current = draft;
    setDesktopConnectionDraft(draft);
  }, [getDragCanvasPointFromClient]);
  const handleDesktopConnectionMouseDown = useCallback((sourceId, side, event) => {
    if (desktopConnectionDraftRef.current || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const normalizedSourceId = String(sourceId);
    const sourceEntry = selectedDayEntriesRef.current.find((entry) => (
      getDesktopCanvasEntryTaskIds(entry).some((taskId) => String(taskId) === normalizedSourceId)
    ));
    const sourceButtonRect = event.currentTarget.getBoundingClientRect();
    const from = getDragCanvasPointFromClient(
      sourceButtonRect.left + (sourceButtonRect.width / 2),
      sourceButtonRect.top + (sourceButtonRect.height / 2),
    );
    const currentPoint = getDragCanvasPointFromClient(event.clientX, event.clientY);
    if (!sourceEntry || !from || !currentPoint) return;

    const draft = {
      pointerId: 'mouse',
      sourceId: normalizedSourceId,
      from,
      to: currentPoint,
    };
    desktopConnectionDraftRef.current = draft;
    setDesktopConnectionDraft(draft);
  }, [getDragCanvasPointFromClient]);

  const handleDesktopConnectionPointerMove = useCallback((event) => {
    const draft = desktopConnectionDraftRef.current;
    if (!draft || draft.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();

    const currentPoint = getDragCanvasPointFromClient(event.clientX, event.clientY);
    if (!currentPoint) return;
    const nextDraft = { ...draft, to: currentPoint };
    desktopConnectionDraftRef.current = nextDraft;
    setDesktopConnectionDraft(nextDraft);
  }, [getDragCanvasPointFromClient]);
  const handleDesktopConnectionMouseMove = useCallback((event) => {
    const draft = desktopConnectionDraftRef.current;
    if (!draft || draft.pointerId !== 'mouse') return;
    event.preventDefault();
    event.stopPropagation();

    const currentPoint = getDragCanvasPointFromClient(event.clientX, event.clientY);
    if (!currentPoint) return;
    const nextDraft = { ...draft, to: currentPoint };
    desktopConnectionDraftRef.current = nextDraft;
    setDesktopConnectionDraft(nextDraft);
  }, [getDragCanvasPointFromClient]);

  const deleteDesktopConnection = useCallback((connectionKey) => {
    if (!connectionKey || !connectionKey.includes('->')) return;
    const [sourceId, targetId] = connectionKey.split('->');
    if (!sourceId || !targetId) return;

    setTasks((prev) => prev.map((task) => {
      if (String(task.id) !== sourceId) return task;
      const nextLinkIds = (Array.isArray(task.desktopLinkIds) ? task.desktopLinkIds : [])
        .map((id) => String(id))
        .filter((id) => id !== targetId);
      return normalizeTask({
        ...task,
        desktopLinkIds: nextLinkIds,
      });
    }));
    setSelectedDesktopConnectionKey(null);
  }, [setTasks]);

  const handleDesktopConnectionPointerEnd = useCallback((event) => {
    const draft = desktopConnectionDraftRef.current;
    if (!draft || (draft.pointerId !== 'mouse' && draft.pointerId !== event.pointerId)) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const targetNode = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.desktop-canvas-card-node');
    const targetId = targetNode?.getAttribute('data-desktop-connection-id');
    if (targetId && targetId !== draft.sourceId) {
      setTasks((prev) => prev.map((task) => {
        if (String(task.id) !== draft.sourceId) return task;
        const nextLinkIds = new Set(Array.isArray(task.desktopLinkIds) ? task.desktopLinkIds : []);
        nextLinkIds.add(String(targetId));
        return normalizeTask({
          ...task,
          desktopLinkIds: [...nextLinkIds],
        });
      }));
      setSelectedDesktopConnectionKey(`${draft.sourceId}->${targetId}`);
    }

    desktopConnectionDraftRef.current = null;
    setDesktopConnectionDraft(null);
  }, [setTasks]);
  useEffect(() => {
    if (!desktopConnectionDraft) return undefined;

    window.addEventListener('pointermove', handleDesktopConnectionPointerMove, { passive: false });
    window.addEventListener('pointerup', handleDesktopConnectionPointerEnd);
    window.addEventListener('pointercancel', handleDesktopConnectionPointerEnd);
    window.addEventListener('mousemove', handleDesktopConnectionMouseMove);
    window.addEventListener('mouseup', handleDesktopConnectionPointerEnd);
    return () => {
      window.removeEventListener('pointermove', handleDesktopConnectionPointerMove);
      window.removeEventListener('pointerup', handleDesktopConnectionPointerEnd);
      window.removeEventListener('pointercancel', handleDesktopConnectionPointerEnd);
      window.removeEventListener('mousemove', handleDesktopConnectionMouseMove);
      window.removeEventListener('mouseup', handleDesktopConnectionPointerEnd);
    };
  }, [desktopConnectionDraft, handleDesktopConnectionMouseMove, handleDesktopConnectionPointerEnd, handleDesktopConnectionPointerMove]);
  useEffect(() => {
    const handleConnectionHit = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const hitPath = target.closest('.desktop-canvas-connection-hit-path');
      if (!hitPath) return;
      const connectionKey = hitPath.getAttribute('data-connection-key');
      if (!connectionKey) return;
      event.preventDefault();
      event.stopPropagation();
      setSelectedDesktopConnectionKey(connectionKey);
    };

    document.addEventListener('mousedown', handleConnectionHit, true);
    document.addEventListener('click', handleConnectionHit, true);
    return () => {
      document.removeEventListener('mousedown', handleConnectionHit, true);
      document.removeEventListener('click', handleConnectionHit, true);
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isEditableElement(event.target)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        setDesktopCanvasPanReady(true);
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedDesktopConnectionKey) {
        event.preventDefault();
        deleteDesktopConnection(selectedDesktopConnectionKey);
        return;
      }

      if (event.shiftKey && event.key === '1') {
        event.preventDefault();
        fitDesktopCanvas();
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && !activeGroupView && !editingTaskId && !panelOpen) {
        if (selectedTaskIdsRef.current.size > 0) {
          event.preventDefault();
          const summary = getCanvasDeletionSummary(t, tasksRef.current, [...selectedTaskIdsRef.current]);
          if (summary) {
            setPendingCanvasDeletion(summary);
          }
        }
        return;
      }

      const isZoomShortcut = (event.metaKey || event.ctrlKey)
        && !event.altKey
        && (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '0');

      if (isZoomShortcut) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === '+' || event.key === '=') {
          updateDesktopCanvasZoom(viewportRef.current.zoom + DESKTOP_CANVAS_SCALE_STEP);
        } else if (event.key === '-') {
          updateDesktopCanvasZoom(viewportRef.current.zoom - DESKTOP_CANVAS_SCALE_STEP);
        } else if (event.key === '0') {
          updateDesktopCanvasZoom(DESKTOP_CANVAS_DEFAULT_ZOOM);
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        updateDesktopCanvasZoom(viewportRef.current.zoom + DESKTOP_CANVAS_SCALE_STEP);
      } else if (event.key === '-') {
        event.preventDefault();
        updateDesktopCanvasZoom(viewportRef.current.zoom - DESKTOP_CANVAS_SCALE_STEP);
      } else if (event.key === '0') {
        event.preventDefault();
        updateDesktopCanvasZoom(DESKTOP_CANVAS_DEFAULT_ZOOM);
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        setDesktopCanvasPanReady(false);
        setDesktopCanvasPanActive(false);
        desktopCanvasPanStateRef.current.pointerId = null;
      }
    };

    const handleWindowBlur = () => {
      setDesktopCanvasPanReady(false);
      setDesktopCanvasPanActive(false);
      desktopCanvasPanStateRef.current.pointerId = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeGroupView, deleteDesktopConnection, editingTaskId, fitDesktopCanvas, panelOpen, selectedDesktopConnectionKey, selectedTaskIdsRef, t, updateDesktopCanvasZoom, desktopCanvasPanStateRef, setDesktopCanvasPanActive, setDesktopCanvasPanReady, viewportRef]);


  const suppressNextTaskClick = useCallback((taskId) => {
    if (suppressTaskClickTimeoutRef.current !== null) {
      window.clearTimeout(suppressTaskClickTimeoutRef.current);
    }
    suppressAllTaskClicksUntilRef.current = Date.now() + 350;
    suppressTaskClickRef.current = taskId;
    suppressTaskClickTimeoutRef.current = window.setTimeout(() => {
      if (suppressTaskClickRef.current === taskId) {
        suppressTaskClickRef.current = null;
      }
      suppressTaskClickTimeoutRef.current = null;
    }, 250);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const resetDesktopDragInteraction = useCallback(() => {
    desktopDragOverlapTargetIdRef.current = null;
    setDesktopDragOverlapTargetId(null);
  }, []);

  const getCanvasRectFromClientRect = useCallback((rect) => {
    if (!rect) return null;
    const topLeft = getCanvasPointFromClient(rect.left, rect.top);
    const bottomRight = getCanvasPointFromClient(rect.right, rect.bottom);
    if (!topLeft || !bottomRight) return null;
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: Math.max(0, bottomRight.x - topLeft.x),
      height: Math.max(0, bottomRight.y - topLeft.y),
    };
  }, [getCanvasPointFromClient]);

  const getActiveDraggedCanvasRect = useCallback((taskId) => {
    const activeNode = desktopDragOverlayNodeRef.current
      || document.getElementById(`desktop-canvas-entry-${taskId}`);
    if (!activeNode) return null;
    return getCanvasRectFromClientRect(activeNode.getBoundingClientRect());
  }, [getCanvasRectFromClientRect]);

  const getDesktopCanvasOverlapEntryFromDom = useCallback((tasks, dateString, movingTaskIds, taskId, fallbackNextPosition, threshold = DESKTOP_GROUP_OVERLAP_THRESHOLD) => {
    const entries = resolveDesktopCanvasEntries(tasks, dateString);
    const movingRect = getActiveDraggedCanvasRect(taskId) || (
      fallbackNextPosition
        ? {
          x: fallbackNextPosition.x,
          y: fallbackNextPosition.y,
          width: DESKTOP_CANVAS_CARD_WIDTH,
          height: DESKTOP_CANVAS_CARD_HEIGHT,
        }
        : null
    );
    if (!movingRect) {
      return fallbackNextPosition
        ? getDesktopCanvasOverlapEntry(tasks, dateString, movingTaskIds, fallbackNextPosition, threshold)
        : null;
    }

    const movingHitRect = expandDesktopCanvasRect(movingRect);
    const movingCenter = getRectCenterPoint(movingRect);
    const movingArea = Math.max(1, movingRect.width * movingRect.height);
    let bestMatch = null;
    let bestRatio = 0;

    entries.forEach((entry) => {
      const entryTaskIds = getDesktopCanvasEntryTaskIds(entry);
      const isMovingExactSameItems = entryTaskIds.length === movingTaskIds.size && entryTaskIds.every((id) => movingTaskIds.has(id));
      if (isMovingExactSameItems) return;

      const entryNode = document.getElementById(`desktop-canvas-entry-${entry.task.id}`);
      const targetRect = entryNode
        ? getCanvasRectFromClientRect(entryNode.getBoundingClientRect())
        : {
          x: entry.x,
          y: entry.y,
          width: DESKTOP_CANVAS_CARD_WIDTH,
          height: getDesktopCanvasEntryHeight(entry),
        };
      if (!targetRect) return;

      const targetHitRect = expandDesktopCanvasRect(targetRect);
      const targetCenter = getRectCenterPoint(targetRect);
      const overlapArea = getDesktopCanvasRectIntersectionArea(movingHitRect, targetHitRect);
      const movingCenterInsideTarget = isDesktopCanvasPointInsideRect(movingCenter, targetHitRect);
      const targetCenterInsideMoving = isDesktopCanvasPointInsideRect(targetCenter, movingHitRect);
      if (overlapArea <= 0 && !movingCenterInsideTarget && !targetCenterInsideMoving) return;

      const targetArea = Math.max(1, targetRect.width * targetRect.height);
      const movingCoverageRatio = overlapArea / movingArea;
      const targetCoverageRatio = overlapArea / targetArea;
      const overlapRatio = Math.max(movingCoverageRatio, targetCoverageRatio);
      const qualifies = (
        movingCoverageRatio >= threshold
        || targetCoverageRatio >= threshold
        || movingCenterInsideTarget
        || targetCenterInsideMoving
      );
      if (qualifies && overlapRatio >= bestRatio) {
        bestRatio = overlapRatio;
        bestMatch = entry;
      }
    });

    const centerAligned = bestMatch
      ? (() => {
        const entryNode = document.getElementById(`desktop-canvas-entry-${bestMatch.task.id}`);
        const targetRect = entryNode
          ? getCanvasRectFromClientRect(entryNode.getBoundingClientRect())
          : {
            x: bestMatch.x,
            y: bestMatch.y,
            width: DESKTOP_CANVAS_CARD_WIDTH,
            height: getDesktopCanvasEntryHeight(bestMatch),
          };
        if (!targetRect) return false;
        const movingCenterPoint = getRectCenterPoint(movingRect);
        const targetCenterPoint = getRectCenterPoint(targetRect);
        const targetHitRect = expandDesktopCanvasRect(targetRect);
        const movingHitRect = expandDesktopCanvasRect(movingRect);
        return (
          isDesktopCanvasPointInsideRect(movingCenterPoint, targetHitRect)
          || isDesktopCanvasPointInsideRect(targetCenterPoint, movingHitRect)
        );
      })()
      : false;

    return bestMatch ? { entry: bestMatch, ratio: bestRatio, rect: movingRect, centerAligned } : null;
  }, [getActiveDraggedCanvasRect, getCanvasRectFromClientRect]);

  const setDesktopDragSourceHidden = useCallback((hidden) => {
    const sourceId = desktopDragSourceEntryIdRef.current;
    if (!sourceId) return;
    const node = document.getElementById(`desktop-canvas-entry-${sourceId}`);
    if (!node) return;
    if (hidden) {
      node.classList.add('desktop-drag-source-hidden');
    } else {
      node.classList.remove('desktop-drag-source-hidden');
    }
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const updateDesktopDragOverlapTarget = useCallback((clientX, clientY, taskId) => {
    const currentPoint = getDragCanvasPointFromClient(clientX, clientY);
    const nextPosition = getDesktopDragAnchorPosition(currentPoint);
    if (!nextPosition) return;

    const movingTaskIds = new Set(
      desktopDragSelectedTaskIdsRef.current.size > 0
        ? [...desktopDragSelectedTaskIdsRef.current]
        : [taskId],
    );

    const overlapResult = getDesktopCanvasOverlapEntryFromDom(
      tasksRef.current,
      dateKey(selectedDateRef.current),
      movingTaskIds,
      taskId,
      nextPosition,
    );

    const nextTargetId = overlapResult?.entry?.id || null;
    const currentTargetId = desktopDragOverlapTargetIdRef.current;

    if (nextTargetId === currentTargetId) return;

    // Stability / Anti-Flicker:
    // If we have a current target and a new candidate, only switch if the new 
    // candidate is meaningfully better (e.g. 10% higher ratio).
    if (currentTargetId && nextTargetId) {
      const currentOverlap = getDesktopCanvasOverlapEntryFromDom(
        tasksRef.current,
        dateKey(selectedDateRef.current),
        movingTaskIds,
        taskId,
        nextPosition,
        0.01, // Use low threshold to get actual ratio even if below 0.6
      );
      // If current still has a decent overlap, don't switch unless next is much better
      if (currentOverlap && currentOverlap.ratio * 1.1 > (overlapResult?.ratio || 0)) {
        return;
      }
    }

    desktopDragOverlapTargetIdRef.current = nextTargetId;

    if (desktopDragModeRef.current && desktopDragIsGroupRef.current) {
      return;
    }

    setDesktopDragOverlapTargetId(nextTargetId);
  }, [getDesktopCanvasOverlapEntryFromDom, getDesktopDragAnchorPosition, getDragCanvasPointFromClient]);

  const flushDesktopDragOverlapUpdate = useCallback(() => {
    desktopDragOverlapRafRef.current = null;
    const pending = desktopDragOverlapPendingRef.current;
    desktopDragOverlapPendingRef.current = null;
    if (!pending) return;
    if (!desktopDragModeRef.current) return;
    if (desktopDragStateRef.current.taskId !== pending.taskId) return;

    updateDesktopDragOverlapTarget(pending.clientX, pending.clientY, pending.taskId);
  }, [updateDesktopDragOverlapTarget]);

  const scheduleDesktopDragOverlapUpdate = useCallback((clientX, clientY, taskId) => {
    desktopDragOverlapPendingRef.current = { clientX, clientY, taskId };
    if (desktopDragIsGroupRef.current) {
      if (desktopDragOverlapTimeoutRef.current === null) {
        desktopDragOverlapTimeoutRef.current = window.setTimeout(() => {
          desktopDragOverlapTimeoutRef.current = null;
          flushDesktopDragOverlapUpdate();
        }, 34);
      }
      return;
    }

    if (desktopDragOverlapRafRef.current === null) {
      desktopDragOverlapRafRef.current = window.requestAnimationFrame(flushDesktopDragOverlapUpdate);
    }
  }, [flushDesktopDragOverlapUpdate]);

  const getNearestDesktopDropTarget = useCallback((clientX, clientY) => {
    const slots = document.querySelectorAll('[data-desktop-slot-id]');
    let nearest = null;
    let nearestScore = Number.POSITIVE_INFINITY;

    slots.forEach((slot) => {
      const rect = slot.getBoundingClientRect();
      const clampedX = Math.max(rect.left, Math.min(clientX, rect.right));
      const clampedY = Math.max(rect.top, Math.min(clientY, rect.bottom));
      const edgeDistance = Math.hypot(clientX - clampedX, clientY - clampedY);
      const centerDistance = Math.hypot(clientX - (rect.left + (rect.width / 2)), clientY - (rect.top + (rect.height / 2)));
      const score = (edgeDistance * 1000) + centerDistance;
      if (score < nearestScore) {
        nearestScore = score;
        nearest = {
          section: slot.getAttribute('data-desktop-slot-section'),
          slot: Number(slot.getAttribute('data-desktop-slot-index')),
        };
      }
    });

    return nearest;
  }, []);


  const syncDesktopDraggedTaskPosition = useCallback((clientX, clientY) => {
    const currentPt = getDragCanvasPointFromClient(clientX, clientY);
    if (!currentPt) return;

    const anchorStart = desktopDragAnchorStartPositionRef.current;
    if (!anchorStart) return;
    const nextAnchor = getDesktopDragAnchorPosition(currentPt);
    if (!nextAnchor) return;
    const nextAnchorX = nextAnchor.x;
    const nextAnchorY = nextAnchor.y;
    const dx = nextAnchorX - anchorStart.x;
    const dy = nextAnchorY - anchorStart.y;

    const overlayNode = desktopDragOverlayNodeRef.current;
    if (overlayNode) {
      overlayNode.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      overlayNode.style.zIndex = '999';
      return;
    }

    const movingIds = desktopDragSelectedTaskIdsRef.current.size > 0
      ? [...desktopDragSelectedTaskIdsRef.current]
      : [desktopDragStateRef.current.taskId];

    movingIds.forEach((id) => {
      // Target the absolutely-positioned canvas entry node (not the inner wrapper)
      const node = document.getElementById(`desktop-canvas-entry-${id}`);
      if (node) {
        node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        node.style.zIndex = '999';
      }
    });
  }, [getDesktopDragAnchorPosition, getDragCanvasPointFromClient]);

  const flushDesktopDragVisualUpdate = useCallback(() => {
    desktopDragVisualRafRef.current = null;
    const pending = desktopDragVisualPendingRef.current;
    desktopDragVisualPendingRef.current = null;
    if (!pending) return;
    if (!desktopDragModeRef.current) return;
    if (desktopDragStateRef.current.taskId !== pending.taskId) return;

    syncDesktopDraggedTaskPosition(pending.clientX, pending.clientY);
  }, [syncDesktopDraggedTaskPosition]);

  const scheduleDesktopDragVisualUpdate = useCallback((clientX, clientY, taskId) => {
    desktopDragVisualPendingRef.current = { clientX, clientY, taskId };
    if (desktopDragVisualRafRef.current === null) {
      desktopDragVisualRafRef.current = window.requestAnimationFrame(flushDesktopDragVisualUpdate);
    }
  }, [flushDesktopDragVisualUpdate]);


  const startDesktopTaskDrag = useCallback((task) => {
    setHistoryOpen(false); // Ensure modal closes when drag starts

    const taskId = task.id;
    desktopDragSourceEntryIdRef.current = taskId;
    desktopDragSourceDateKeyRef.current = dateKey(selectedDateRef.current);
    desktopDragIsGroupRef.current = !!task.isGroupInitiator;
    desktopDragContainerRectRef.current = viewportContainerRef.current?.getBoundingClientRect?.() || null;
    const movingTaskIds = desktopDragSelectedTaskIdsRef.current.size > 0
      ? [...desktopDragSelectedTaskIdsRef.current]
      : getDesktopDragTaskIds(task);
    const isDetachedGroupTask = !desktopDragIsGroupRef.current && !!task.desktopGroupId && movingTaskIds.length === 1;
    desktopDragDetachedFromGroupRef.current = isDetachedGroupTask;

    // Record original canvas positions of all moving tasks for multi-drag delta math
    const entryPositionMap = new Map();
    selectedDayEntriesRef.current.forEach((entry) => {
      const taskIds = getDesktopCanvasEntryTaskIds(entry);
      taskIds.forEach((entryTaskId) => {
        entryPositionMap.set(entryTaskId, { x: entry.x, y: entry.y });
      });
    });
    const sourceRect = desktopDragSourceRectRef.current;
    const sourceCanvasPoint = sourceRect
      ? getCanvasPointFromClient(sourceRect.left, sourceRect.top)
      : null;
    const anchorPosition = sourceCanvasPoint || entryPositionMap.get(taskId) || { x: 0, y: 0 };
    const nextPositions = new Map();
    movingTaskIds.forEach((movingTaskId) => {
      const movingPosition = entryPositionMap.get(movingTaskId) || anchorPosition;
      nextPositions.set(movingTaskId, movingPosition);
    });
    desktopDragSelectionPositionsRef.current = nextPositions;
    desktopDragAnchorStartPositionRef.current = anchorPosition;

    const anchorEntry = selectedDayEntriesRef.current.find((entry) => getDesktopCanvasEntryTaskIds(entry).includes(taskId)) || null;
    const overlaySnapshot = {
      taskId,
      type: desktopDragIsGroupRef.current ? 'group' : 'task',
      baseX: anchorPosition.x,
      baseY: anchorPosition.y,
      task: null,
      tasks: null,
    };

    if (desktopDragIsGroupRef.current) {
      const resolvedTasks = anchorEntry?.type === 'group'
        ? anchorEntry.tasks
        : tasksRef.current.filter((candidate) => Array.isArray(task.groupTaskIds) && task.groupTaskIds.includes(candidate.id));
      overlaySnapshot.tasks = resolvedTasks.map((item) => ({ ...item }));
    } else {
      const resolvedTask = tasksRef.current.find((candidate) => candidate.id === taskId) || task;
      overlaySnapshot.task = { ...resolvedTask };
    }

    desktopDragOverlaySnapshotRef.current = overlaySnapshot;
    setDesktopDragOverlaySnapshot(overlaySnapshot);
    setDesktopDragOverlayActive(isDetachedGroupTask);
    desktopDragAnchorSizeRef.current = {
      width: DESKTOP_CANVAS_CARD_WIDTH,
      height: anchorEntry ? getDesktopCanvasEntryHeight(anchorEntry) : DESKTOP_CANVAS_CARD_HEIGHT,
    };

    desktopDragModeRef.current = true;
    document.body.classList.add('desktop-task-dragging');

    movingTaskIds.forEach((movingTaskId) => {
      // Mark the canvas-card-shell (direct child of the canvas entry node) for the lift CSS
      const entryNode = document.getElementById(`desktop-canvas-entry-${movingTaskId}`);
      const shell = entryNode?.querySelector('.desktop-canvas-card-shell');
      if (shell) shell.classList.add('is-dragging');
    });

    setDraggedTaskId(taskId);
    setIsGroupDragActive(!!task.isGroupInitiator);

    // Center-locked snap: force a visual sync immediately when drag mode begins.
    syncDesktopDraggedTaskPosition(desktopDragPointerRef.current.x, desktopDragPointerRef.current.y);
    scheduleDesktopDragVisualUpdate(desktopDragPointerRef.current.x, desktopDragPointerRef.current.y, taskId);
  }, [getCanvasPointFromClient, scheduleDesktopDragVisualUpdate, setDesktopDragSourceHidden, setHistoryOpen, syncDesktopDraggedTaskPosition, viewportContainerRef]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const finishDesktopTaskDrag = useCallback((task, pointerTarget, pointerId) => {
    resetDesktopDragInteraction();
    if (desktopDragOverlapRafRef.current !== null) {
      window.cancelAnimationFrame(desktopDragOverlapRafRef.current);
      desktopDragOverlapRafRef.current = null;
    }
    desktopDragOverlapPendingRef.current = null;
    if (desktopDragOverlapTimeoutRef.current !== null) {
      window.clearTimeout(desktopDragOverlapTimeoutRef.current);
      desktopDragOverlapTimeoutRef.current = null;
    }
    if (desktopDragVisualRafRef.current !== null) {
      window.cancelAnimationFrame(desktopDragVisualRafRef.current);
      desktopDragVisualRafRef.current = null;
    }
    desktopDragVisualPendingRef.current = null;
    desktopDragContainerRectRef.current = null;
    setDesktopDragSourceHidden(false);

    const movingTaskIds = desktopDragSelectedTaskIdsRef.current.size > 0
      ? [...desktopDragSelectedTaskIdsRef.current]
      : getDesktopDragTaskIds(task);

    if (desktopDragModeRef.current) {
      suppressNextTaskClick(task.id);

      const liveDraggedRect = getActiveDraggedCanvasRect(task.id);
      const currentPt = getDragCanvasPointFromClient(
        desktopDragPointerRef.current.x,
        desktopDragPointerRef.current.y,
      );

      if (currentPt || liveDraggedRect) {
        const anchorStart = desktopDragAnchorStartPositionRef.current || { x: 0, y: 0 };
        const pointerPosition = currentPt ? getDesktopDragAnchorPosition(currentPt) : null;
        const nextPosition = pointerPosition || (liveDraggedRect ? { x: liveDraggedRect.x, y: liveDraggedRect.y } : null);

        if (!nextPosition) {
          desktopDragModeRef.current = false;
          return;
        }
        const deltaX = nextPosition.x - anchorStart.x;
        const deltaY = nextPosition.y - anchorStart.y;

        flushSync(() => {
          setTasks((prev) => {
            const isGroupDrag = !!task.isGroupInitiator;
            const movingTaskIds = new Set(
              desktopDragSelectedTaskIdsRef.current.size > 0
                ? [...desktopDragSelectedTaskIdsRef.current]
                : (isGroupDrag ? task.groupTaskIds : [task.id]),
            );
            const activeDateKey = selectedDateRef.current ? dateKey(selectedDateRef.current) : task.dateString;
            const overlapResult = searchDragSeparateRef.current
              ? null
              : getDesktopCanvasOverlapEntryFromDom(prev, activeDateKey, movingTaskIds, task.id, nextPosition);
            const overlapEntry = overlapResult?.entry;
            const timestamp = Date.now();
            const isMultiDrag = desktopDragSelectedTaskIdsRef.current.size > 1;
            const isDetachedGroupTask = desktopDragDetachedFromGroupRef.current && !isMultiDrag && movingTaskIds.size === 1;
            const shouldAllowMergePrompt = !overlapEntry
              ? false
              : !isGroupDrag || !!overlapResult?.centerAligned;
            const applyDroppedPosition = (tasksToMap) => tasksToMap.map((item) => {
              if (!movingTaskIds.has(item.id)) return item;
              const itemStartPosition = desktopDragSelectionPositionsRef.current.get(item.id) || anchorStart;
              const shouldResetGroup = !isGroupDrag && !isMultiDrag;
              const resetGroupProps = shouldResetGroup ? {
                desktopGroupId: null,
                desktopGroupName: null,
                desktopGroupIcon: null,
                desktopGroupTags: [],
                desktopGroupCover: null,
                desktopCollectionLabel: null,
              } : {};

              return normalizeTask({
                ...item,
                ...resetGroupProps,
                dateString: activeDateKey,
                desktopSlot: null,
                desktopCanvasX: Number((isDetachedGroupTask ? nextPosition.x : (itemStartPosition.x + deltaX)).toFixed(1)),
                desktopCanvasY: Number((isDetachedGroupTask ? nextPosition.y : (itemStartPosition.y + deltaY)).toFixed(1)),
                desktopZ: timestamp,
              });
            });

            if (overlapEntry && shouldAllowMergePrompt) {
              const movingTasks = prev.filter((item) => movingTaskIds.has(item.id));

              // Put Back Logic: If the target group is the group this task is already in, merge instantly
              const isPutBack = overlapEntry.type === 'group' && movingTasks.every(t => t.desktopGroupId === overlapEntry.id);

              if (isPutBack) {
                return prev.map((item) => {
                  if (!movingTaskIds.has(item.id)) return item;
                  return normalizeTask({
                    ...item,
                    dateString: activeDateKey,
                    desktopCanvasX: overlapEntry.x,
                    desktopCanvasY: overlapEntry.y,
                    desktopZ: timestamp,
                  });
                });
              }

              setPendingGroupPrompt({
                movingTaskIds: [...movingTaskIds],
                targetTaskIds: overlapEntry.type === 'group' ? overlapEntry.tasks.map((item) => item.id) : [overlapEntry.task.id],
                groupId: overlapEntry.type === 'group' ? overlapEntry.id : `desktop-group-${timestamp}`,
                anchorX: desktopDragPointerRef.current.x,
                anchorY: desktopDragPointerRef.current.y,
                targetDateKey: activeDateKey,
                overlapX: overlapEntry.x,
                overlapY: overlapEntry.y,
                dropX: nextPosition.x,
                dropY: nextPosition.y,
                fallbackPosition: getDesktopCanvasResolvedPosition(prev, activeDateKey, movingTaskIds, {
                  x: overlapEntry.x,
                  y: overlapEntry.y + getDesktopCanvasEntryHeight(overlapEntry) + DESKTOP_CANVAS_CARD_GAP,
                }),
              });
              setPendingGroupName(getSuggestedDesktopGroupName(movingTasks, overlapEntry));
              return applyDroppedPosition(prev);
            }

            setPendingGroupPrompt(null);
            return applyDroppedPosition(prev);
          });
        });
      }
    }

    // Reset live transform and class on every dragged canvas entry node
    movingTaskIds.forEach((movingTaskId) => {
      const node = document.getElementById(`desktop-canvas-entry-${movingTaskId}`);
      if (node) {
        node.style.transform = '';
        node.style.zIndex = '';
        const shell = node.querySelector('.desktop-canvas-card-shell');
        if (shell) shell.classList.remove('is-dragging');
      }
    });

    document.body.classList.remove('desktop-task-dragging');

    desktopDragModeRef.current = false;
    desktopDragStateRef.current = { pointerId: null, taskId: null, startX: 0, startY: 0 };
    desktopDragSelectionPositionsRef.current = new Map();
    desktopDragAnchorStartPositionRef.current = null;
    desktopDragAnchorSizeRef.current = { width: DESKTOP_CANVAS_CARD_WIDTH, height: DESKTOP_CANVAS_CARD_HEIGHT };
    desktopDragAnchorPointerOffsetRef.current = null;
    desktopDragSourceRectRef.current = null;
    desktopDragSourceDateKeyRef.current = null;
    desktopDragDetachedFromGroupRef.current = false;
    desktopDragIsGroupRef.current = false;
    desktopDragOverlaySnapshotRef.current = null;
    desktopDragSourceEntryIdRef.current = null;
    desktopDragOverlapStateLastTsRef.current = 0;
    dragOverSectionRef.current = null;
    dragOverSlotRef.current = null;
    desktopDragSelectedTaskIdsRef.current = new Set();
    searchDragSeparateRef.current = false;
    setDragOverSection(null);
    setDragOverSlot(null);
    setDraggedTaskId(null);
    setIsGroupDragActive(false);
    setDesktopDragOverlayActive(false);
    setDesktopDragOverlaySnapshot(null);

    if (pointerTarget?.hasPointerCapture?.(pointerId)) {
      try {
        pointerTarget.releasePointerCapture(pointerId);
      } catch (_) {
        // Pointer capture may already be released.
      }
    }
  }, [getActiveDraggedCanvasRect, getDesktopCanvasOverlapEntryFromDom, getDesktopDragAnchorPosition, getDragCanvasPointFromClient, resetDesktopDragInteraction, setDesktopDragSourceHidden, setTasks, suppressNextTaskClick]);


  const handleTaskPointerDown = useCallback((task, event) => {
    if (!event.isPrimary || event.button !== 0) return;

    const taskSelectionIds = getDesktopDragTaskIds(task);
    const isWithinCurrentSelection = taskSelectionIds.some((taskId) => selectedTaskIdsRef.current.has(taskId));
    const dragTaskIds = isWithinCurrentSelection && selectedTaskIdsRef.current.size > 0
      ? [...selectedTaskIdsRef.current]
      : taskSelectionIds;

    desktopDragSelectedTaskIdsRef.current = new Set(dragTaskIds);
    setDesktopSelectionRect(null);
    desktopSelectionStateRef.current = { pointerId: null, origin: null };
    activePointerTaskRef.current = task;
    desktopDragModeRef.current = false;
    desktopDragStateRef.current = {
      pointerId: event.pointerId,
      taskId: task.id,
      startX: event.clientX,
      startY: event.clientY,
    };
    desktopDragPointerRef.current = { x: event.clientX, y: event.clientY };
    if (event.currentTarget instanceof HTMLElement) {
      const isDetachedGroupTask = !!task.desktopGroupId && !task.isGroupInitiator;
      const sourceNode = isDetachedGroupTask
        ? event.currentTarget.closest('.desktop-task-wrapper') || event.currentTarget
        : event.currentTarget.closest('.desktop-canvas-card-node') || event.currentTarget.closest('.desktop-task-wrapper') || event.currentTarget;
      const rect = sourceNode.getBoundingClientRect();
      const sourceCanvasPoint = getCanvasPointFromClient(rect.left, rect.top);
      const pointerCanvasPoint = getCanvasPointFromClient(event.clientX, event.clientY);
      desktopDragSourceRectRef.current = rect;
      desktopDragAnchorPointerOffsetRef.current = sourceCanvasPoint && pointerCanvasPoint
        ? {
          x: pointerCanvasPoint.x - sourceCanvasPoint.x,
          y: pointerCanvasPoint.y - sourceCanvasPoint.y,
        }
        : null;
    } else {
      desktopDragSourceRectRef.current = null;
      desktopDragAnchorPointerOffsetRef.current = null;
    }
    desktopDragDetachedFromGroupRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [desktopSelectionStateRef, getCanvasPointFromClient, selectedTaskIdsRef, setDesktopSelectionRect]);

  const processDesktopDragMove = useCallback((task, clientX, clientY, nativeEvent = null) => {
    desktopDragPointerRef.current = { x: clientX, y: clientY };
    const deltaX = clientX - desktopDragStateRef.current.startX;
    const deltaY = clientY - desktopDragStateRef.current.startY;

    if (!desktopDragModeRef.current) {
      const distance = Math.hypot(deltaX, deltaY);
      if (distance >= DESKTOP_DRAG_START_DISTANCE) {
        startDesktopTaskDrag(task);
      } else {
        return;
      }
    }

    if (nativeEvent?.cancelable) {
      nativeEvent.preventDefault();
    }
    scheduleDesktopDragVisualUpdate(clientX, clientY, task.id);
    scheduleDesktopDragOverlapUpdate(clientX, clientY, task.id);
  }, [scheduleDesktopDragOverlapUpdate, scheduleDesktopDragVisualUpdate, startDesktopTaskDrag]);

  const handleTaskPointerMove = useCallback((task, event) => {
    if (desktopDragStateRef.current.pointerId !== event.pointerId || desktopDragStateRef.current.taskId !== task.id) return;
    processDesktopDragMove(task, event.clientX, event.clientY, event);
  }, [processDesktopDragMove]);

  const handleTaskPointerUp = useCallback((task, event) => {
    if (desktopDragStateRef.current.pointerId !== event.pointerId || desktopDragStateRef.current.taskId !== task.id) return;
    if (desktopDragModeRef.current) {
      finishDesktopTaskDrag(task, event.currentTarget, event.pointerId);
      activePointerTaskRef.current = null;
      return;
    }

    desktopDragStateRef.current = { pointerId: null, taskId: null, startX: 0, startY: 0 };
    activePointerTaskRef.current = null;
    desktopDragAnchorPointerOffsetRef.current = null;
    desktopDragSourceRectRef.current = null;
    desktopDragDetachedFromGroupRef.current = false;
    if (event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_) {
        // Pointer capture may already be released.
      }
    }
  }, [finishDesktopTaskDrag, setHistoryOpen]);

  const handleTaskPointerCancel = useCallback((task, event) => {
    if (desktopDragStateRef.current.pointerId !== event.pointerId || desktopDragStateRef.current.taskId !== task.id) return;
    if (desktopDragModeRef.current) {
      finishDesktopTaskDrag(task, event.currentTarget, event.pointerId);
      activePointerTaskRef.current = null;
      return;
    }

    desktopDragStateRef.current = { pointerId: null, taskId: null, startX: 0, startY: 0 };
    activePointerTaskRef.current = null;
    desktopDragAnchorPointerOffsetRef.current = null;
    desktopDragSourceRectRef.current = null;
    desktopDragDetachedFromGroupRef.current = false;
    if (event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_) {
        // Pointer capture may already be released.
      }
    }
  }, [finishDesktopTaskDrag]);

  useEffect(() => {
    const handleWindowPointerMove = (event) => {
      const activeTask = activePointerTaskRef.current;
      if (!activeTask) return;
      if (desktopDragStateRef.current.pointerId !== event.pointerId || desktopDragStateRef.current.taskId !== activeTask.id) return;
      processDesktopDragMove(activeTask, event.clientX, event.clientY, event);
    };

    const handleWindowPointerEnd = (event) => {
      const activeTask = activePointerTaskRef.current;
      if (!activeTask) return;
      if (desktopDragStateRef.current.pointerId !== event.pointerId || desktopDragStateRef.current.taskId !== activeTask.id) return;

      if (desktopDragModeRef.current) {
        finishDesktopTaskDrag(activeTask, null, event.pointerId);
      } else {
        desktopDragStateRef.current = { pointerId: null, taskId: null, startX: 0, startY: 0 };
        desktopDragAnchorPointerOffsetRef.current = null;
        desktopDragSourceRectRef.current = null;
        desktopDragDetachedFromGroupRef.current = false;
        resetDesktopDragInteraction();
      }
      activePointerTaskRef.current = null;
    };

    const handleWindowMouseMove = (event) => {
      const activeTask = activePointerTaskRef.current;
      if (!activeTask) return;
      if (desktopDragStateRef.current.taskId !== activeTask.id) return;
      if ((event.buttons & 1) !== 1 && !desktopDragModeRef.current) return;

      processDesktopDragMove(activeTask, event.clientX, event.clientY, event);
    };

    const handleWindowMouseUp = () => {
      const activeTask = activePointerTaskRef.current;
      if (!activeTask) return;

      if (desktopDragModeRef.current) {
        finishDesktopTaskDrag(activeTask, null, null);
      } else {
        desktopDragStateRef.current = { pointerId: null, taskId: null, startX: 0, startY: 0 };
        desktopDragAnchorPointerOffsetRef.current = null;
        desktopDragSourceRectRef.current = null;
        desktopDragDetachedFromGroupRef.current = false;
        resetDesktopDragInteraction();
      }
      activePointerTaskRef.current = null;
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);
    window.addEventListener('mousemove', handleWindowMouseMove, { passive: false });
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [finishDesktopTaskDrag, processDesktopDragMove, resetDesktopDragInteraction]);

  const selectedDateKey = dateKey(selectedDate);
  const selectedDayEntries = useMemo(
    () => resolveDesktopCanvasEntries(currentWorkspaceTasks, selectedDateKey),
    [currentWorkspaceTasks, selectedDateKey],
  );
  const desktopVisibilityDiagnostics = useMemo(() => {
    const workspaceTaskCount = currentWorkspaceTasks.length;
    const dateMatchedTasks = currentWorkspaceTasks.filter((task) => task.dateString === selectedDateKey);

    return {
      totalTaskCount: tasks.length,
      workspaceTaskCount,
      dateMatchedCount: dateMatchedTasks.length,
      shouldShow: selectedDayEntries.length === 0 && (
        tasks.length > 0
        || workspaceTaskCount > 0
        || dateMatchedTasks.length > 0
      ),
    };
  }, [currentWorkspaceTasks, selectedDateKey, selectedDayEntries.length, tasks.length]);
  useEffect(() => {
    selectedDayEntriesRef.current = selectedDayEntries;
  }, [selectedDayEntries]);
  useEffect(() => {
    if (!draggedTaskId || !desktopDragModeRef.current) {
      if (desktopDragOverlayActive) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDesktopDragOverlayActive(false);
      }
      setDesktopDragSourceHidden(false);
      return;
    }

    const sourceKey = desktopDragSourceDateKeyRef.current;
    if (!sourceKey) return;

    const shouldOverlay = (
      desktopDragOverlayActive
      || desktopDragDetachedFromGroupRef.current
      || selectedDateKey !== sourceKey
    );
    const shouldHideSource = !desktopDragDetachedFromGroupRef.current && selectedDateKey !== sourceKey;
    if (!desktopDragOverlayActive && shouldOverlay) {
      setDesktopDragOverlayActive(true);
    }
    setDesktopDragSourceHidden(shouldHideSource);
  }, [desktopDragOverlayActive, draggedTaskId, selectedDateKey, setDesktopDragSourceHidden]);

  useLayoutEffect(() => {
    if (!desktopDragOverlayActive || !desktopDragOverlaySnapshot) return;
    syncDesktopDraggedTaskPosition(desktopDragPointerRef.current.x, desktopDragPointerRef.current.y);
  }, [desktopDragOverlayActive, desktopDragOverlaySnapshot, syncDesktopDraggedTaskPosition]);
  const selectedDayCanvasHeight = useMemo(
    () => getDesktopCanvasHeight(selectedDayEntries),
    [selectedDayEntries],
  );
  const selectedDayConnectionLinks = useMemo(() => {
    const entryByTaskId = new Map();
    selectedDayEntries.forEach((entry) => {
      if (entry.type === 'group') {
        entry.tasks.forEach((task) => entryByTaskId.set(String(task.id), entry));
      } else if (entry.task) {
        entryByTaskId.set(String(entry.task.id), entry);
      }
    });

    const seen = new Set();
    return currentWorkspaceTasks.flatMap((task) => {
      const sourceId = String(task.id);
      const sourceEntry = entryByTaskId.get(sourceId);
      if (!sourceEntry || !Array.isArray(task.desktopLinkIds)) return [];

      return task.desktopLinkIds.flatMap((targetId) => {
        const normalizedTargetId = String(targetId);
        const targetEntry = entryByTaskId.get(normalizedTargetId);
        if (!targetEntry || targetEntry === sourceEntry) return [];
        const key = `${sourceId}->${normalizedTargetId}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [{
          sourceId,
          targetId: normalizedTargetId,
          ...getDesktopCanvasConnectionPoints(sourceEntry, targetEntry),
        }];
      });
    });
  }, [currentWorkspaceTasks, selectedDayEntries]);
  useEffect(() => {
    if (!draggedTaskId || !desktopDragModeRef.current) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      syncDesktopDraggedTaskPosition(
        desktopDragPointerRef.current.x,
        desktopDragPointerRef.current.y,
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [draggedTaskId, selectedDateKey, syncDesktopDraggedTaskPosition]);

  const editingTask = editingTaskId ? tasks.find((task) => task.id === editingTaskId) || null : null;
  const notePanelTask = notePanelTaskId ? tasks.find((task) => task.id === notePanelTaskId) || null : null;
  const canSaveEdit = editText.trim().length > 0;
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const closeNotePanel = useCallback(() => {
    setNotePanelTaskId(null);
    setNotePanelCollapsed(false);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleTaskEdit = useCallback((task) => {
    closeNotePanel();
    setEditingTaskId(task.id);
    setEditText(task.text);
  }, [closeNotePanel]);

  const handleNotePanelTextChange = useCallback((taskId, nextText) => {
    const nextUpdatedAt = createUpdatedTimestamp();
    setTasks((prev) => prev.map((task) => (
      task.id === taskId
        ? normalizeTask({
          ...task,
          text: nextText,
          updatedAt: nextUpdatedAt,
        })
        : task
    )));
    setActiveGroupView((prev) => {
      if (!prev?.tasks?.some((task) => task.id === taskId)) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((task) => (
          task.id === taskId
            ? normalizeTask({
              ...task,
              text: nextText,
              updatedAt: nextUpdatedAt,
            })
            : task
        )),
      };
    });
  }, [setTasks]);

  const deleteTasksByIds = useCallback((taskIds) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) return;
    const taskIdSet = new Set(taskIds);
    setTasks((prev) => {
      const affectedGroupIds = new Set(
        prev
          .filter((item) => taskIdSet.has(item.id) && item.desktopGroupId)
          .map((item) => item.desktopGroupId),
      );
      const nextUpdatedAt = createUpdatedTimestamp();
      const remainingTasks = prev
        .filter((item) => !taskIdSet.has(item.id))
        .map((item) => (
          item.desktopGroupId && affectedGroupIds.has(item.desktopGroupId)
            ? normalizeTask({ ...item, updatedAt: nextUpdatedAt })
            : item
        ));
      return cleanupDesktopGroupMetadata(remainingTasks);
    });
    setSelectedTaskIds((current) => current.filter((taskId) => !taskIdSet.has(taskId)));
    setNotePanelTaskId((current) => (taskIdSet.has(current) ? null : current));
    setNotePanelCollapsed((current) => (taskIdSet.has(notePanelTaskId) ? false : current));
  }, [notePanelTaskId, setTasks, setSelectedTaskIds, setNotePanelTaskId, setNotePanelCollapsed]);

  const handleTaskDelete = useCallback((task) => {
    deleteTasksByIds([task.id]);
  }, [deleteTasksByIds]);

  const confirmCanvasDeletion = useCallback(() => {
    if (!pendingCanvasDeletion?.taskIds?.length) {
      setPendingCanvasDeletion(null);
      return;
    }
    deleteTasksByIds(pendingCanvasDeletion.taskIds);
    setPendingCanvasDeletion(null);
  }, [deleteTasksByIds, pendingCanvasDeletion]);

  const cancelCanvasDeletion = useCallback(() => {
    setPendingCanvasDeletion(null);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const closeEditModal = useCallback(() => {
    setEditingTaskId(null);
    setEditText('');
    setEditCopied(false);
    if (editCopyResetTimerRef.current !== null) {
      window.clearTimeout(editCopyResetTimerRef.current);
      editCopyResetTimerRef.current = null;
    }
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleEditCopy = useCallback(async () => {
    const nextText = editText.trim();
    if (!nextText) return;

    try {
      await navigator.clipboard.writeText(editText);
      setEditCopied(true);
      if (editCopyResetTimerRef.current !== null) {
        window.clearTimeout(editCopyResetTimerRef.current);
      }
      editCopyResetTimerRef.current = window.setTimeout(() => {
        setEditCopied(false);
        editCopyResetTimerRef.current = null;
      }, 1400);
    } catch (_) {
      // Ignore clipboard failures so editing is unaffected.
    }
  }, [editText]);

  useEffect(() => {
    if (editingTaskId && !editingTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      closeEditModal();
    }
  }, [closeEditModal, editingTask, editingTaskId]);

  useEffect(() => {
    if (notePanelTaskId && !notePanelTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      closeNotePanel();
    }
  }, [closeNotePanel, notePanelTask, notePanelTaskId]);

  useEffect(() => {
    if (!editingTaskId && !notePanelTaskId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (editingTaskId) {
          closeEditModal();
        }
        closeNotePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeEditModal, closeNotePanel, editingTaskId, notePanelTaskId]);

  const openTaskEditor = useCallback((task, jumpToDate = true) => {
    setProfileOpen(false);
    setPanelOpen(false);
    if (jumpToDate) {
      setSelectedDate(parseSharedSelectedDate(task.dateString) || selectedDate);
    }
    setEditingTaskId(task.id);
    setEditText(task.text || '');
  }, [selectedDate]);

  const [fullscreenImage, setFullscreenImage] = useState(null);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const openTaskUrl = useCallback((url, task) => {
    const cardType = normalizeCardType(task?.cardType);
    if (cardType === CARD_TYPES.PHOTO) {
      setFullscreenImage(url);
      return true;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }, []);

  const {
    onPrimaryAction: handleTaskPrimaryAction,
    onEditAction: handleTaskEditAction,
  } = useTaskInteraction({
    platform: 'desktop',
    openTaskEditor,
    openTaskUrl,
  });
  const updateActiveGroupMetadata = useCallback((changes) => {
    const groupId = activeGroupView?.groupId;
    if (!groupId) return;

    const nextFields = {};
    if (Object.prototype.hasOwnProperty.call(changes, 'desktopGroupName')) {
      nextFields.desktopGroupName = typeof changes.desktopGroupName === 'string'
        ? changes.desktopGroupName.trim() || null
        : null;
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'desktopGroupIcon')) {
      nextFields.desktopGroupIcon = normalizePackIcon(changes.desktopGroupIcon);
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'desktopGroupCover')) {
      nextFields.desktopGroupCover = normalizePackCover(changes.desktopGroupCover);
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'desktopGroupTags')) {
      nextFields.desktopGroupTags = normalizePackTags(changes.desktopGroupTags);
    }
    if (!Object.keys(nextFields).length) return;

    const nextUpdatedAt = createUpdatedTimestamp();
    setTasks((prev) => prev.map((task) => (
      task.desktopGroupId === groupId
        ? normalizeTask({
          ...task,
          ...nextFields,
          updatedAt: nextUpdatedAt,
        })
        : task
    )));
    setActiveGroupView((prev) => {
      if (!prev || prev.groupId !== groupId) return prev;
      const nextTasks = prev.tasks.map((task) => normalizeTask({
        ...task,
        ...nextFields,
        updatedAt: nextUpdatedAt,
      }));
      return {
        ...prev,
        title: getDesktopGroupDisplayName(nextTasks),
        tasks: nextTasks,
      };
    });
  }, [activeGroupView?.groupId, setTasks]);

  const updateCollectionGroupLabel = useCallback((groupId, nextLabel) => {
    if (!groupId) return;
    const normalizedLabel = typeof nextLabel === 'string' && nextLabel.trim()
      ? nextLabel.trim()
      : DEFAULT_DESKTOP_COLLECTION_LABEL;
    const nextUpdatedAt = createUpdatedTimestamp();
    setTasks((prev) => prev.map((task) => (
      task.desktopGroupId === groupId
        ? normalizeTask({
          ...task,
          desktopCollectionLabel: normalizedLabel,
          updatedAt: nextUpdatedAt,
        })
        : task
    )));
    setActiveGroupView((prev) => {
      if (!prev || prev.groupId !== groupId) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((task) => normalizeTask({
          ...task,
          desktopCollectionLabel: normalizedLabel,
          updatedAt: nextUpdatedAt,
        })),
      };
    });
  }, [setTasks]);

  useEffect(() => {
    const activeGroupId = activeGroupView?.groupId;
    if (!activeGroupId) return;

    const nextGroupTasks = currentWorkspaceTasks
      .filter((task) => task.desktopGroupId === activeGroupId)
      .map((task) => normalizeTask(task));

    if (!nextGroupTasks.length) {
      setActiveGroupView(null);
      return;
    }

    setActiveGroupView((prev) => {
      if (!prev || prev.groupId !== activeGroupId) return prev;
      return {
        ...prev,
        title: getDesktopGroupDisplayName(nextGroupTasks),
        tasks: nextGroupTasks,
      };
    });
  }, [activeGroupView?.groupId, currentWorkspaceTasks]);

  const draggedTask = draggedTaskId 
    ? (tasks.find((task) => task.id === draggedTaskId) 
        ? { ...tasks.find((task) => task.id === draggedTaskId), isGroupInitiator: isGroupDragActive } 
        : null)
    : null;
  const closePanel = () => {
    setInputText('');
    setAddPanelAttachments([]);
    setPanelOpen(false);
  };
  const showToast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 2200);
  };
  const openUploadedFileTask = async (task) => {
    const storageKey = task.uploadedFileStorageKey;
    const uploadedType = String(task.uploadedFileType || '').toLowerCase();

    if (uploadedType === 'image' && (task?.photoUrl || task?.photoDataUrl)) {
      setFullscreenImage(task.photoUrl || task.photoDataUrl);
      return true;
    }

    if (!storageKey) {
      return false;
    }
    
    // For non-images, open a blank window synchronously before 'await' to bypass popup blockers
    let newWin = null;
    if (uploadedType !== 'image') {
      newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.title = 'Loading...';
        newWin.document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666;">Opening file...</div>';
      }
    }

    try {
      const record = await getUploadedFileRecord(storageKey);
      if (!record?.blob) {
        if (newWin) newWin.close();
        showToast('File is no longer available on this device');
        return true;
      }

      if (uploadedType === 'image') {
        const objectUrl = URL.createObjectURL(record.blob);
        setFullscreenImage(objectUrl);
      } else if (newWin) {
        const objectUrl = URL.createObjectURL(record.blob);
        newWin.location.href = objectUrl;
      } else {
        // Fallback if popup blocker aggressively blocked the synch open
        const objectUrl = URL.createObjectURL(record.blob);
        window.open(objectUrl, '_blank');
      }
      return true;
    } catch (error) {
      console.error('Failed to open uploaded file:', error);
      if (newWin) newWin.close();
      showToast('Unable to open file');
      return true;
    }
  };
  const handleCanvasFileDragEnter = (event) => {
    // Allow if it's a file drag OR if an internal task is being dragged
    if (!hasSupportedUploadFiles(event.dataTransfer) && !draggedTaskId) return;
    event.preventDefault();
    canvasFileDragDepthRef.current += 1;
    setIsCanvasFileDragActive(true);
  };
  const handleCanvasFileDragOver = (event) => {
    // Allow if it's a file drag OR if an internal task is being dragged
    if (!hasSupportedUploadFiles(event.dataTransfer) && !draggedTaskId) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    if (!isCanvasFileDragActive) {
      setIsCanvasFileDragActive(true);
    }
  };
  const handleCanvasFileDragLeave = (event) => {
    if (!hasSupportedUploadFiles(event.dataTransfer) && !draggedTaskId) return;
    event.preventDefault();
    canvasFileDragDepthRef.current = Math.max(0, canvasFileDragDepthRef.current - 1);
    if (canvasFileDragDepthRef.current === 0) {
      setIsCanvasFileDragActive(false);
    }
  };
  const importFilesToCanvas = async (files, options = {}) => {
    const selectedFiles = Array.from(files || []);
    const supportedFiles = selectedFiles.filter((file) => {
      const uploadKind = getSupportedUploadKind(file);
      if (!uploadKind) return false;
      if (options.onlyKind === 'image') return uploadKind === 'image';
      if (options.onlyKind === 'file') return uploadKind !== 'image';
      return true;
    });
    if (!supportedFiles.length) {
      showToast(options.onlyKind === 'image' ? 'No supported photos selected' : 'No supported files selected');
      return false;
    }

    const targetDateKey = options.dateKeyOverride || (selectedDateRef.current ? dateKey(selectedDateRef.current) : selectedDateKey);
    const basePosition = options.basePosition || null;

    try {
      const serializedAttachments = await Promise.all(supportedFiles.map((file) => serializeUploadAttachment(file)));
      const operationUpdatedAt = createUpdatedTimestamp();

      const fileTasks = await Promise.all(serializedAttachments.map(async (attachment, index) => {
        const storageKey = createUploadedFileStorageKey(attachment.originalFileName);
        await saveUploadedFileBlob({
          storageKey,
          blob: attachment.file,
          metadata: {
            originalFileName: attachment.originalFileName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            uploadedFileType: attachment.uploadKind,
            createdAt: operationUpdatedAt,
            updatedAt: operationUpdatedAt,
          },
        });

        const taskId = Date.now() + index + Math.floor(Math.random() * 1000);
        const isImageAttachment = attachment.uploadKind === 'image';

        return normalizeTask({
          id: taskId,
          text: attachment.title,
          title: attachment.title,
          completed: false,
          desktopWorkspaceId: activeWorkspaceId,
          timeOfDay: 'Morning',
          dateString: targetDateKey,
          updatedAt: operationUpdatedAt,
          cardType: isImageAttachment ? CARD_TYPES.PHOTO : CARD_TYPES.DOCUMENT,
          primaryUrl: null,
          source: UPLOADED_FILE_SOURCE_LABEL,
          uploadedSourceLabel: UPLOADED_FILE_SOURCE_LABEL,
          uploadedFileStorageKey: storageKey,
          uploadedFileType: attachment.uploadKind,
          uploadedOriginalFileName: attachment.originalFileName,
          uploadedMimeType: attachment.mimeType,
          uploadedFileSize: attachment.size,
          uploadedCreatedAt: attachment.createdAt,
          uploadedUpdatedAt: operationUpdatedAt,
          extractedText: null,
          redirectUrl: isImageAttachment ? (attachment.previewUrl || attachment.photoDataUrl || null) : null,
          photoUrl: isImageAttachment ? (attachment.previewUrl || attachment.photoDataUrl || null) : null,
          photoTitle: isImageAttachment ? attachment.title : null,
          photoFileName: isImageAttachment ? attachment.originalFileName : null,
          photoDataUrl: isImageAttachment ? attachment.photoDataUrl : null,
          photoWidth: isImageAttachment ? attachment.photoWidth : null,
          photoHeight: isImageAttachment ? attachment.photoHeight : null,
          desktopSlot: null,
          desktopZ: Date.now() + index,
        });
      }));

      setTasks((prev) => {
        let nextTasks = [...prev];
        fileTasks.forEach((task, index) => {
          const workspaceTasks = nextTasks.filter((item) => taskBelongsToWorkspace(item, activeWorkspaceId));
          const preferredPosition = basePosition
            ? {
              x: basePosition.x,
              y: basePosition.y + (index * (DESKTOP_CANVAS_CARD_GAP + 12)),
            }
            : getNextDesktopCanvasPosition(workspaceTasks, targetDateKey);
          const nextPosition = getDesktopCanvasResolvedPosition(
            workspaceTasks,
            targetDateKey,
            new Set([task.id]),
            preferredPosition,
          );
          nextTasks = [
            ...nextTasks,
            normalizeTask({
              ...task,
              desktopCanvasX: nextPosition.x,
              desktopCanvasY: nextPosition.y,
            }),
          ];
        });
        return nextTasks;
      });

      showToast(supportedFiles.length === 1 ? 'File added' : `${supportedFiles.length} files added`);
      return true;
    } catch (error) {
      console.error('Failed to import files:', error);
      showToast('Unable to import files');
      return false;
    }
  };
  const handleCanvasFileDrop = async (event) => {
    // We only prevent default and proceed if there are files.
    // If it's an internal task drag (draggedTaskId), we clear the overlay and let internal logic handle it.
    if (!hasSupportedUploadFiles(event.dataTransfer)) {
      if (draggedTaskId) {
        setIsCanvasFileDragActive(false);
        canvasFileDragDepthRef.current = 0;
      }
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    canvasFileDragDepthRef.current = 0;
    setIsCanvasFileDragActive(false);

    const droppedDateKey = selectedDateRef.current ? dateKey(selectedDateRef.current) : selectedDateKey;
    const dropCenter = getCanvasPointFromClient(event.clientX, event.clientY);
    const dropBasePosition = dropCenter
      ? { x: dropCenter.x - DESKTOP_CANVAS_CARD_WIDTH / 2, y: dropCenter.y - DESKTOP_PHOTO_CARD_HEIGHT / 2 }
      : null;

    await importFilesToCanvas(event.dataTransfer?.files, {
      dateKeyOverride: droppedDateKey,
      basePosition: dropBasePosition,
    });
  };
  const applyAsyncMetadata = (taskId, cardType, videoUrl, mapUrl, primaryUrl, updatedAt = null) => {
    if (cardType === 'video' && videoUrl) {
      fetchVideoMeta(videoUrl).then((meta) => {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? normalizeTask({ ...task, ...meta, ...(updatedAt ? { updatedAt } : {}) }) : task)));
      });
    } else if (cardType === 'place' && mapUrl) {
      fetchMapMeta(mapUrl).then((meta) => {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? normalizeTask({ ...task, ...meta, ...(updatedAt ? { updatedAt } : {}) }) : task)));
      });
    } else if ((cardType === 'music' || cardType === 'podcast') && primaryUrl) {
      fetchSpotifyMeta(primaryUrl).then((meta) => {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? normalizeTask({ ...task, ...meta, ...(updatedAt ? { updatedAt } : {}) }) : task)));
      });
    } else if (primaryUrl && (!cardType || cardType === 'link' || cardType === 'text' || cardType === 'ai_tool' || cardType === 'social' || cardType === 'shopping' || cardType === 'financial' || cardType === 'document')) {
      fetchLinkPreviewMeta(primaryUrl).then((meta) => {
        if (meta) {
          setTasks((prev) => prev.map((task) => (task.id === taskId ? normalizeTask({ ...task, ...meta, ...(updatedAt ? { updatedAt } : {}) }) : task)));
        }
      });
    }
  };
  const createCanvasTextTask = useCallback((rawText, options = {}) => {
    const text = String(rawText || '').trim();
    if (!text) return false;

    const typeFields = getDerivedTaskFields(text);
    const taskId = options.taskId || Date.now();
    const operationUpdatedAt = createUpdatedTimestamp();
    const targetDateKey = options.dateKey || selectedDateKey;
    const resolvedTimeOfDay = todaySelected ? sectionIdToMobileId(currentBlock) : 'Morning';

    setTasks((prev) => {
      const workspaceTasks = prev.filter((task) => taskBelongsToWorkspace(task, activeWorkspaceId));
      const nextPosition = options.position || getNextDesktopCanvasPosition(workspaceTasks, targetDateKey);
      const desktopSlot = getFirstAvailableDesktopSlot(workspaceTasks, targetDateKey, resolvedTimeOfDay);
      return [
        ...prev,
        normalizeTask({
          id: taskId,
          text,
          completed: false,
          desktopWorkspaceId: activeWorkspaceId,
          timeOfDay: resolvedTimeOfDay,
          dateString: targetDateKey,
          updatedAt: operationUpdatedAt,
          ...typeFields,
          ...(options.taskOverrides || {}),
          desktopSlot,
          desktopZ: Date.now(),
          desktopCanvasX: nextPosition.x,
          desktopCanvasY: nextPosition.y,
        }),
      ];
    });

    if (!options.skipAsyncMetadata) {
      applyAsyncMetadata(taskId, typeFields.cardType, typeFields.videoUrl, typeFields.mapUrl, typeFields.primaryUrl, operationUpdatedAt);
    }
    return true;
  }, [activeWorkspaceId, currentBlock, selectedDateKey, setTasks, todaySelected]);

  const quickAddDetectedLinks = useMemo(
    () => (quickLinkPreviews.length > 0 ? quickLinkPreviews : createQuickLinkPreviews(quickAddText)),
    [quickAddText, quickLinkPreviews],
  );
  const quickAddResourcesModalOpen = Boolean(
    quickAddReviewOpen
    && (quickAddAttachments.length > 0 || quickAddDetectedLinks.length > 0),
  );

  const submitQuickAdd = useCallback(async () => {
    const linkPreviews = createQuickLinkPreviews(quickAddText);
    if (quickAddAttachments.length > 0 || linkPreviews.length > 0) {
      if (linkPreviews.length > 0) {
        setQuickLinkPreviews(linkPreviews);
        linkPreviews.forEach((linkPreview) => {
          fetchYouTubeQuickLinkPreview(linkPreview.url).then((youtubePreview) => {
          if (!youtubePreview) return;
            setQuickLinkPreviews((current) => current.map((preview) => (
              preview.url === linkPreview.url
                ? { ...preview, ...youtubePreview }
                : preview
            )));
          });
        });
      }
      setQuickAddReviewOpen(true);
      setQuickAddMenuOpen(false);
      return;
    }

    const didCreate = createCanvasTextTask(quickAddText);
    if (!didCreate) return;
    setQuickAddText('');
    showToast('Added to canvas');
  }, [createCanvasTextTask, quickAddAttachments.length, quickAddText]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const closeQuickAddResourcesModal = useCallback(() => {
    setQuickAddReviewOpen(false);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const removeQuickAddLink = useCallback((url) => {
    setQuickLinkPreviews((current) => current.filter((preview) => preview.url !== url));
    setQuickAddText((current) => removeQuickAddUrlFromText(current, url));
  }, []);

  const submitQuickAddResources = useCallback(async () => {
    const linkPreviews = quickAddDetectedLinks;
    const attachmentCount = quickAddAttachments.length;
    let createdLinkCount = 0;
    let didImportFiles = false;

    linkPreviews.forEach((linkPreview) => {
      const title = String(linkPreview.customTitle || '').trim() || linkPreview.title || linkPreview.domain;
      const didCreate = createCanvasTextTask(linkPreview.url, {
        skipAsyncMetadata: true,
        taskOverrides: {
          cardType: CARD_TYPES.LINK,
          primaryUrl: linkPreview.url,
          redirectUrl: linkPreview.url,
          linkTitle: title,
          linkDescription: linkPreview.description,
          linkImage: linkPreview.thumbnailUrl || linkPreview.visual,
        },
      });
      if (didCreate) createdLinkCount += 1;
    });

    if (attachmentCount > 0) {
      didImportFiles = await importFilesToCanvas(quickAddAttachments.map((attachment) => attachment.file));
    }

    if (createdLinkCount === 0 && !didImportFiles) return;

    const addedCount = attachmentCount + createdLinkCount;
    setQuickAddText('');
    setQuickAddAttachments([]);
    setQuickLinkPreviews([]);
    setQuickAddReviewOpen(false);
    showToast(addedCount === 1 ? 'Added to canvas' : `${addedCount} items added to canvas`);
  }, [createCanvasTextTask, importFilesToCanvas, quickAddAttachments, quickAddDetectedLinks]);

  const handleQuickAddFileSelection = async (event, onlyKind) => {
    const selectedFiles = Array.from(event.target.files || []).filter((file) => {
      const uploadKind = getSupportedUploadKind(file);
      if (!uploadKind) return false;
      if (onlyKind === 'image') return uploadKind === 'image';
      if (onlyKind === 'file') return uploadKind !== 'image';
      return true;
    });
    event.target.value = '';
    if (!selectedFiles.length) {
      showToast(onlyKind === 'image' ? 'No supported photos selected' : 'No supported files selected');
      return;
    }

    try {
      const attachments = await Promise.all(selectedFiles.map((file) => serializeUploadAttachment(file)));
      setQuickAddAttachments((current) => [...current, ...attachments]);
      setQuickAddReviewOpen(false);
      setQuickAddMenuOpen(false);
    } catch (error) {
      console.error('Failed to prepare quick add attachment:', error);
      showToast('Unable to prepare file');
    }
  };

  const removeQuickAddAttachment = (attachmentId) => {
    setQuickAddAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  };

  const openQuickNotePanel = () => {
    setQuickAddMenuOpen(false);
    setPanelOpen(false);
    setNotePanelTaskId(null);
    setNotePanelCollapsed(false);
    setQuickNoteTitle('');
    setQuickNoteBody('');
    setQuickNoteOpen(true);
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const closeQuickNotePanel = useCallback(() => {
    setQuickNoteOpen(false);
  }, []);

  const submitQuickNote = useCallback(() => {
    const draftTitle = quickNoteTitle.trim();
    const body = quickNoteBody.trim();
    if (!draftTitle && !body) return;

    const title = draftTitle || 'Untitled note';
    const didCreate = createCanvasTextTask(composeDesktopNoteText(title, body), {
      taskOverrides: {
        cardType: CARD_TYPES.TEXT,
      },
    });
    if (!didCreate) return;

    setQuickNoteTitle('');
    setQuickNoteBody('');
    setQuickNoteOpen(false);
    showToast('Note added to canvas');
  }, [createCanvasTextTask, quickNoteBody, quickNoteTitle]);

  useEffect(() => {
    if (!quickNoteOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeQuickNotePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeQuickNotePanel, quickNoteOpen]);

  const handleAddPanelFilesSelected = async (files) => {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);
    const supportedFiles = selectedFiles.filter((file) => isSupportedUploadFile(file));
    const rejectedCount = selectedFiles.length - supportedFiles.length;

    if (rejectedCount > 0) {
      showToast(rejectedCount === 1 ? 'Unsupported file skipped' : `${rejectedCount} unsupported files skipped`);
    }
    if (!supportedFiles.length) return;

    try {
      const serializedAttachments = await Promise.all(supportedFiles.map((file) => serializeUploadAttachment(file)));
      setAddPanelAttachments((current) => [...current, ...serializedAttachments]);
      showToast(serializedAttachments.length === 1 ? 'File attached' : `${serializedAttachments.length} files attached`);
    } catch (error) {
      console.error('Failed to attach files to add panel:', error);
      showToast('Unable to attach files');
    }
  };
  const handleRemoveAddPanelAttachment = (attachmentId) => {
    setAddPanelAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  };
  const saveTask = async () => {
    const rawText = inputText.trim();
    if (!rawText && addPanelAttachments.length === 0) return;

    const resolvedTimeOfDay = todaySelected ? sectionIdToMobileId(currentBlock) : 'Morning';
    const typeFields = rawText ? getDerivedTaskFields(rawText) : null;
    const taskId = Date.now();
    const operationUpdatedAt = createUpdatedTimestamp();
    let preparedAttachments = [];

    if (addPanelAttachments.length) {
      try {
        preparedAttachments = await Promise.all(addPanelAttachments.map(async (attachment) => {
          const storageKey = createUploadedFileStorageKey(attachment.originalFileName || attachment.title);
          await saveUploadedFileBlob({
            storageKey,
            blob: attachment.file,
            metadata: {
              originalFileName: attachment.originalFileName,
              mimeType: attachment.mimeType,
              size: attachment.size,
              uploadedFileType: attachment.uploadKind,
              createdAt: attachment.createdAt,
              updatedAt: operationUpdatedAt,
            },
          });
          return {
            ...attachment,
            storageKey,
          };
        }));
      } catch (error) {
        console.error('Failed to store uploaded files:', error);
        showToast('Unable to save files');
        return;
      }
    }

    setTasks((prev) => {
      let nextTasks = [...prev];

      if (rawText && typeFields) {
        const nextTask = normalizeTask({
          id: taskId,
          text: rawText,
          completed: false,
          desktopWorkspaceId: activeWorkspaceId,
          timeOfDay: resolvedTimeOfDay,
          dateString: selectedDateKey,
          updatedAt: operationUpdatedAt,
          ...typeFields,
          desktopSlot: null,
          desktopZ: Date.now(),
        });
        const workspaceTasks = nextTasks.filter((task) => taskBelongsToWorkspace(task, activeWorkspaceId));
        const nextPosition = getNextDesktopCanvasPosition(workspaceTasks, selectedDateKey);
        const desktopSlot = getFirstAvailableDesktopSlot(workspaceTasks, selectedDateKey, nextTask.timeOfDay);
        nextTasks = [...nextTasks, normalizeTask({
          ...nextTask,
          desktopSlot,
          desktopCanvasX: nextPosition.x,
          desktopCanvasY: nextPosition.y,
        })];
      }

      preparedAttachments.forEach((attachment, index) => {
        const attachmentTaskId = taskId + index + 1;
        const isImageAttachment = attachment.uploadKind === 'image';
        const attachmentTask = normalizeTask({
          id: attachmentTaskId,
          text: attachment.title,
          title: attachment.title,
          completed: false,
          desktopWorkspaceId: activeWorkspaceId,
          timeOfDay: 'Morning',
          dateString: selectedDateKey,
          updatedAt: operationUpdatedAt,
          cardType: isImageAttachment ? CARD_TYPES.PHOTO : CARD_TYPES.DOCUMENT,
          primaryUrl: null,
          source: UPLOADED_FILE_SOURCE_LABEL,
          uploadedSourceLabel: UPLOADED_FILE_SOURCE_LABEL,
          uploadedFileStorageKey: attachment.storageKey,
          uploadedFileType: attachment.uploadKind,
          uploadedOriginalFileName: attachment.originalFileName,
          uploadedMimeType: attachment.mimeType,
          uploadedFileSize: attachment.size,
          uploadedCreatedAt: attachment.createdAt,
          uploadedUpdatedAt: operationUpdatedAt,
          extractedText: null,
          redirectUrl: isImageAttachment ? (attachment.previewUrl || attachment.photoDataUrl || null) : null,
          photoUrl: isImageAttachment ? (attachment.previewUrl || attachment.photoDataUrl || null) : null,
          photoTitle: isImageAttachment ? attachment.title : null,
          photoFileName: isImageAttachment ? attachment.originalFileName : null,
          photoDataUrl: isImageAttachment ? attachment.photoDataUrl : null,
          photoWidth: isImageAttachment ? attachment.photoWidth : null,
          photoHeight: isImageAttachment ? attachment.photoHeight : null,
          desktopSlot: null,
          desktopZ: Date.now() + index + 1,
        });
        const workspaceTasks = nextTasks.filter((task) => taskBelongsToWorkspace(task, activeWorkspaceId));
        const nextPosition = getNextDesktopCanvasPosition(workspaceTasks, selectedDateKey);
        nextTasks = [...nextTasks, normalizeTask({
          ...attachmentTask,
          desktopCanvasX: nextPosition.x,
          desktopCanvasY: nextPosition.y,
        })];
      });

      return nextTasks;
    });

    setInputText('');
    setAddPanelAttachments([]);
    setPanelOpen(false);
    if (rawText && typeFields) {
      applyAsyncMetadata(taskId, typeFields.cardType, typeFields.videoUrl, typeFields.mapUrl, typeFields.primaryUrl, operationUpdatedAt);
    }
  };
  const handleEditSave = () => {
    const rawText = editText.trim();
    if (!editingTask || !rawText) return;

    const typeFields = getDerivedTaskFields(rawText);
    const operationUpdatedAt = createUpdatedTimestamp();
    setTasks((prev) => prev.map((task) => (
      task.id === editingTask.id
        ? normalizeTask({ ...task, text: rawText, updatedAt: operationUpdatedAt, ...typeFields })
        : task
    )));
    applyAsyncMetadata(editingTask.id, typeFields.cardType, typeFields.videoUrl, typeFields.mapUrl, typeFields.primaryUrl, operationUpdatedAt);
    closeEditModal();
  };
  const updateCanvasSelection = (taskIds, event, openAction) => {
    const normalizedTaskIds = [...new Set(taskIds)];
    if (!normalizedTaskIds.length) return;

    if (event?.metaKey || event?.ctrlKey) {
      event.preventDefault?.();
      event.stopPropagation?.();
      setSelectedTaskIds((current) => {
        const currentSet = new Set(current);
        const isFullySelected = normalizedTaskIds.every((taskId) => currentSet.has(taskId));
        normalizedTaskIds.forEach((taskId) => {
          if (isFullySelected) currentSet.delete(taskId);
          else currentSet.add(taskId);
        });
        return [...currentSet];
      });
      return;
    }

    if (areTaskIdSelectionsEqual(selectedTaskIdsRef.current, normalizedTaskIds)) {
      openAction?.();
      return;
    }

    setSelectedTaskIds(normalizedTaskIds);

    // For a single loose task, keep canvas selection visible but still open it on first click.
    if (normalizedTaskIds.length === 1) {
      openAction?.();
    }
  };

  const handleTaskClick = (task, event) => {
    const openTaskFromCanvas = () => {
      if (Date.now() < suppressAllTaskClicksUntilRef.current) {
        return;
      }
      if (suppressTaskClickRef.current === task.id) {
        suppressTaskClickRef.current = null;
        return;
      }

      const { redirectUrl } = getTaskCardPresentation(task, t);
      const cardType = normalizeCardType(task.cardType);

      if (task.uploadedFileStorageKey) {
        void openUploadedFileTask(task);
        return;
      }

      if (cardType === CARD_TYPES.TEXT) {
        setPanelOpen(false);
        setProfileOpen(false);
        setNotePanelTaskId(task.id);
        setNotePanelCollapsed(false);
        return;
      }

      if (redirectUrl) {
        if (cardType === CARD_TYPES.PHOTO) {
          setFullscreenImage(task.photoUrl || task.photoDataUrl || redirectUrl);
          return;
        }
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      openTaskEditor(task);
    };

    if (!event) {
      openTaskFromCanvas();
      return;
    }

    updateCanvasSelection([task.id], event, openTaskFromCanvas);
  };
  const closePendingGroupPrompt = () => {
    setPendingGroupPrompt(null);
    setPendingGroupName('');
  };
  const closeActiveGroupView = () => {
    setActiveGroupView(null);
  };
  const getGroupCardOriginRect = (groupTasks, event = null) => {
    const leadTask = groupTasks?.[0];
    const triggerNode = event?.currentTarget instanceof HTMLElement
      ? event.currentTarget.closest('.desktop-task-group-card')
      : null;
    const fallbackNode = leadTask
      ? document.getElementById(`desktop-group-card-${leadTask.id}`) || document.getElementById(`desktop-task-wrapper-${leadTask.id}`)
      : null;
    const sourceNode = triggerNode || fallbackNode;
    if (!sourceNode) return null;

    const rect = sourceNode.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  };
  const openActiveGroupView = (groupTasks, focusTaskId = null, originRect = null) => {
    if (!groupTasks?.length) return;
    const nextView = {
      groupId: groupTasks[0].desktopGroupId || `group-${groupTasks[0].id}`,
      title: getDesktopGroupDisplayName(groupTasks),
      tasks: groupTasks.map((task) => normalizeTask(task)),
      focusTaskId,
      originRect,
    };
    window.requestAnimationFrame(() => {
      setActiveGroupView(nextView);
    });
  };
  const handleGroupCardOpen = (groupTasks, event = null) => {
    if (event?.metaKey || event?.ctrlKey) {
      const groupTaskIds = groupTasks.map((task) => task.id);
      updateCanvasSelection(groupTaskIds, event, null);
      return;
    }
    if (Date.now() < suppressAllTaskClicksUntilRef.current) return;
    openActiveGroupView(groupTasks, null, getGroupCardOriginRect(groupTasks, event));
  };
  const handleHistoryPackOpen = (groupTasks) => {
    setHistoryOpen(false);
    openActiveGroupView(groupTasks);
  };
  const handleHistoryPackItemOpen = (task) => {
    if (!task?.desktopGroupId) {
      handleTaskClick(task);
      return;
    }

    const groupTasks = tasksRef.current
      .filter((currentTask) => currentTask.desktopGroupId === task.desktopGroupId)
      .map((currentTask) => normalizeTask(currentTask));

    if (!groupTasks.length) {
      handleTaskClick(task);
      return;
    }

    setHistoryOpen(false);
    openActiveGroupView(groupTasks, task.id);
  };
  const handleHistorySearchLongPress = (task) => {
    searchDragSeparateRef.current = true;
    startDesktopTaskDrag(task);
  };

  const confirmWorkspaceDeletion = () => {
    if (!pendingWorkspaceDeletion?.workspaceId || workspaces.length <= 1) {
      setPendingWorkspaceDeletion(null);
      return;
    }

    const deletedWorkspaceId = pendingWorkspaceDeletion.workspaceId;
    const remainingWorkspaces = workspaces.filter((workspace) => workspace.id !== deletedWorkspaceId);
    const fallbackWorkspaceId = remainingWorkspaces[0]?.id || DEFAULT_DESKTOP_WORKSPACE_ID;

    setWorkspaces(remainingWorkspaces);
    setTasks((prev) => prev.filter((task) => !taskBelongsToWorkspace(task, deletedWorkspaceId)));
    if (activeWorkspaceId === deletedWorkspaceId) {
      setActiveWorkspaceId(fallbackWorkspaceId);
    }
    setWorkspaceMenuOpen(false);
    setWorkspaceActionMenu(null);
    setPendingWorkspaceDeletion(null);
    clearSelection();
    setPendingCanvasDeletion(null);
    setActiveGroupView(null);
    setHistoryOpen(false);
  };
  const handleConfirmGroupPrompt = () => {
    if (!pendingGroupPrompt) return;
    const groupName = pendingGroupName.trim() || 'New group';
    const groupedTaskIds = new Set([
      ...pendingGroupPrompt.movingTaskIds,
      ...pendingGroupPrompt.targetTaskIds,
    ]);

    const nextUpdatedAt = createUpdatedTimestamp();
    setTasks((prev) => {
      const groupedTasks = prev.filter((task) => groupedTaskIds.has(task.id));
      const nextGroupTags = getDesktopGroupDisplayTags(groupedTasks);
      return prev.map((task) => (
        groupedTaskIds.has(task.id)
          ? normalizeTask({
            ...task,
            dateString: pendingGroupPrompt.targetDateKey,
            updatedAt: nextUpdatedAt,
            desktopSlot: null,
            desktopCanvasX: Number(pendingGroupPrompt.overlapX.toFixed(1)),
            desktopCanvasY: Number(pendingGroupPrompt.overlapY.toFixed(1)),
            desktopGroupId: pendingGroupPrompt.groupId,
            desktopGroupName: groupName,
            desktopGroupTags: nextGroupTags,
            desktopCollectionLabel: DEFAULT_DESKTOP_COLLECTION_LABEL,
            desktopZ: Date.now(),
          })
          : task
      ));
    });
    closePendingGroupPrompt();
  };
  const handleCancelGroupPrompt = () => {
    closePendingGroupPrompt();
  };
  const desktopAppScale = viewport.zoom || DESKTOP_APP_WINDOW_SCALE;
  return (
    <>
      <GlobalStyles appearance={appearance} />
      <div
        style={{
          width: '100vw',
          height: '100dvh',
          overflow: 'hidden',
          background: 'var(--desktop-root-bg)',
        }}
      >
        <div
          style={{
            width: `${100 / desktopAppScale}vw`,
            height: `${100 / desktopAppScale}dvh`,
            transform: `scale(${desktopAppScale})`,
            transformOrigin: 'top left',
          }}
        >
      <div className={`desktop-app ${appearance === 'dark' ? 'desktop-app-dark dark-theme' : 'desktop-app-light'}`} style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'var(--desktop-root-bg)', color: 'var(--desktop-root-text)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
        <header className="desktop-minimal-header">
          <div className="desktop-minimal-brand" ref={workspaceMenuRef}>
            <div className={`desktop-workspace-shell ${workspaceMenuOpen ? 'is-open' : ''} ${isWorkspaceNameEditing ? 'is-editing' : ''}`}>
              {isWorkspaceNameEditing ? (
                <input
                  ref={workspaceNameInputRef}
                  type="text"
                  value={workspaceNameDraft}
                  onChange={(event) => setWorkspaceNameDraft(event.target.value)}
                  onBlur={handleCommitWorkspaceRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleCommitWorkspaceRename();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      handleCancelWorkspaceRename();
                    }
                  }}
                  className="desktop-workspace-name-input"
                  aria-label="Workspace name"
                />
              ) : (
                <button
                  type="button"
                  className="desktop-workspace-name-button"
                  onClick={handleStartWorkspaceRename}
                >
                  <span className="desktop-workspace-trigger-label">{activeWorkspace?.name || t.untitledWorkspace}</span>
                </button>
              )}
              <button
                type="button"
                className="desktop-workspace-menu-button"
                onClick={() => {
                  if (isWorkspaceNameEditing) {
                    handleCommitWorkspaceRename();
                  }
                  setWorkspaceMenuOpen((current) => !current);
                }}
                aria-haspopup="menu"
                aria-expanded={workspaceMenuOpen}
              >
                <span className="desktop-workspace-trigger-chevron">
                  <WorkspaceChevronIcon open={workspaceMenuOpen} />
                </span>
              </button>
            </div>
            {workspaceMenuOpen ? (
              <div className="desktop-workspace-menu" role="menu" aria-label={t.workspaceMenu || 'Workspace menu'}>
                <div className="desktop-workspace-menu-header">My Spaces</div>
                <div className="desktop-workspace-menu-list">
                  {workspaces.map((workspace) => {
                    const isActive = workspace.id === activeWorkspace?.id;
                    const isActionsOpen = workspaceActionMenu?.workspaceId === workspace.id;
                    return (
                      <div
                        key={workspace.id}
                        className={`desktop-workspace-menu-row ${isActive ? 'is-active' : ''} ${isActionsOpen ? 'is-actions-open' : ''}`}
                      >
                        <button
                          type="button"
                          className="desktop-workspace-menu-item"
                          onClick={() => handleSelectWorkspace(workspace.id)}
                          role="menuitemradio"
                          aria-checked={isActive}
                        >
                          <span className="desktop-workspace-menu-item-label">{workspace.name}</span>
                        </button>
                        <div className="desktop-workspace-menu-item-actions">
                          <button
                            type="button"
                            className="desktop-workspace-menu-item-more"
                            onClick={(event) => handleWorkspaceActionsToggle(workspace.id, event)}
                            aria-label={`${t.workspaceActions || 'Workspace actions'} for ${workspace.name}`}
                            aria-expanded={isActionsOpen}
                          >
                            <WorkspaceMoreIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="desktop-workspace-menu-footer">
                  {!canAddWorkspace ? (
                    <div className="desktop-workspace-usage">
                      <div className="desktop-workspace-usage-row">
                        <span className="desktop-workspace-limit-label">
                          <span className="desktop-workspace-limit-icon" aria-hidden="true">ⓘ</span>
                          <span>Free plan limit reached</span>
                        </span>
                        <span className="desktop-workspace-limit-count">
                          {workspaces.length}/{MAX_DESKTOP_WORKSPACES}
                        </span>
                      </div>
                      <div className="desktop-workspace-limit-track" aria-hidden="true">
                        <span className="desktop-workspace-limit-fill" />
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="desktop-workspace-menu-add"
                    onClick={handleAddWorkspace}
                    disabled={!canAddWorkspace}
                  >
                    <WorkspacePlusIcon />
                    <span>{t.addWorkspace || 'Add workspace'}</span>
                  </button>
                </div>
              </div>
            ) : null}
            {workspaceMenuOpen && workspaceActionMenu && workspaceActionTarget ? (
              <div
                className="desktop-workspace-action-popover"
                role="menu"
                aria-label="Workspace actions"
                style={{
                  top: workspaceActionMenu.top,
                  left: workspaceActionMenu.left,
                }}
              >
                <button
                  type="button"
                  className="desktop-workspace-menu-item-delete"
                  onClick={(event) => handleWorkspaceDeleteRequest(workspaceActionTarget, event)}
                  disabled={workspaces.length <= 1}
                >
                  {t.deleteWorkspace || 'Delete workspace'}
                </button>
              </div>
            ) : null}
          </div>
          <div className="desktop-minimal-date-nav-wrap">
            <div className="desktop-minimal-date-nav" role="group" aria-label="View navigation">
            <button
              type="button"
              className={`desktop-minimal-date-nav-button ${desktopViewMode === DESKTOP_VIEW_MODES.CANVAS ? 'is-active' : ''}`}
              onClick={() => {
                setDesktopViewMode(DESKTOP_VIEW_MODES.CANVAS);
                setProfileOpen(false);
              }}
              aria-label="Show Canvas"
              aria-pressed={desktopViewMode === DESKTOP_VIEW_MODES.CANVAS}
            >
              <HeaderChevronIcon direction="left" />
            </button>
            <button
              type="button"
              className="desktop-minimal-date-nav-label"
              onClick={() => {
                setDesktopViewMode(DESKTOP_VIEW_MODES.CANVAS);
                setProfileOpen(false);
              }}
              aria-label={desktopViewMode === DESKTOP_VIEW_MODES.COLLECTION ? 'Collection View' : 'Canvas'}
            >
              {desktopViewMode === DESKTOP_VIEW_MODES.COLLECTION ? 'Collection View' : 'Canvas'}
            </button>
            <button
              type="button"
              className={`desktop-minimal-date-nav-button ${desktopViewMode === DESKTOP_VIEW_MODES.COLLECTION ? 'is-active' : ''}`}
              onClick={() => {
                setDesktopViewMode(DESKTOP_VIEW_MODES.COLLECTION);
                setProfileOpen(false);
              }}
              aria-label="Show Collection View"
              aria-pressed={desktopViewMode === DESKTOP_VIEW_MODES.COLLECTION}
            >
              <HeaderChevronIcon direction="right" />
            </button>
           </div>
          </div>
          <div className="desktop-topbar-actions">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="desktop-header-icon-button"
            >
              <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.625 16.625L13.1812 13.1812M15.0417 8.70833C15.0417 12.2061 12.2061 15.0417 8.70833 15.0417C5.21053 15.0417 2.375 12.2061 2.375 8.70833C2.375 5.21053 5.21053 2.375 8.70833 2.375C12.2061 2.375 15.0417 5.21053 15.0417 8.70833Z" stroke={appearance === 'dark' ? '#E1E1E1' : '#1E1E1E'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button type="button" className="desktop-profile-trigger desktop-header-avatar-button" onClick={() => setProfileOpen(true)}>
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={userProfile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--desktop-root-text)' }}>{userProfile.initial}</span>
              )}
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div
            className="desktop-main-stage"
            style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}
          >
            <div className="desktop-main-stage-inner" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--desktop-main-gradient)' }}>

              {desktopViewMode === DESKTOP_VIEW_MODES.COLLECTION ? (
                <CollectionViewBoard
                  tasks={currentWorkspaceTasks}
                  appearance={appearance}
                  labels={t}
                  language={language}
                  onTaskOpen={handleTaskClick}
                  onGroupOpen={handleHistoryPackOpen}
                  onGroupLabelUpdate={updateCollectionGroupLabel}
                />
              ) : (
                <main
                  ref={viewportContainerRef}
                  className={`desktop-canvas-scroll ${desktopCanvasPanReady ? 'is-pan-ready' : ''} ${desktopCanvasPanActive ? 'is-panning' : ''} ${isCanvasFileDragActive ? 'is-file-drag-active' : ''}`}
                  onWheel={handleDesktopCanvasWheel}
                  onPointerDownCapture={handleDesktopCanvasPointerDown}
                  onPointerMove={handleDesktopCanvasPointerMove}
                  onPointerUp={handleDesktopCanvasPointerEnd}
                  onPointerCancel={handleDesktopCanvasPointerEnd}
                  onDragEnter={handleCanvasFileDragEnter}
                  onDragOver={handleCanvasFileDragOver}
                  onDragLeave={handleCanvasFileDragLeave}
                  onDrop={handleCanvasFileDrop}
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'var(--desktop-root-bg)',
                    '--desktop-canvas-dot-size': `${Math.min(120, Math.max(14, Math.round(48 * viewport.zoom)))}px`,
                  }}
                >
                  <div
                    ref={desktopCanvasContentRef}
                    className="desktop-canvas-content"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: DESKTOP_MAIN_CONTENT_MAX_WIDTH,
                      transformOrigin: '0 0',
                      transform: `translate(${viewport.panX}px, ${viewport.panY}px)`,
                      paddingTop: 180,
                    }}
                  >
                    <DailyTaskList
                      entries={selectedDayEntries}
                      canvasHeight={selectedDayCanvasHeight}
                      appearance={appearance}
                      labels={t}
                      connectionLinks={selectedDayConnectionLinks}
                      connectionDraft={desktopConnectionDraft}
                      selectedConnectionKey={selectedDesktopConnectionKey}
                      onTaskClick={handleTaskClick}
                      onGroupOpenFullView={handleGroupCardOpen}
                      onTaskEdit={handleTaskEdit}
                      onTaskDelete={handleTaskDelete}
                      onTaskPointerDown={handleTaskPointerDown}
                      onTaskPointerMove={handleTaskPointerMove}
                      onTaskPointerUp={handleTaskPointerUp}
                      onTaskPointerCancel={handleTaskPointerCancel}
                      onConnectionPointerDown={handleDesktopConnectionPointerDown}
                      onConnectionMouseDown={handleDesktopConnectionMouseDown}
                      onConnectionPointerMove={handleDesktopConnectionPointerMove}
                      onConnectionPointerUp={handleDesktopConnectionPointerEnd}
                      onConnectionPointerCancel={handleDesktopConnectionPointerEnd}
                      onConnectionSelect={setSelectedDesktopConnectionKey}
                      onConnectionDelete={deleteDesktopConnection}
                      draggedTaskId={draggedTaskId}
                      selectedTaskIds={selectedTaskIds}
                      selectionRect={desktopSelectionRect}
                      dragOverlapTargetId={desktopDragOverlapTargetId}
                      layoutWidth={DESKTOP_MAIN_CONTENT_MAX_WIDTH}
                      getConnectionPath={getDesktopCanvasConnectionPath}
                      getConnectionMidpoint={getDesktopCanvasConnectionMidpoint}
                    />
                  {desktopDragOverlayActive && desktopDragOverlaySnapshot ? (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 9999,
                      }}
                    >
                      <div
                        ref={desktopDragOverlayNodeRef}
                        className="desktop-canvas-card-node"
                        style={{
                          left: desktopDragOverlaySnapshot.baseX,
                          top: desktopDragOverlaySnapshot.baseY,
                          width: DESKTOP_CANVAS_CARD_WIDTH,
                        }}
                      >
                        <div className="desktop-canvas-card-shell is-dragging">
                          {desktopDragOverlaySnapshot.type === 'group' && Array.isArray(desktopDragOverlaySnapshot.tasks) ? (
                            <GroupedTaskCard
                              tasks={desktopDragOverlaySnapshot.tasks}
                              appearance={appearance}
                              labels={t}
                              isDragging={true}
                              isGroupDragActive={true}
                              isSelected={false}
                              isGroupReady={false}
                              draggedTaskId={desktopDragOverlaySnapshot.taskId}
                              onOpenItem={null}
                              onOpenFullView={null}
                              onPointerDown={null}
                              onPointerMove={null}
                              onPointerUp={null}
                              onPointerCancel={null}
                            />
                          ) : desktopDragOverlaySnapshot.type === 'task' && desktopDragOverlaySnapshot.task ? (
                            <TaskCard
                              task={desktopDragOverlaySnapshot.task}
                              appearance={appearance}
                              labels={t}
                              isDragging={true}
                              isSelected={false}
                              isGroupReady={false}
                              draggedTaskId={desktopDragOverlaySnapshot.taskId}
                              onClick={null}
                              onEdit={null}
                              onDelete={null}
                              onPointerDown={null}
                              onPointerMove={null}
                              onPointerUp={null}
                              onPointerCancel={null}
                              editLabel={t.edit}
                              deleteLabel={t.delete}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {isCanvasFileDragActive ? (
                    <div className="desktop-canvas-file-drop-indicator">
                      <span>{draggedTaskId ? 'Drop to place task' : 'Drop file to create card'}</span>
                    </div>
                  ) : null}
                  </div>
                </main>
              )}
            </div>
          </div>
        </div>


        {panelOpen ? <div style={{ position: 'fixed', inset: 0, zIndex: 25 }} onClick={closePanel} /> : null}
        <AddPanel
          open={panelOpen}
          language={language}
          inputText={inputText}
          setInputText={setInputText}
          fileAttachments={addPanelAttachments}
          onAddFiles={handleAddPanelFilesSelected}
          onRemoveFile={handleRemoveAddPanelAttachment}
          onShowToast={showToast}
          onClose={closePanel}
          onSubmit={saveTask}
        />

        {quickAddResourcesModalOpen ? (
          <DesktopAddResourcesModal
            attachments={quickAddAttachments}
            linkPreviews={quickAddDetectedLinks}
            onClose={closeQuickAddResourcesModal}
            onRemoveAttachment={removeQuickAddAttachment}
            onRemoveLink={removeQuickAddLink}
            onSubmit={submitQuickAddResources}
          />
        ) : null}

        {!panelOpen
          && desktopViewMode === DESKTOP_VIEW_MODES.CANVAS
          && !quickAddResourcesModalOpen ? (
          <form
            ref={quickAddMenuRef}
            className={`desktop-canvas-quick-add ${quickAddAttachments.length > 0 ? 'has-attachments' : ''}`}
            onSubmit={(event) => {
              event.preventDefault();
              submitQuickAdd();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            style={{ transform: `translateX(-50%) scale(${DESKTOP_FIXED_UI_SCALE / desktopAppScale})` }}
          >
            {quickAddAttachments.length > 0 ? (
              <div className="desktop-canvas-quick-add-attachments">
                {quickAddAttachments.map((attachment) => (
                  attachment.uploadKind === 'image' ? (
                    <article key={attachment.id} className="desktop-canvas-quick-add-photo-preview">
                      <img src={attachment.previewUrl || attachment.photoDataUrl} alt={attachment.title || 'Photo preview'} />
                      <button
                        type="button"
                        className="desktop-canvas-quick-add-attachment-remove"
                        aria-label={`Remove ${attachment.originalFileName}`}
                        onClick={() => removeQuickAddAttachment(attachment.id)}
                      >
                        &times;
                      </button>
                    </article>
                  ) : (
                    <article key={attachment.id} className="desktop-canvas-quick-add-file-preview">
                      <span className="desktop-canvas-quick-add-file-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M7 3.75h6.8L18 8v12.25H7a1.5 1.5 0 0 1-1.5-1.5V5.25A1.5 1.5 0 0 1 7 3.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          <path d="M13.5 4v4.5H18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="desktop-canvas-quick-add-file-copy">
                        <strong>{attachment.originalFileName}</strong>
                        <span>{attachment.uploadKind === 'pdf' ? 'PDF' : 'Document'}</span>
                      </span>
                      <button
                        type="button"
                        className="desktop-canvas-quick-add-attachment-remove"
                        aria-label={`Remove ${attachment.originalFileName}`}
                        onClick={() => removeQuickAddAttachment(attachment.id)}
                      >
                        &times;
                      </button>
                    </article>
                  )
                ))}
              </div>
            ) : null}
            <div className="desktop-canvas-quick-add-menu-anchor">
              <button
                type="button"
                className="desktop-canvas-quick-add-plus"
                aria-label="Open add menu"
                aria-expanded={quickAddMenuOpen}
                onClick={() => setQuickAddMenuOpen((current) => !current)}
              >
                <svg
                  className="desktop-canvas-quick-add-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <input
                ref={quickAddFileInputRef}
                className="desktop-canvas-quick-add-file-input"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={(event) => handleQuickAddFileSelection(event, 'file')}
              />
              <input
                ref={quickAddPhotoInputRef}
                className="desktop-canvas-quick-add-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleQuickAddFileSelection(event, 'image')}
              />
              {quickAddMenuOpen ? (
                <div className="desktop-canvas-quick-add-menu" role="menu" aria-label="Quick add menu">
                  <button
                    type="button"
                    className="desktop-canvas-quick-add-menu-item"
                    role="menuitem"
                    onClick={() => quickAddFileInputRef.current?.click()}
                  >
                    <span className="desktop-canvas-quick-add-menu-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M7 7.5v8.25a5 5 0 0 0 10 0V6.75a3.25 3.25 0 0 0-6.5 0v8.75a1.5 1.5 0 0 0 3 0V8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>Upload file</span>
                  </button>
                  <button
                    type="button"
                    className="desktop-canvas-quick-add-menu-item"
                    role="menuitem"
                    onClick={() => quickAddPhotoInputRef.current?.click()}
                  >
                    <span className="desktop-canvas-quick-add-menu-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M5.5 6.5h13a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="m6.5 15 3.2-3.2 2.6 2.6 1.8-1.8L18 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16.2 9.5h.01" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span>Upload photo</span>
                  </button>
                  <button
                    type="button"
                    className="desktop-canvas-quick-add-menu-item"
                    role="menuitem"
                    onClick={openQuickNotePanel}
                  >
                    <span className="desktop-canvas-quick-add-menu-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M7 4.75h7.2L18 8.55v10.7H7a1 1 0 0 1-1-1V5.75a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 5v4h4M9 12h6M9 15h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>Quick Note</span>
                  </button>
                </div>
              ) : null}
            </div>
            <textarea
              ref={quickAddTextareaRef}
              className="desktop-canvas-quick-add-input"
              value={quickAddText}
              rows={1}
              placeholder="Paste a link, note, or file..."
              onChange={(event) => {
                setQuickAddText(event.target.value);
                setQuickLinkPreviews([]);
                setQuickAddReviewOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitQuickAdd();
                }
              }}
            />
            <button
              type="submit"
              className="desktop-canvas-quick-add-submit"
              aria-label="Add to canvas"
              disabled={!quickAddText.trim() && quickAddAttachments.length === 0}
            >
              <svg
                className="desktop-canvas-quick-add-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </button>
          </form>
        ) : null}

        {!panelOpen && desktopViewMode === DESKTOP_VIEW_MODES.CANVAS ? (
          <div
            className="desktop-canvas-zoom-toolbar"
            aria-label="Canvas zoom controls"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            style={{ transform: `scale(${DESKTOP_FIXED_UI_SCALE / desktopAppScale})` }}
          >
            <span className="desktop-canvas-zoom-toolbar-icon" aria-hidden="true">
              <CanvasControlSlidersIcon />
            </span>
            <button
              type="button"
              className={`desktop-canvas-zoom-percent ${desktopZoomMenuOpen ? 'is-open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={desktopZoomMenuOpen}
              onClick={() => setDesktopZoomMenuOpen((current) => !current)}
            >
              {Math.round(viewport.zoom * 100)}%
            </button>
            <button
              type="button"
              className="desktop-canvas-zoom-toolbar-button"
              aria-label="Zoom in"
              onClick={() => handleDesktopZoomPresetSelect('in')}
            >
              +
            </button>
            <button
              type="button"
              className="desktop-canvas-zoom-toolbar-button"
              aria-label="Zoom out"
              onClick={() => handleDesktopZoomPresetSelect('out')}
            >
              -
            </button>
            {desktopZoomMenuOpen ? (
              <div className="desktop-canvas-zoom-dropdown" role="menu" aria-label="Zoom presets">
                {[
                  { label: '25%', value: 0.25 },
                  { label: '50%', value: 0.5 },
                  { label: '75%', value: 0.75 },
                  { label: '100%', value: 1 },
                  { label: '125%', value: 1.25 },
                  { label: '150%', value: 1.5 },
                  { label: '200%', value: 2 },
                  { label: 'Fit Canvas', value: 'fit' },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    role="menuitem"
                    className="desktop-canvas-zoom-dropdown-item"
                    onClick={() => handleDesktopZoomPresetSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {editingTask ? (
          <div
            role="presentation"
            onClick={closeEditModal}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              background: 'var(--desktop-modal-backdrop)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="desktop-edit-modal-title"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: 'min(100%, 560px)',
                maxHeight: 'min(640px, calc(100vh - 56px))',
                background: 'var(--desktop-edit-bg)',
                border: '1px solid var(--desktop-edit-border)',
                borderRadius: 24,
                boxShadow: 'var(--desktop-edit-shadow)',
                display: 'grid',
                gridTemplateRows: 'auto minmax(0, 1fr) auto',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '22px 24px 16px', borderBottom: '1px solid var(--desktop-edit-border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <IntoDayLogo
                    showWordmark={false}
                    className="desktop-edit-modal-logo"
                    iconClassName="desktop-edit-modal-logo-icon"
                  />
                  <h2 id="desktop-edit-modal-title" style={{ margin: 0, fontFamily: 'DM Serif Display, serif', fontSize: 28, fontStyle: 'italic', lineHeight: 1, color: 'var(--desktop-root-text)' }}>
                    {t.editTaskTitle}
                  </h2>
                </div>
                <button type="button" onClick={closeEditModal} aria-label={t.close} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--desktop-modal-close-bg)', border: '1px solid var(--desktop-edit-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, color: 'var(--desktop-modal-close-text)' }}>
                  <CloseIcon />
                </button>
              </div>
              <div style={{ minHeight: 0, padding: 24 }}>
                <div style={{ position: 'relative', height: '100%' }}>
                  {normalizeCardType(editingTask.cardType) === CARD_TYPES.PHOTO && editingTask.photoDataUrl ? (
                    <div
                      style={{
                        marginBottom: 14,
                        borderRadius: 18,
                        overflow: 'hidden',
                        border: '1px solid var(--desktop-edit-input-border)',
                        background: 'rgba(255,255,255,0.66)',
                      }}
                    >
                        <img
                          src={editingTask.photoDataUrl}
                          alt={editingTask.photoTitle || editingTask.text || 'Photo'}
                          draggable={false}
                          onDragStart={(event) => event.preventDefault()}
                          style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'cover' }}
                        />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleEditCopy}
                    disabled={!editText.trim()}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                      minWidth: 72,
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 999,
                      border: '1px solid var(--desktop-edit-border)',
                      background: 'var(--desktop-modal-close-bg)',
                      color: 'var(--desktop-root-text)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: editText.trim() ? 'pointer' : 'not-allowed',
                      opacity: editText.trim() ? 1 : 0.45,
                    }}
                  >
                    {editCopied ? 'Copied' : 'Copy'}
                  </button>
                  <textarea
                    value={editText}
                    onChange={(event) => setEditText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        handleEditSave();
                      }
                    }}
                    autoFocus
                    rows={10}
                    placeholder={t.editTaskPlaceholder}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: normalizeCardType(editingTask.cardType) === CARD_TYPES.PHOTO ? 180 : 280,
                      border: '1px solid var(--desktop-edit-input-border)',
                      background: 'var(--desktop-edit-input-bg)',
                      borderRadius: 18,
                      padding: '52px 18px 18px',
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: 'var(--desktop-root-text)',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px 24px', borderTop: '1px solid var(--desktop-edit-border)' }}>
                <button type="button" onClick={closeEditModal} style={{ minWidth: 96, height: 44, padding: '0 18px', borderRadius: 14, border: '1px solid var(--desktop-cancel-border)', background: 'var(--desktop-cancel-bg)', color: 'var(--desktop-cancel-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  {t.cancel}
                </button>
                <button type="button" onClick={handleEditSave} disabled={!canSaveEdit} style={{ minWidth: 136, height: 44, padding: '0 20px', background: canSaveEdit ? 'var(--desktop-save-bg)' : 'var(--desktop-save-disabled-bg)', color: canSaveEdit ? 'var(--desktop-save-text)' : 'var(--desktop-save-disabled-text)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: canSaveEdit ? 'pointer' : 'not-allowed' }}>
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <DesktopNoteSidePanel
          task={notePanelTask}
          labels={t}
          collapsed={notePanelCollapsed}
          onClose={closeNotePanel}
          onCollapse={() => setNotePanelCollapsed(true)}
          onExpand={() => setNotePanelCollapsed(false)}
          onTextChange={handleNotePanelTextChange}
          onEdit={(task) => handleTaskEdit(task)}
        />

        <DesktopQuickNoteSidePanel
          open={quickNoteOpen}
          title={quickNoteTitle}
          body={quickNoteBody}
          labels={t}
          onTitleChange={setQuickNoteTitle}
          onBodyChange={setQuickNoteBody}
          onClose={closeQuickNotePanel}
          onSubmit={submitQuickNote}
        />

        <DesktopProfilePage
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          language={language}
          setLanguage={setLanguage}
          appearance={appearance}
          appearancePreference={appearancePreference}
          setAppearance={setAppearancePreference}
        />
        <DesktopHistoryModal
          open={historyOpen}
          tasks={currentWorkspaceTasks}
          appearance={appearance}
          language={language}
          t={t}
          onClose={() => setHistoryOpen(false)}
          onTaskClick={(task) => {
            if (!task.id) return;
            const { redirectUrl } = getTaskCardPresentation(task, t);
            if (task.uploadedFileStorageKey) {
              setHistoryOpen(false);
              void openUploadedFileTask(task);
              return;
            }
            if (redirectUrl) {
              if (normalizeCardType(task.cardType) === CARD_TYPES.PHOTO) {
                setFullscreenImage(task.photoUrl || task.photoDataUrl || redirectUrl);
                return;
              }
              window.open(redirectUrl, '_blank', 'noopener,noreferrer');
              return;
            }
            setHistoryOpen(false);
            openTaskEditor(task, false);
          }}
          onPackClick={handleHistoryPackOpen}
          onPackItemClick={handleHistoryPackItemOpen}
          onTaskPointerDown={handleTaskPointerDown}
          onTaskLongPress={handleHistorySearchLongPress}
        />

        <DesktopGroupPrompt
          prompt={pendingGroupPrompt}
          groupName={pendingGroupName}
          setGroupName={setPendingGroupName}
          onConfirm={handleConfirmGroupPrompt}
          onCancel={handleCancelGroupPrompt}
        />
        <DesktopGroupFullViewModal
          view={activeGroupView}
          appearance={appearance}
          labels={t}
          language={language}
          onClose={closeActiveGroupView}
          onTaskEdit={(task) => {
            closeActiveGroupView();
            handleTaskEdit(task);
          }}
          onDeleteTasks={deleteTasksByIds}
          onUpdateGroup={updateActiveGroupMetadata}
          onToast={showToast}
          onTaskOpen={(task) => {
            closeActiveGroupView();
            handleTaskClick(task);
          }}
        />
        <DesktopDeleteConfirmModal
          open={Boolean(pendingCanvasDeletion)}
          title={pendingCanvasDeletion?.title || t.deleteObjectQuestion}
          onCancel={cancelCanvasDeletion}
          onConfirm={confirmCanvasDeletion}
        />
        <DesktopDeleteConfirmModal
          open={Boolean(pendingWorkspaceDeletion)}
          title={pendingWorkspaceDeletion?.workspaceName ? (
            <>
              Delete workspace
              <br />
              "{pendingWorkspaceDeletion.workspaceName}"?
            </>
          ) : t.deleteWorkspace}
          description={pendingWorkspaceDeletion?.description || null}
          variant="workspace"
          onCancel={cancelWorkspaceDeletion}
          onConfirm={confirmWorkspaceDeletion}
        />
        
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: appearance === 'dark' ? '#333' : '#333',
            color: '#FFF',
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInOut 3s forwards'
          }}>
            {toastMessage}
          </div>
        )}

        {fullscreenImage && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out',
              cursor: 'zoom-out'
            }}
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
              style={{
                position: 'absolute',
                top: 40,
                right: 40,
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                zIndex: 100001,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
            >
              <X size={24} />
            </button>
            <img
              src={fullscreenImage}
              alt="Fullscreen"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                userSelect: 'none',
                WebkitUserDrag: 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
      </div>
      </div>
    </>
  );
}

export default App;

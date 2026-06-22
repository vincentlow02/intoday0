import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import JSZip from 'jszip';
import { ChevronRight, FileText, ImageIcon, PenLine, Trash2, X } from 'lucide-react';
import { useSyncedTodos } from '../todoSync';
import { getUserProfile } from '../userProfile';
import DesktopProfilePage from '../components/DesktopProfilePage';
import DesktopHistoryModal from '../components/DesktopHistoryModal';
import IntoDayLogo from '../components/IntoDayLogo';
import { DAY_BOUNDARY_HOUR, getLogicalToday } from '../lib/dateHelpers';
import { getInitialLanguage } from '../lib/language';
import { createUpdatedTimestamp, getPackMetadataTextFromItems } from '../lib/packMetadata';
import { deleteUploadedFileBlob, getUploadedFileRecord, saveUploadedFileBlob } from '../lib/uploadedFileStorage';
import {
  normalizePackCover,
  normalizePackIcon,
  normalizePackTags,
  PACK_ICON_SUGGESTIONS,
} from '../lib/packPageUtils';
import { timeBlocks } from '../lib/timeBlocks';
import {
  CARD_TYPES,
  extractPrimaryUrl,
  fetchMapMeta,
  fetchVideoMeta,
  fetchSpotifyMeta,
  fetchLinkPreviewMeta,
  getDerivedTaskFields,
  getTaskCardPresentation,
  normalizeCardType,
} from '../taskCardUtils';
import {
  deriveTaskDisplaySubtitle,
  deriveTaskDisplayTitle,
} from '../lib/taskDisplayUtils';
import { useTaskInteraction } from '../task-interactions/useTaskInteraction';
import { convertDocumentFileToMarkdown } from '../lib/convertToMarkdown';
import { PlusIcon, CanvasControlSlidersIcon, CanvasControlFitIcon, SearchIcon, PackSelectIcon, PackExportIcon, CloseIcon, OpenFullViewIcon, ArrowUpIcon, AttachFileIcon, ConvertUploadIcon, HeaderChevronIcon, EditIcon, LinkGlobeIcon, DocumentTextIcon, VideoGlyphIcon, SparkRosetteIcon, NotionGlyphIcon, GithubGlyphIcon, YouTubeGlyphIcon, ZoomChevronIcon, WorkspaceChevronIcon, WorkspaceMoreIcon, WorkspacePlusIcon } from '../components/icons/AppIcons';
import GlobalStyles from '../components/GlobalStyles';
import DesktopZoomControl from '../components/DesktopZoomControl';
import { TaskCardFaviconIcon, TaskCardContent, TaskCard } from '../components/TaskCard';
import DesktopDeleteConfirmModal from '../components/DesktopDeleteConfirmModal';
import {
  dateKey,
  sameDay,
  shiftDateByDays,
  getLocaleForLanguage,
  getTranslationsForLanguage,
  formatTemplate,
  parseSharedSelectedDate,
} from '../lib/dateUtils';
import {
  createQuickLinkPreviews,
  removeQuickAddUrlFromText,
  fetchYouTubeQuickLinkPreview,
} from '../lib/quickLinkUtils';
import {
  getUploadedFileFallbackMimeType,
  getSupportedUploadKind,
  isSupportedUploadFile,
  isSupportedConvertFile,
  hasSupportedUploadFiles,
  hasSupportedConvertFiles,
  getUploadedFileTitle,
  getDroppedImageTitle,
} from '../lib/uploadUtils';
import {
  getNextWorkspaceName,
  getTaskWorkspaceId,
  taskBelongsToWorkspace,
  normalizeDesktopWorkspaces,
  getDefaultDesktopWorkspaces,
  areTaskIdSelectionsEqual,
} from '../lib/workspaceUtils';
import {
  getDesktopGroupDisplayName,
  getDesktopGroupIcon,
  getDesktopGroupDisplayTags,
  getSuggestedDesktopGroupName,
  formatDesktopGroupChipLabel,
} from '../lib/groupMetadata';
import {
  sectionIdToMobileId,
  currentSection,
  getDesktopSectionPillStyle,
} from '../lib/timeSectionUtils';
import { getCanvasDeletionSummary } from '../lib/canvasDeletionSummary';




const SHARED_SELECTED_DATE_KEY = 'shared_selected_date';
const DESKTOP_LANGUAGE_KEY = 'desktop_profile_language';
const DESKTOP_APPEARANCE_KEY = 'desktop_profile_appearance';
const DESKTOP_WORKSPACES_KEY = 'desktop_workspace_items';
const DESKTOP_ACTIVE_WORKSPACE_KEY = 'desktop_active_workspace';
const DESKTOP_WORKSPACE_SCHEMA_KEY = 'desktop_workspace_schema_version';
const DESKTOP_WORKSPACE_SCHEMA_VERSION = '2';
const LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID = 'workspace-untitled';
const EMPTY_DESKTOP_WORKSPACE_ID = 'workspace-untitled-2';
const DEFAULT_DESKTOP_WORKSPACE_ID = 'workspace-untitled-3';
const MAX_DESKTOP_WORKSPACES = 3;
const LEGACY_SAMPLE_WORKSPACE_IDS = new Set(['workspace-personal-projects', 'workspace-work-setup']);
const DEFAULT_DESKTOP_WORKSPACES = [
  {
    id: EMPTY_DESKTOP_WORKSPACE_ID,
    name: 'Untitled 2',
    iconType: 'dot',
  },
  {
    id: DEFAULT_DESKTOP_WORKSPACE_ID,
    name: 'Untitled 3',
    iconType: 'dot',
  },
];


const MOBILE_BLOCK_STYLES = Object.fromEntries(timeBlocks.map((block) => [block.id, block]));
const DAY_TASK_TIME_ORDER = ['Morning', 'Afternoon', 'Evening', 'Night', 'Midnight'];
const sections = [
  {
    id: 'morning',
    mobileId: 'Morning',
    labelKey: 'morning',
    start: '06:00',
    end: '12:00',
    pillBg: '#f7d8a5',
    pillColor: '#6b3f06',
    darkPillBg: MOBILE_BLOCK_STYLES.Morning.color,
    darkPillColor: MOBILE_BLOCK_STYLES.Morning.textColor,
    darkPillBorder: MOBILE_BLOCK_STYLES.Morning.strokeColor,
  },
  {
    id: 'afternoon',
    mobileId: 'Afternoon',
    labelKey: 'afternoon',
    start: '12:00',
    end: '18:00',
    pillBg: '#bfe3fb',
    pillColor: '#0d4c82',
    darkPillBg: MOBILE_BLOCK_STYLES.Afternoon.color,
    darkPillColor: MOBILE_BLOCK_STYLES.Afternoon.textColor,
    darkPillBorder: MOBILE_BLOCK_STYLES.Afternoon.strokeColor,
  },
  {
    id: 'evening',
    mobileId: 'Evening',
    labelKey: 'evening',
    start: '18:00',
    end: '22:00',
    pillBg: '#eadffd',
    pillColor: '#5f2d90',
    darkPillBg: MOBILE_BLOCK_STYLES.Evening.color,
    darkPillColor: MOBILE_BLOCK_STYLES.Evening.textColor,
    darkPillBorder: MOBILE_BLOCK_STYLES.Evening.strokeColor,
  },
  {
    id: 'night',
    mobileId: 'Night',
    labelKey: 'night',
    start: '22:00',
    end: '06:00',
    pillBg: '#dfe6ef',
    pillColor: '#213243',
    darkPillBg: MOBILE_BLOCK_STYLES.Night.color,
    darkPillColor: MOBILE_BLOCK_STYLES.Night.textColor,
    darkPillBorder: MOBILE_BLOCK_STYLES.Night.strokeColor,
  },
];
const DESKTOP_DRAG_START_DISTANCE = 8;
const DESKTOP_DRAG_DAY_EDGE_HOLD_MS = 380;
const DESKTOP_DRAG_DAY_FLIP_COOLDOWN_MS = 700;
const DESKTOP_DRAG_DAY_FLIP_ZONE_PX = 56;
const DESKTOP_DRAG_DAY_ARM_DISTANCE_PX = 10;
const DESKTOP_DRAG_DAY_CONFIRM_DISTANCE_PX = 28;
const DESKTOP_DRAG_DAY_CANCEL_DISTANCE_PX = 16;
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
const DESKTOP_CANVAS_DEFAULT_ZOOM = 0.76;
const DESKTOP_CANVAS_MIN_SCALE = 0.25;
const DESKTOP_CANVAS_MAX_SCALE = 2;
const DESKTOP_CANVAS_SCALE_STEP = 0.12;
const DESKTOP_CANVAS_CARD_WIDTH = 336;
const DESKTOP_CANVAS_CARD_HEIGHT = 92;
const DESKTOP_PHOTO_CARD_HEIGHT = 236;
const DESKTOP_CANVAS_CARD_GAP = 20;
const DESKTOP_IMAGE_DROP_MAX_EDGE = 1600;
const DESKTOP_IMAGE_DROP_QUALITY = 0.88;
const UPLOADED_FILE_SOURCE_LABEL = 'Uploaded file';

const SUPPORTED_UPLOAD_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const SUPPORTED_CONVERT_ACCEPT = '.pdf,.docx,.html,.htm,.txt,.md,.csv,.tsv,.xml,text/plain,text/html,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DESKTOP_CANVAS_MIN_HEIGHT = 560;
const DESKTOP_GROUP_CARD_MIN_HEIGHT = 176;
const DESKTOP_GROUP_CARD_ITEM_HEIGHT = 60;
const DESKTOP_GROUP_CARD_ROW_GAP = 6;
const DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT = 320;
const DESKTOP_GROUP_CARD_EXPANDED_LIST_MAX_HEIGHT = 680;
const DESKTOP_GROUP_CARD_BASE_HEIGHT = 82;
const DESKTOP_GROUP_CARD_MORE_LABEL_HEIGHT = 48;
const DESKTOP_CANVAS_HITBOX_HORIZONTAL_PADDING = 10;
const DESKTOP_CANVAS_HITBOX_VERTICAL_PADDING = 18;
// Pure coordinate utility functions (no DOM refs, no closures)
const canvasToScreen = (canvasX, canvasY, vp) => ({
  x: canvasX + vp.panX,
  y: canvasY + vp.panY,
});
const screenToCanvas = (screenX, screenY, vp) => ({
  x: screenX - vp.panX,
  y: screenY - vp.panY,
});
// Root-level app window scale baseline. The live scale is driven by viewport.zoom
// so toolbar +/- behaves like Ctrl+Plus/Ctrl+Minus for the whole prototype UI.
const DESKTOP_APP_WINDOW_SCALE = 0.76;
const DESKTOP_FIXED_UI_SCALE = 0.95;


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


const getDesktopDayFlipZones = (viewportRect) => {
  const edgeZone = DESKTOP_DRAG_DAY_FLIP_ZONE_PX;
  return {
    mode: 'edge',
    previousStart: viewportRect.left,
    previousEnd: viewportRect.left + edgeZone,
    nextStart: viewportRect.right - edgeZone,
    nextEnd: viewportRect.right,
  };
};

const clampDesktopCanvasScale = (value) => Math.min(DESKTOP_CANVAS_MAX_SCALE, Math.max(DESKTOP_CANVAS_MIN_SCALE, value));
const isEditableElement = (target) => (
  target instanceof HTMLElement
  && Boolean(target.closest('input, textarea, button, select, [contenteditable="true"], [role="dialog"]'))
);
const isFiniteCanvasCoordinate = (value) => Number.isFinite(value) && value >= 0;
const getDesktopEstimatedGroupRowHeight = (task) => (
  normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO ? 232 : DESKTOP_GROUP_CARD_ITEM_HEIGHT
);
const getDesktopVisibleGroupTaskCount = (tasks, maxHeight) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;

  let totalHeight = 0;
  let visibleCount = 0;
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const rowHeight = getDesktopEstimatedGroupRowHeight(task);
    const nextHeight = totalHeight + (index > 0 ? DESKTOP_GROUP_CARD_ROW_GAP : 0) + rowHeight;
    if (visibleCount > 0 && nextHeight > maxHeight) {
      break;
    }
    if (visibleCount === 0 || nextHeight <= maxHeight) {
      totalHeight = nextHeight;
      visibleCount += 1;
    }
  }

  return Math.max(1, Math.min(visibleCount, tasks.length));
};
const getDesktopGroupListHeight = (tasks, visibleItemCount = tasks.length) => {
  if (!Array.isArray(tasks) || tasks.length === 0 || visibleItemCount <= 0) return 0;
  const visibleTasks = tasks.slice(0, visibleItemCount);
  return visibleTasks.reduce((total, task, index) => (
    total + getDesktopEstimatedGroupRowHeight(task) + (index > 0 ? DESKTOP_GROUP_CARD_ROW_GAP : 0)
  ), 0);
};
const getDesktopCollapsedGroupVisibleCount = (tasks) => (
  getDesktopVisibleGroupTaskCount(tasks, DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT)
);
const getDesktopGroupCardHeight = (tasks, visibleItemCount = tasks?.length ?? 0) => {
  const itemCount = Array.isArray(tasks) ? tasks.length : 0;
  const visibleCount = Math.max(1, Math.min(visibleItemCount, itemCount || 1));
  const hasExtra = itemCount > visibleCount;
  const listHeight = getDesktopGroupListHeight(tasks, visibleCount);
  return Math.max(
    DESKTOP_GROUP_CARD_MIN_HEIGHT,
    DESKTOP_GROUP_CARD_BASE_HEIGHT
      + listHeight
      + (hasExtra ? DESKTOP_GROUP_CARD_MORE_LABEL_HEIGHT : 12),
  );
};
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
  const clampedX = Math.max(0, Math.min(maxX, preferredPosition.x));
  const stepY = DESKTOP_CANVAS_CARD_GAP + 12;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const candidate = {
      x: clampedX,
      y: Math.max(0, preferredPosition.y + (attempt * stepY)),
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
    y: Math.max(0, preferredPosition.y),
  };
};

const cleanupDesktopGroupMetadata = (tasks) => {
  // Keep group metadata even when one task remains so dragging one item out of a
  // group does not collapse the pack into a plain standalone task.
  return tasks;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
  reader.readAsDataURL(file);
});
const loadImageElement = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Failed to decode image'));
  image.src = src;
});
const createUploadAttachmentId = () => `${Date.now()}-${Math.round(Math.random() * 100000)}`;
const createUploadedFileStorageKey = (fileName = 'file') => {
  const normalizedName = String(fileName || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'file';
  return `upload:${Date.now()}:${Math.random().toString(36).slice(2, 10)}:${normalizedName}`;
};
const serializeDroppedImageFile = async (file) => {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(originalDataUrl);
  const longestEdge = Math.max(image.naturalWidth || 0, image.naturalHeight || 0);
  const scale = longestEdge > DESKTOP_IMAGE_DROP_MAX_EDGE
    ? DESKTOP_IMAGE_DROP_MAX_EDGE / longestEdge
    : 1;
  const targetWidth = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  const targetHeight = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return {
      photoDataUrl: originalDataUrl,
      photoWidth: image.naturalWidth || targetWidth,
      photoHeight: image.naturalHeight || targetHeight,
      photoMimeType: file.type || 'image/png',
    };
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const shouldKeepAlpha = /png|webp|gif|avif/i.test(file.type || '');
  const mimeType = shouldKeepAlpha ? 'image/png' : 'image/jpeg';
  const photoDataUrl = canvas.toDataURL(mimeType, DESKTOP_IMAGE_DROP_QUALITY);

  return {
    photoDataUrl,
    photoWidth: targetWidth,
    photoHeight: targetHeight,
    photoMimeType: mimeType,
  };
};
const serializeUploadAttachment = async (file) => {
  const uploadKind = getSupportedUploadKind(file);
  if (!uploadKind) {
    throw new Error(`Unsupported file type: ${file?.name || 'unknown'}`);
  }

  const fallbackTitle = uploadKind === 'image' ? 'Photo' : 'Untitled file';
  const baseAttachment = {
    id: createUploadAttachmentId(),
    file,
    uploadKind,
    title: uploadKind === 'image' ? getDroppedImageTitle(file.name) : getUploadedFileTitle(file.name, fallbackTitle),
    originalFileName: file.name || `${fallbackTitle.toLowerCase().replace(/\s+/g, '-')}`,
    mimeType: file.type || getUploadedFileFallbackMimeType(uploadKind),
    size: Number.isFinite(file.size) ? file.size : 0,
    createdAt: createUpdatedTimestamp(),
    updatedAt: createUpdatedTimestamp(),
    extractedText: null,
    previewUrl: null,
  };

  if (uploadKind !== 'image') {
    return baseAttachment;
  }

  const photoFields = await serializeDroppedImageFile(file);
  return {
    ...baseAttachment,
    ...photoFields,
    previewUrl: photoFields.photoDataUrl || null,
  };
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


const getCalendarWeekdayLabels = (language) => {
  const locale = getLocaleForLanguage(language);
  const baseSunday = new Date(Date.UTC(2024, 0, 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseSunday);
    date.setUTCDate(baseSunday.getUTCDate() + index);
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date);
  });
};
const panelLabel = (date, language) => {
  const t = getTranslationsForLanguage(language);
  if (sameDay(date, getLogicalToday())) {
    return t.today;
  }

  return date.toLocaleDateString(getLocaleForLanguage(language), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};



























const getPackItemPrimaryUrl = (task) => (
  task?.primaryUrl
  || task?.videoUrl
  || task?.mapUrl
  || task?.redirectUrl
  || extractPrimaryUrl(task?.text || '')
  || ''
);

const getPackItemSourceMeta = (task, labels) => {
  const cardType = normalizeCardType(task?.cardType);
  const primaryUrl = getPackItemPrimaryUrl(task);
  const subtitle = deriveTaskDisplaySubtitle(task, labels) || 'Item';

  let host = '';
  let domain = '';
  try {
    if (primaryUrl) {
      const parsed = new URL(primaryUrl.startsWith('http') ? primaryUrl : `https://${primaryUrl}`);
      host = parsed.hostname.toLowerCase();
      domain = host.replace(/^www\./, '');
    }
  } catch {
    host = '';
    domain = '';
  }

  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    return { key: 'youtube', label: 'YouTube', domain: 'youtube.com' };
  }
  if (host.includes('chatgpt.com') || host.includes('openai.com')) {
    return { key: 'gpt', label: 'ChatGPT', domain: 'chatgpt.com' };
  }
  if (host.includes('notion.so') || host.includes('notion.site')) {
    return { key: 'notion', label: 'Notion', domain: 'notion.so' };
  }
  if (host.includes('github.com')) {
    return { key: 'github', label: 'GitHub', domain: 'github.com' };
  }
  if (host.includes('spotify.com') || host.includes('spoti.fi')) {
    return { key: 'spotify', label: 'Spotify', domain: 'spotify.com' };
  }
  if (host.includes('instagram.com')) {
    return { key: 'link', label: 'Instagram', domain: 'instagram.com' };
  }
  if (host.includes('twitter.com') || host.includes('x.com')) {
    return { key: 'link', label: 'X (Twitter)', domain: 'x.com' };
  }
  if (host.includes('tiktok.com')) {
    return { key: 'video', label: 'TikTok', domain: 'tiktok.com' };
  }
  if (host.includes('reddit.com')) {
    return { key: 'link', label: 'Reddit', domain: 'reddit.com' };
  }
  if (domain) {
    // generic website — use favicon
    return { key: 'link', label: domain, domain };
  }

  switch (cardType) {
    case 'photo':
      return { key: 'photo', label: labels?.photo || 'Photo', domain: null };
    case 'video':
      return { key: 'video', label: subtitle, domain: null };
    case 'document':
      return { key: 'document', label: subtitle, domain: null };
    case 'ai_tool':
      return { key: 'gpt', label: subtitle, domain: null };
    case 'text':
      return { key: 'text', label: subtitle, domain: null };
    default:
      return { key: 'link', label: subtitle, domain: null };
  }
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
const getPackRoleHeading = (role, labels = {}) => {
  const roleMap = {
    Context: labels.contextFilter || 'Context',
    Code: labels.techFilter || 'Tech',
    Notes: labels.notesFilter || 'Notes',
    Reference: labels.referenceFilter || 'Reference',
  };
  return roleMap[role] || role;
};
const getPackFilterLabel = (filter, labels = {}) => {
  return PACK_FILTER_LABELS[filter] || labels?.[`${filter}Filter`] || filter;
};

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
  CARD_TYPES.SOCIAL,
  CARD_TYPES.SHOPPING,
  CARD_TYPES.FINANCIAL,
  CARD_TYPES.AI_TOOL,
]);

const PACK_MEMO_CARD_TYPES = new Set([
  CARD_TYPES.TEXT,
  CARD_TYPES.MEETING,
]);

const getPackTaskFilterCategories = (task) => {
  const cardType = normalizeCardType(task?.cardType);
  const categories = [];
  const hasUploadedFile = Boolean(
    task?.uploadedFileStorageKey
    || task?.uploadedFileName
    || task?.fileName
    || task?.attachmentName
    || task?.photoDataUrl
    || task?.photoUrl
  );
  const hasUrl = Boolean(extractPrimaryUrl(task?.text || '') || task?.url || task?.href || task?.linkUrl);

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

const getPackTaskRoles = (task, labels) => {
  const q = (task?.text || '').toLowerCase();
  const title = (deriveTaskDisplayTitle(task) || '').toLowerCase();
  const sourceMeta = getPackItemSourceMeta(task, labels);
  const source = sourceMeta.key.toLowerCase();
  const sourceLabel = String(sourceMeta.label || '').toLowerCase();
  const sourceDomain = String(sourceMeta.domain || '').toLowerCase();
  const tags = Array.isArray(task?.tags) ? task.tags.map((tag) => String(tag).toLowerCase()) : [];
  const cardType = normalizeCardType(task?.cardType);
  const roles = [];

  if (
    ['gpt'].includes(source)
    || q.includes('chat.openai.com')
    || q.includes('chatgpt.com')
    || q.includes('gemini.google.com')
    || q.includes('claude.ai')
    || q.includes('perplexity.ai')
    || tags.some((tag) => ['context', 'prompt', 'ai'].includes(tag))
    || ['context', 'background', 'summary', 'description', 'prompt'].some((keyword) => q.includes(keyword) || title.includes(keyword))
  ) {
    roles.push('Context');
  }

  if (
    ['github'].includes(source)
    || sourceLabel.includes('github')
    || sourceDomain.includes('github.com')
    || q.includes('github.com')
    || title.includes('github')
    || q.includes('```')
    || tags.some((tag) => ['code', 'dev', 'api', 'technical'].includes(tag))
    || ['code', 'dev', 'api', 'implementation', 'technical'].some((keyword) => q.includes(keyword) || title.includes(keyword))
  ) {
    roles.push('Code');
  }

  if (
    cardType === CARD_TYPES.TEXT
    || tags.some((tag) => ['note', 'memo', 'reminder', 'thoughts'].includes(tag))
  ) {
    if (!roles.includes('Code') && !roles.includes('Context')) {
      roles.push('Notes');
    }
  }

  if (['link', 'video', 'shopping', 'social', 'financial', 'location', 'document', 'meeting', 'music', 'podcast', 'photo'].includes(cardType)) {
    if (!roles.includes('Code') && !roles.includes('Context')) {
      roles.push('Reference');
    }
  }

  if (roles.length === 0) {
    if (cardType === CARD_TYPES.LINK) roles.push('Reference');
    else roles.push('Notes');
  }

  return roles;
};

const getPrimaryPackTaskRole = (task, labels) => {
  const roles = getPackTaskRoles(task, labels);
  return PACK_EXPORT_SECTION_ORDER.find(({ role }) => roles.includes(role))?.role || null;
};

const getPackTasksByRole = (tasks, labels, role) => (
  tasks.filter((task) => getPrimaryPackTaskRole(task, labels) === role)
);

const sanitizePackFilename = (value) => {
  const normalized = String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return normalized || 'untitled-pack';
};

const getPackExportBodyText = (task) => {
  const title = deriveTaskDisplayTitle(task).trim();
  const primaryUrl = getPackItemPrimaryUrl(task).trim();
  const candidates = [
    task?.content,
    task?.body,
    task?.previewText,
    task?.preview,
    task?.description,
    task?.summary,
    task?.note,
    task?.text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (title && trimmed === title) continue;
    if (primaryUrl && trimmed === primaryUrl) continue;
    return trimmed;
  }

  return '';
};

const isCodeLikeContent = (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  if (text.includes('```')) return false;
  if (/[{};]/.test(text) && /\b(const|let|var|function|return|import|export|class|if|else|await|async)\b/.test(text)) return true;
  if (/<[A-Za-z][\s\S]*>/.test(text)) return true;
  if (/^\s{2,}\S/m.test(text)) return true;
  if (/=>/.test(text)) return true;
  return false;
};
const shouldIncludePackExportUrl = (value) => /^(https?:\/\/|www\.)/i.test(String(value || '').trim());
const isBundleExportableUploadedAsset = (task) => (
  Boolean(task?.uploadedFileStorageKey)
  && ['pdf', 'word', 'image'].includes(String(task?.uploadedFileType || '').toLowerCase())
);
const isDataUrl = (value) => /^data:/i.test(String(value || '').trim());
const dataUrlToBlob = async (value) => {
  const [header, base64Data = ''] = String(value).split(',');
  const mimeMatch = /^data:([^;]+);base64$/i.exec(header || '');
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = atob(base64Data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
};
const sanitizeAssetFilename = (value, fallback = 'file') => {
  const trimmed = String(value || '').trim();
  const extensionMatch = /\.([a-z0-9]+)$/i.exec(trimmed);
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : '';
  const baseName = (extension ? trimmed.slice(0, -extension.length) : trimmed) || fallback;
  const sanitizedBase = baseName
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || fallback;
  const sanitizedExtension = extension.replace(/[^.a-z0-9]+/gi, '').toLowerCase();
  return `${sanitizedBase}${sanitizedExtension}`.toLowerCase();
};
const ensureUniqueAssetFilename = (fileName, usedNames) => {
  const extensionMatch = /(\.[a-z0-9]+)$/i.exec(fileName);
  const extension = extensionMatch ? extensionMatch[1] : '';
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  let candidate = fileName;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${baseName}-${suffix}${extension}`;
    suffix += 1;
  }
  usedNames.add(candidate);
  return candidate;
};
const collectPackAssets = async (tasks) => {
  const usedNames = new Set();
  const assetPathByStorageKey = new Map();
  const assetPathByTaskId = new Map();
  const assets = [];

  for (const task of tasks) {
    if (isBundleExportableUploadedAsset(task)) {
      const storageKey = task.uploadedFileStorageKey;
      if (assetPathByStorageKey.has(storageKey)) {
        assetPathByTaskId.set(task.id, assetPathByStorageKey.get(storageKey));
        continue;
      }

      try {
        const record = await getUploadedFileRecord(storageKey);
        if (!record?.blob) continue;

        const safeName = ensureUniqueAssetFilename(
          sanitizeAssetFilename(
            task.uploadedOriginalFileName
            || record.originalFileName
            || `${deriveTaskDisplayTitle(task) || 'file'}`
          ),
          usedNames,
        );
        const relativePath = `assets/${safeName}`;
        assetPathByStorageKey.set(storageKey, relativePath);
        assetPathByTaskId.set(task.id, relativePath);
        assets.push({
          storageKey,
          path: relativePath,
          blob: record.blob,
        });
      } catch (error) {
        console.error('Failed to collect uploaded asset for export bundle:', error);
      }
      continue;
    }

    if (normalizeCardType(task?.cardType) !== CARD_TYPES.PHOTO) continue;

    const photoReference = task?.photoDataUrl || task?.photoUrl || '';
    if (!isDataUrl(photoReference)) continue;

    try {
      const blob = await dataUrlToBlob(photoReference);
      const mimeType = blob.type || task?.photoMimeType || 'image/png';
      const extension = mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('webp') ? '.webp' : '.png';
      const safeName = ensureUniqueAssetFilename(
        sanitizeAssetFilename(
          task?.photoFileName || `${deriveTaskDisplayTitle(task) || 'image'}${extension}`
        ),
        usedNames,
      );
      const relativePath = `assets/${safeName}`;
      assetPathByTaskId.set(task.id, relativePath);
      assets.push({
        storageKey: null,
        path: relativePath,
        blob,
      });
    } catch (error) {
      console.error('Failed to collect legacy photo asset for export bundle:', error);
    }
  }

  return {
    assets,
    assetPathByStorageKey,
    assetPathByTaskId,
  };
};

const buildPackExportItemMarkdown = (task, labels, role, options = {}) => {
  const title = deriveTaskDisplayTitle(task).trim() || task?.text?.trim() || 'Untitled item';
  const sourceMeta = getPackItemSourceMeta(task, labels);
  const primaryUrl = getPackItemPrimaryUrl(task).trim();
  const bodyText = getPackExportBodyText(task);
  const cardType = normalizeCardType(task?.cardType);
  const isPhotoCard = cardType === CARD_TYPES.PHOTO;
  const assetReferencePath = (
    (task?.uploadedFileStorageKey
      ? options.assetPathByStorageKey?.get(task.uploadedFileStorageKey)
      : null)
    || options.assetPathByTaskId?.get(task?.id)
    || null
  );
  const lines = [`### ${title}`];

  if (sourceMeta?.label) {
    lines.push('');
    lines.push(`Source: ${sourceMeta.label}`);
  }

  if (assetReferencePath && !isPhotoCard) {
    lines.push(`File: ${assetReferencePath}`);
  }

  if (shouldIncludePackExportUrl(primaryUrl)) {
    lines.push(`URL: ${primaryUrl}`);
  }

  if (bodyText) {
    lines.push('');
    if (role === 'Code' && isCodeLikeContent(bodyText)) {
      lines.push('```');
      lines.push(bodyText);
      lines.push('```');
    } else {
      lines.push(bodyText);
    }
  }

  return lines.join('\n');
};

const buildPackSectionMarkdown = (tasks, labels, role, heading, options = {}) => {
  const sectionTasks = getPackTasksByRole(tasks, labels, role);
  if (!sectionTasks.length) return '';

  const lines = [`## ${heading}`, ''];
  sectionTasks.forEach((task, index) => {
    lines.push(buildPackExportItemMarkdown(task, labels, role, options));
    if (index < sectionTasks.length - 1) {
      lines.push('');
    }
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
};

const buildPackExportHeaderLines = (tasks, title) => {
  const updatedLabel = getPackMetadataTextFromItems(tasks);
  const tags = getDesktopGroupDisplayTags(tasks);
  const lines = [`# ${title}`, ''];

  lines.push(`- Updated: ${updatedLabel || 'Not available'}`);
  if (tags.length) {
    lines.push(`- Tags: ${tags.join(', ')}`);
  }

  return lines;
};

const buildRoleMarkdown = (tasks, labels, role) => {
  const roleConfig = PACK_EXPORT_SECTION_ORDER.find((entry) => entry.role === role);
  if (!roleConfig) return '';

  const sectionTasks = getPackTasksByRole(tasks, labels, role);
  if (!sectionTasks.length) return '';

  const packTitle = getDesktopGroupDisplayName(tasks) || 'Untitled pack';
  const lines = buildPackExportHeaderLines(tasks, `${packTitle} — ${roleConfig.heading}`);
  lines.push('');
  lines.push(`## ${roleConfig.heading}`);
  lines.push('');

  sectionTasks.forEach((task, index) => {
    lines.push(buildPackExportItemMarkdown(task, labels, role));
    if (index < sectionTasks.length - 1) {
      lines.push('');
    }
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
};

const buildCopyForAIText = (tasks, labels, exportType) => {
  const packTitle = getDesktopGroupDisplayName(tasks) || 'Untitled pack';

  if (exportType === 'all') {
    const sectionBlocks = PACK_EXPORT_SECTION_ORDER
      .map(({ role, heading }) => buildPackSectionMarkdown(tasks, labels, role, heading))
      .filter(Boolean);

    if (!sectionBlocks.length) return '';

    return [
      'Here is the context for my current task.',
      '',
      `# ${packTitle}`,
      '',
      sectionBlocks.join('\n'),
      '',
      'Please use the information above to help me with the next step.',
    ].join('\n').trim();
  }

  const roleMap = {
    context: 'Context',
    code: 'Code',
    notes: 'Notes',
    reference: 'Reference',
  };
  const role = roleMap[exportType];
  const heading = getPackRoleHeading(role, labels);
  if (!role || !heading) return '';

  const sectionBlock = buildPackSectionMarkdown(tasks, labels, role, heading);
  if (!sectionBlock) return '';

  return [
    `Here is the ${heading.toLowerCase()} for my current task.`,
    '',
    `# ${packTitle} — ${heading}`,
    '',
    sectionBlock.trim(),
    '',
    'Please use the information above to help me.',
  ].join('\n').trim();
};

const buildWholePackMarkdown = (tasks, labels, options = {}) => {
  const packTitle = getDesktopGroupDisplayName(tasks) || 'Untitled pack';
  const sectionMap = new Map(PACK_EXPORT_SECTION_ORDER.map(({ role }) => [role, []]));

  tasks.forEach((task) => {
    const role = getPrimaryPackTaskRole(task, labels);
    if (!role || !sectionMap.has(role)) return;
    sectionMap.get(role).push(task);
  });

  const lines = buildPackExportHeaderLines(tasks, packTitle);

  PACK_EXPORT_SECTION_ORDER.forEach(({ role, heading }) => {
    const sectionTasks = sectionMap.get(role) || [];
    if (!sectionTasks.length) return;
    lines.push('');
    lines.push(`## ${heading}`);
    lines.push('');
    sectionTasks.forEach((task, index) => {
      lines.push(buildPackExportItemMarkdown(task, labels, role, options));
      if (index < sectionTasks.length - 1) {
        lines.push('');
      }
      lines.push('');
    });
    while (lines[lines.length - 1] === '') {
      if (lines[lines.length - 2]?.startsWith('## ')) break;
      lines.pop();
    }
  });

  return `${lines.join('\n').trim()}\n`;
};
const downloadBlob = (filename, blob) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

const downloadMarkdown = (filename, markdown) => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(filename, blob);
};

const copyTextToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
};

const FALLBACK_TYPE_ICONS = {
  photo: <img src="/photo.svg" alt="" width={16} height={16} style={{ objectFit: 'contain' }} />,
  text: <DocumentTextIcon />,
  document: <DocumentTextIcon />,
  video: <VideoGlyphIcon />,
  link: <LinkGlobeIcon />,
  gpt: <SparkRosetteIcon />,
};

const PackItemSourceIcon = ({ task, appearance, labels }) => {
  const [imgError, setImgError] = useState(false);
  const { cfg } = getTaskCardPresentation(task, labels || {});
  const { sourceKey, domain } = getPackItemSourceMeta(task, labels || {});
  const iconBackground = appearance === 'dark' ? cfg.darkBg : cfg.bg;
  const iconBorder = appearance === 'dark' ? `1px solid ${cfg.darkStroke}` : 'none';
  const photoPreview = task?.photoDataUrl || task?.photoUrl;

  if (normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO && photoPreview) {
    return (
        <span className="desktop-pack-page-item-leading desktop-pack-page-item-leading-photo-preview" aria-hidden="true">
          <img
            src={photoPreview}
            alt=""
            width={36}
            height={36}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
          />
        </span>
    );
  }

  if (domain && !imgError) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return (
      <span className="desktop-pack-page-item-leading desktop-pack-page-item-leading-favicon" aria-hidden="true">
        <img
          src={faviconUrl}
          alt=""
          width={22}
          height={22}
          style={{ borderRadius: 4, objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`desktop-pack-page-item-leading desktop-pack-page-item-leading-${sourceKey || 'link'}`}
      aria-hidden="true"
      style={{ background: iconBackground, border: iconBorder }}
    >
      {appearance === 'dark' && cfg.darkIconColor ? (
        <span
          style={{
            width: 18,
            height: 18,
            backgroundColor: cfg.darkIconColor,
            maskImage: `url(${cfg.icon})`,
            WebkitMaskImage: `url(${cfg.icon})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      ) : (
        <img src={cfg.icon} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
      )}
    </span>
  );
};





const GroupedTaskCard = ({
  tasks,
  appearance,
  labels,
  isDragging,
  isGroupDragActive,
  isSelected,
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


const DesktopGroupFullViewModal = ({
  view,
  appearance,
  labels,
  language,
  onClose,
  onTaskOpen,
  onTaskEdit,
  onDeleteTasks,
  onUpdateGroup,
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
    console.debug('[desktop-group-modal] prune selected items effect', {
      open,
      taskCount: tasks.length,
      taskIds: tasks.map((task) => task.id),
    });
    setSelectedItemIds((current) => {
      const next = current.filter((taskId) => existingIds.has(taskId));
      const changed = next.length !== current.length;
      console.debug('[desktop-group-modal] prune selected items setState', {
        previous: current,
        next,
        changed,
      });
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

    // Filter by visible item type tabs: ファイル / リンク / メモ.
    if (activeFilter !== 'all') {
      list = list.filter(task => {
        const categories = getPackTaskFilterCategories(task);
        return categories.includes(activeFilter);
      });
    }

    // Search filter
    if (itemSearchQuery.trim()) {
      const sq = itemSearchQuery.toLowerCase();
      list = list.filter(task => {
        const { displayTitle, displaySub } = getTaskCardPresentation(task, labels);
        const { domain } = getPackItemSourceMeta(task, labels);
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

  const filters = PACK_FILTER_ORDER;
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
  const handleExportWholePack = () => {
    const markdown = buildWholePackMarkdown(tasks, labels);
    const filename = `${sanitizePackFilename(getDesktopGroupDisplayName(tasks))}.md`;
    downloadMarkdown(filename, markdown);
    setIsExportMenuOpen(false);
  };
  const handleExportPackBundle = async () => {
    try {
      const { assets, assetPathByStorageKey, assetPathByTaskId } = await collectPackAssets(tasks);
      const markdown = buildWholePackMarkdown(tasks, labels, { assetPathByStorageKey, assetPathByTaskId });
      const zip = new JSZip();
      zip.file('context.md', markdown);
      assets.forEach((asset) => {
        zip.file(asset.path, asset.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const packSlug = sanitizePackFilename(getDesktopGroupDisplayName(tasks));
      const filename = packSlug === 'untitled-pack' ? 'untitled-pack.zip' : `${packSlug}-pack.zip`;
      downloadBlob(filename, zipBlob);
    } catch (error) {
      console.error('Failed to export pack bundle:', error);
      onToast?.('Unable to export pack bundle');
    }
    setIsExportMenuOpen(false);
  };
  const handleCopyWholePackForAi = async () => {
    const text = buildCopyForAIText(tasks, labels, 'all');
    if (!text) {
      onToast?.('No pack content to copy');
      setIsExportMenuOpen(false);
      return;
    }
    try {
      await copyTextToClipboard(text);
      onToast?.('Copied whole pack for AI');
    } catch (_) {
      onToast?.('Unable to copy whole pack');
    }
    setIsExportMenuOpen(false);
  };
  const handleCopyRoleForAi = async (role, exportType) => {
    const text = buildCopyForAIText(tasks, labels, exportType);
    const roleHeading = getPackRoleHeading(role);
    if (!text) {
      onToast?.(`No ${roleHeading} items to copy`);
      setIsExportMenuOpen(false);
      return;
    }
    try {
      await copyTextToClipboard(text);
      onToast?.(`Copied ${roleHeading} for AI`);
    } catch (_) {
      onToast?.(`Unable to copy ${roleHeading}`);
    }
    setIsExportMenuOpen(false);
  };
  const handleExportByRole = (role) => {
    const markdown = buildRoleMarkdown(tasks, labels, role);
    const roleHeading = getPackRoleHeading(role);
    const roleSlug = roleHeading.toLowerCase();
    if (!markdown) {
      onToast?.(`No ${roleHeading} items to export`);
      setIsExportMenuOpen(false);
      return;
    }
    const filename = `${sanitizePackFilename(getDesktopGroupDisplayName(tasks))}-${roleSlug}.md`;
    downloadMarkdown(filename, markdown);
    setIsExportMenuOpen(false);
  };
  const handleExportMenuAction = (action) => {
    if (action === 'copy-for-ai') {
      handleCopyWholePackForAi();
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
    if (action === 'whole-pack') {
      handleExportWholePack();
      return;
    }
    if (action === 'pack-bundle') {
      void handleExportPackBundle();
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
    { id: 'whole-pack', label: 'Export as Markdown' },
    { id: 'pack-bundle', label: 'Download ZIP' },
  ];

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
      className="desktop-pack-page-modal"
    >
      <div className={`desktop-pack-page-backdrop ${isBackdropVisible ? 'is-visible' : ''}`} />
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-group-full-view-title"
        onClick={(event) => event.stopPropagation()}
        className={`desktop-pack-page-shell ${isDark ? 'is-dark' : ''} ${hasOriginTransition ? 'has-origin-transition' : ''} ${isAtSourcePosition ? 'is-from-card' : ''} ${isClosing ? 'is-closing' : ''}`}
        style={shellMotionStyle}
      >
        <div className={`desktop-pack-page-shell-inner ${isContentVisible ? 'is-visible' : ''}`}>
        <div className="desktop-pack-page-topbar">
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={labels.close}
            className="desktop-pack-page-close"
          >
            <CloseIcon />
          </button>
        </div>

        <DesktopPackPageHeader
          tasks={tasks}
          onUpdateGroup={onUpdateGroup}
          appearance={appearance}
          language={language}
          labels={labels}
          isSelectMode={isSelectMode}
          selectedCount={selectedCount}
          onEnterSelectMode={enterSelectMode}
          onExitSelectMode={exitSelectMode}
          onDeleteSelected={handleDeleteSelected}
        />

        <div className="desktop-pack-page-content">
          <div className="desktop-pack-page-controls">
            <div className="desktop-pack-page-controls-bar">
              <div className="desktop-pack-page-filters" role="tablist" aria-label="Pack filters">
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
                    {getPackFilterLabel(filter, labels)}
                  </button>
                ))}
              </div>
              <div className={`desktop-pack-page-control-actions ${isSelectMode ? 'is-select-mode' : ''}`}>
                {isSelectMode ? (
                  <button
                    type="button"
                    className="desktop-pack-page-toolbar-action desktop-pack-page-toolbar-text-action is-active"
                    onClick={exitSelectMode}
                  >
                    <PackSelectIcon />
                    <span>{labels.select || 'Select'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`desktop-pack-page-toolbar-action desktop-pack-page-search-toggle ${isSearchVisible ? 'is-active' : ''}`}
                      onClick={() => {
                        setIsSearchVisible((current) => !current);
                        setIsExportMenuOpen(false);
                      }}
                      aria-label="Search items"
                      aria-expanded={isSearchVisible}
                    >
                      <SearchIcon />
                      <span>{labels.search || 'Search'}</span>
                    </button>
                    <span className="desktop-pack-page-toolbar-divider" aria-hidden="true" />
                    <button
                      type="button"
                      className="desktop-pack-page-toolbar-action desktop-pack-page-toolbar-text-action"
                      onClick={enterSelectMode}
                    >
                      <PackSelectIcon />
                      <span>{labels.select || 'Select'}</span>
                    </button>
                    <div className="desktop-pack-page-toolbar-menu-anchor" ref={exportMenuRef}>
                      <button
                        type="button"
                        className={`desktop-pack-page-toolbar-action desktop-pack-page-toolbar-text-action ${isExportMenuOpen ? 'is-active' : ''}`}
                        aria-haspopup="menu"
                        aria-expanded={isExportMenuOpen}
                        onClick={() => setIsExportMenuOpen((current) => !current)}
                      >
                        <PackExportIcon />
                        <span>{labels.exportPack || 'Export'}</span>
                      </button>
                      {isExportMenuOpen ? (
                        <div className="desktop-pack-page-toolbar-menu" role="menu" aria-label="Export pack">
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
                <SearchIcon />
                <input
                  type="text"
                  placeholder={labels.searchInPack || 'Search in pack...'}
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="desktop-pack-page-search-input"
                  autoFocus
                />
              </div>
            )}
          </div>
          
          <div className="desktop-pack-page-item-list">
            {filteredTasks.length === 0 ? (
              <div className="desktop-pack-page-empty">{labels.noItemsFound || 'No items found'}</div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  id={`desktop-pack-page-item-${task.id}`}
                  className={`desktop-pack-page-item ${highlightedTaskId === task.id ? 'is-highlighted' : ''}`}
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
                    const { label } = getPackItemSourceMeta(task, labels);
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
    </div>
  );
};

const GroupDragPreview = ({ tasks, appearance, labels }) => {
  const groupTitle = getDesktopGroupDisplayName(tasks);
  const groupIcon = getDesktopGroupIcon(tasks);
  const metadataText = getPackMetadataTextFromItems(tasks);
  const groupChips = getDesktopGroupDisplayTags(tasks);
  const displayTasks = tasks.slice(0, 4); // Display up to 4 items matching the card

  return (
    <div className="desktop-task-card desktop-task-group-card is-drag-preview" style={{ width: '100%', height: '100%', transform: 'none', padding: '14px 0 0 0' }}>
      <div className="desktop-task-group-header" style={{ marginBottom: 10, padding: '0 14px' }}>
        <div className="desktop-task-group-title-wrap">
          {groupIcon ? (
            <span className="desktop-task-group-title-icon">{groupIcon}</span>
          ) : (
            <span className="desktop-task-group-title-dot" />
          )}
          <div className="desktop-task-group-title-block">
            <span className="desktop-task-group-title">{groupTitle}</span>
            {metadataText && <span className="desktop-task-group-metadata">{metadataText}</span>}
          </div>
        </div>
      </div>

      {groupChips.length > 0 && (
        <div className="desktop-task-group-chip-row" style={{ padding: '0 14px', marginBottom: 10 }}>
          {groupChips.map((chip, idx) => (
            <div key={idx} className="desktop-task-group-chip">
              {chip}
            </div>
          ))}
        </div>
      )}

      <div className="desktop-task-group-list" style={{ padding: 0 }}>
        {displayTasks.map((task) => (
          <div key={task.id} className="desktop-task-group-row" style={{ minHeight: 40, padding: '4px 8px' }}>
            <TaskCardContent task={task} appearance={appearance} labels={labels} />
          </div>
        ))}
        {tasks.length > 4 && (
          <div className="desktop-task-group-more-label">
            {tasks.length} tasks
          </div>
        )}
      </div>
    </div>
  );
};



const DesktopGroupPrompt = ({
  prompt,
  groupName,
  setGroupName,
  onConfirm,
  onCancel,
}) => {
  if (!prompt) return null;

  const panelWidth = 320;
  const left = Math.min(
    Math.max(24, prompt.anchorX - (panelWidth / 2)),
    window.innerWidth - panelWidth - 24,
  );
  const top = Math.min(
    Math.max(96, prompt.anchorY + 18),
    window.innerHeight - 220,
  );

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="desktop-group-prompt-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-group-prompt-title"
        onClick={(event) => event.stopPropagation()}
        className="desktop-group-prompt-panel"
        style={{
          left,
          top,
          width: 360,
        }}
      >
        <div className="desktop-group-prompt-eyebrow">
          <span className="desktop-group-prompt-eyebrow-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14 }}>
              <path d="M6.167 5.5H4.833a2.333 2.333 0 0 0 0 4.667h1.334M9.833 5.5h1.334a2.333 2.333 0 0 1 0 4.667H9.833M5.667 8h4.666" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Merge into group</span>
        </div>
        <input
          type="text"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onConfirm();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
          autoFocus
          placeholder="Group title"
          className="desktop-group-prompt-input"
        />
        <div className="desktop-group-prompt-actions">
          <button
            type="button"
            onClick={onCancel}
            className="desktop-group-prompt-secondary"
          >
            Keep separate
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="desktop-group-prompt-primary"
          >
            Group items <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DragDayFeedbackOverlay = ({
  direction,
  previousLabel,
  nextLabel,
  zones,
  isConfirming,
}) => (
  <div className={`desktop-drag-day-feedback ${direction ? 'is-visible' : ''} ${isConfirming ? 'is-confirming' : ''}`} aria-hidden="true">
    <div
      className={`desktop-drag-day-feedback-edge desktop-drag-day-feedback-edge-previous ${direction === 'previous' ? 'is-active' : ''}`}
      style={zones ? { width: Math.max(0, zones.previousEnd - zones.previousStart) } : undefined}
    >
      <div className="desktop-drag-day-feedback-chip">
        <span className="desktop-drag-day-feedback-arrow desktop-drag-day-feedback-arrow-previous">{'←'}</span>
        <span className="desktop-drag-day-feedback-label">{previousLabel}</span>
      </div>
    </div>
    <div
      className={`desktop-drag-day-feedback-edge desktop-drag-day-feedback-edge-next ${direction === 'next' ? 'is-active' : ''}`}
      style={zones ? { width: Math.max(0, zones.nextEnd - zones.nextStart) } : undefined}
    >
      <div className="desktop-drag-day-feedback-chip">
        <span className="desktop-drag-day-feedback-label">{nextLabel}</span>
        <span className="desktop-drag-day-feedback-arrow desktop-drag-day-feedback-arrow-next">{'→'}</span>
      </div>
    </div>
  </div>
);

const DragDayFeedbackOverlayV2 = ({
  direction,
  previousLabel,
  nextLabel,
  zones,
  isConfirming,
}) => {
  const renderEdge = (edgeDirection, label, arrow, width) => {
    const isActive = direction === edgeDirection;
    const stateClass = isActive ? (isConfirming ? 'is-armed' : 'is-preview') : '';

    return (
      <div
        className={`desktop-drag-day-feedback-edge desktop-drag-day-feedback-edge-${edgeDirection} ${isActive ? 'is-active' : ''} ${stateClass}`}
        style={typeof width === 'number' ? { width } : undefined}
      >
        <div className="desktop-drag-day-feedback-chip">
          {edgeDirection === 'previous' ? (
            <span className="desktop-drag-day-feedback-arrow desktop-drag-day-feedback-arrow-previous">{'<'}</span>
          ) : null}
          <div className="desktop-drag-day-feedback-copy">
            <span className="desktop-drag-day-feedback-label">{label}</span>
            {isActive ? (
              <span className="desktop-drag-day-feedback-hint">
                {isConfirming ? 'Ready to switch' : 'Hold or drag further'}
              </span>
            ) : null}
          </div>
          {edgeDirection === 'next' ? (
            <span className="desktop-drag-day-feedback-arrow desktop-drag-day-feedback-arrow-next">{'>'}</span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className={`desktop-drag-day-feedback ${direction ? 'is-visible' : ''} ${isConfirming ? 'is-confirming' : ''}`} aria-hidden="true">
      {renderEdge('previous', previousLabel, '<', zones ? Math.max(0, zones.previousEnd - zones.previousStart) : undefined)}
      {renderEdge('next', nextLabel, '>', zones ? Math.max(0, zones.nextEnd - zones.nextStart) : undefined)}
    </div>
  );
};

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

const composeDesktopNoteText = (title, body) => {
  const safeTitle = title.trim() || 'Untitled note';
  const normalizedBody = String(body || '').replace(/\r\n/g, '\n');
  return normalizedBody ? `${safeTitle}\n${normalizedBody}` : safeTitle;
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

const DesktopQuickNoteSidePanel = ({
  open,
  title,
  body,
  labels,
  onTitleChange,
  onBodyChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  const displayTitle = title.trim() || 'Quick Note';
  const canSubmit = title.trim().length > 0 || body.trim().length > 0;

  return (
    <div className="desktop-note-side-layer" role="presentation" onClick={onClose}>
      <aside
        className="desktop-note-side-panel desktop-note-side-panel-quick"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-quick-note-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="desktop-note-side-toolbar">
          <button type="button" className="desktop-note-side-icon-button" aria-label="Collapse note" onClick={onClose}>
            <span aria-hidden="true">&raquo;</span>
          </button>
          <button type="button" className="desktop-note-side-icon-button" aria-label="New note">
            <span aria-hidden="true">+</span>
          </button>
          <button type="button" className="desktop-note-side-close" aria-label={labels.close || 'Close'} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="desktop-note-side-meta">
          <span className="desktop-note-side-chevron" aria-hidden="true">v</span>
          <span className="desktop-note-side-doc-icon" aria-hidden="true" />
          <span className="desktop-note-side-meta-title">{displayTitle}</span>
        </div>
        <div className="desktop-note-side-content">
          <input
            id="desktop-quick-note-title"
            className="desktop-note-side-title-input"
            value={title}
            placeholder="Untitled note"
            onChange={(event) => onTitleChange(event.target.value)}
            autoFocus
          />
          <div className="desktop-note-side-title-divider" aria-hidden="true" />
          <textarea
            className="desktop-note-side-body-editor"
            value={body}
            placeholder="Start typing..."
            onChange={(event) => onBodyChange(event.target.value)}
          />
        </div>
        <div className="desktop-note-side-footer">
          <button
            type="button"
            className="desktop-note-side-add-button"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            <span className="desktop-note-side-add-icon" aria-hidden="true">+</span>
            <span>Add to Canvas</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

const DesktopUploadPreviewModal = ({ attachment, onClose, onReplace, onSubmit }) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const replacementInputRef = useRef(null);
  const isPhoto = attachment?.uploadKind === 'image';
  const isPdf = attachment?.uploadKind === 'pdf';

  useEffect(() => {
    if (!isPdf || !attachment?.file) {
      setPdfPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(attachment.file);
    setPdfPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [attachment?.file, isPdf]);

  if (!attachment || (!isPhoto && !isPdf)) return null;

  const fileSize = (() => {
    if (!Number.isFinite(attachment.size) || attachment.size <= 0) return '';
    if (attachment.size < 1024 * 1024) return `${Math.max(1, Math.round(attachment.size / 1024))} KB`;
    return `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`;
  })();
  const dimensions = isPhoto && Number.isFinite(attachment.photoWidth) && Number.isFinite(attachment.photoHeight)
    ? `${attachment.photoWidth} × ${attachment.photoHeight} px`
    : '';

  return (
    <div className="desktop-upload-preview-backdrop" role="presentation" onPointerDown={onClose}>
      <section
        className="desktop-upload-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-upload-preview-title"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="desktop-upload-preview-header">
          <h2 id="desktop-upload-preview-title">Add</h2>
          <button type="button" className="desktop-upload-preview-close" aria-label="Close upload" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="desktop-upload-preview-body">
          <input
            ref={replacementInputRef}
            className="desktop-upload-preview-input"
            type="file"
            accept={isPhoto ? 'image/*' : '.pdf,application/pdf'}
            onChange={onReplace}
          />
          <span className="desktop-upload-preview-label">{isPhoto ? 'Image file' : 'PDF file'}</span>
          <button type="button" className="desktop-upload-preview-file" onClick={() => replacementInputRef.current?.click()}>
            <span className={`desktop-upload-preview-file-icon ${isPdf ? 'is-pdf' : ''}`}>
              {isPhoto ? <ImageIcon size={18} strokeWidth={1.8} /> : <FileText size={18} strokeWidth={1.8} />}
            </span>
            <span className="desktop-upload-preview-file-copy">
              <strong>{attachment.originalFileName || attachment.title}</strong>
              {fileSize ? <span>{fileSize}</span> : null}
            </span>
            <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>

          {isPhoto ? (
            <div className="desktop-upload-preview-media">
              <img src={attachment.previewUrl || attachment.photoDataUrl} alt="Selected photo preview" />
            </div>
          ) : (
            <div className="desktop-upload-preview-media desktop-upload-preview-pdf">
              {pdfPreviewUrl ? (
                <object data={`${pdfPreviewUrl}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" aria-label="Selected PDF preview">
                  <div className="desktop-upload-preview-fallback"><FileText size={42} /><span>PDF preview</span></div>
                </object>
              ) : (
                <div className="desktop-upload-preview-fallback"><FileText size={42} /><span>PDF preview</span></div>
              )}
            </div>
          )}

          <div className="desktop-upload-preview-meta">
            <span>
              {isPhoto ? <ImageIcon size={15} strokeWidth={1.8} /> : <FileText size={15} strokeWidth={1.8} />}
              {isPhoto ? `${attachment.mimeType?.split('/')[1]?.toUpperCase() || 'Image'} image` : 'PDF document'}
            </span>
            {dimensions ? <><i aria-hidden="true" /><span>{dimensions}</span></> : null}
            {fileSize ? <><i aria-hidden="true" /><span>{fileSize}</span></> : null}
          </div>

          <button type="button" className="desktop-upload-preview-submit" onClick={onSubmit}>Add to canvas</button>
        </div>
      </section>
    </div>
  );
};

const formatQuickAddFileSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const DesktopAddResourcesModal = ({
  attachments,
  linkPreviews = [],
  onClose,
  onRemoveAttachment,
  onRemoveLink,
  onSubmit,
}) => {
  const itemCount = attachments.length + linkPreviews.length;
  if (itemCount === 0) return null;

  return (
    <div className="desktop-add-resources-backdrop" role="presentation" onPointerDown={onClose}>
      <section
        className="desktop-add-resources-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-add-resources-title"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="desktop-add-resources-header">
          <h2 id="desktop-add-resources-title">Add</h2>
          <button type="button" className="desktop-add-resources-close" aria-label="Close add" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <p className="desktop-add-resources-subtitle">You can add multiple links, photos, and PDFs at once.</p>

        <div className="desktop-add-resources-list" aria-label="Selected resources">
          {linkPreviews.map((linkPreview) => (
            <article key={linkPreview.url} className="desktop-add-resource-item">
              <div
                className={`desktop-add-resource-thumb desktop-add-resource-link-thumb ${linkPreview.thumbnailUrl ? 'has-thumbnail' : ''}`}
                style={linkPreview.thumbnailUrl ? undefined : { background: linkPreview.visual }}
              >
                {linkPreview.thumbnailUrl ? <img src={linkPreview.thumbnailUrl} alt="" /> : null}
              </div>
              <div className="desktop-add-resource-copy">
                <div className="desktop-add-resource-kicker">
                  <img
                    className="desktop-add-resource-favicon"
                    src={`https://www.google.com/s2/favicons?domain=${linkPreview.domain}&sz=64`}
                    alt=""
                  />
                  <span>{linkPreview.domain}</span>
                </div>
                <strong>{String(linkPreview.customTitle || '').trim() || linkPreview.title || linkPreview.domain}</strong>
                <span>Saved from {linkPreview.domain}</span>
              </div>
              <button type="button" className="desktop-add-resource-remove" aria-label={`Remove ${linkPreview.domain}`} onClick={() => onRemoveLink(linkPreview.url)}>
                <X size={16} strokeWidth={2} />
              </button>
            </article>
          ))}

          {attachments.map((attachment) => {
            const isImage = attachment.uploadKind === 'image';
            const isPdf = attachment.uploadKind === 'pdf';
            const fileSize = formatQuickAddFileSize(attachment.size);
            const dimensions = isImage && Number.isFinite(attachment.photoWidth) && Number.isFinite(attachment.photoHeight)
              ? `${attachment.photoWidth} × ${attachment.photoHeight}`
              : '';
            const meta = [fileSize, dimensions || (isPdf ? 'PDF document' : attachment.uploadKind)]
              .filter(Boolean)
              .join('  ·  ');

            return (
              <article key={attachment.id} className="desktop-add-resource-item">
                <div className={`desktop-add-resource-thumb ${isPdf ? 'is-pdf' : ''}`}>
                  {isImage ? (
                    <img src={attachment.previewUrl || attachment.photoDataUrl} alt="" />
                  ) : (
                    <FileText size={34} strokeWidth={1.7} />
                  )}
                </div>
                <div className="desktop-add-resource-copy">
                  <div className="desktop-add-resource-kicker">
                    {isImage ? <ImageIcon size={15} strokeWidth={1.8} /> : <FileText size={15} strokeWidth={1.8} />}
                    <span>{isImage ? 'Photo' : isPdf ? 'PDF' : 'Document'}</span>
                  </div>
                  <strong>{attachment.originalFileName || attachment.title}</strong>
                  {meta ? <span>{meta}</span> : null}
                </div>
                <button
                  type="button"
                  className="desktop-add-resource-remove"
                  aria-label={`Remove ${attachment.originalFileName || attachment.title}`}
                  onClick={() => onRemoveAttachment(attachment.id)}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </article>
            );
          })}
        </div>

        <button type="button" className="desktop-add-resources-submit" onClick={onSubmit}>
          {itemCount > 1 ? `Add (${itemCount})` : 'Add to canvas'}
        </button>
      </section>
    </div>
  );
};

const ScheduleSection = ({
  section,
  appearance,
  language,
  labels,
  renderSlots,
  markerStyle,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskPointerDown,
  onTaskPointerMove,
  onTaskPointerUp,
  onTaskPointerCancel,
  draggedTaskId,
  isDragOver,
}) => {
  const pillStyle = getDesktopSectionPillStyle(section, appearance);
  const t = getTranslationsForLanguage(language);
  const desktopRowCount = Math.max(2, Math.ceil(renderSlots.length / 2));
  const timelineColumnMinHeight = (desktopRowCount * DESKTOP_SLOT_MIN_HEIGHT) + ((desktopRowCount - 1) * DESKTOP_SLOT_GAP);

  return (
    <section style={{ borderBottom: '1px solid var(--desktop-divider)', background: 'var(--desktop-section-bg)' }}>
      <div style={{ width: 'min(1008px, calc(100% - 72px))', margin: '0 auto', padding: '22px 0 24px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 72, padding: '6px 14px', borderRadius: 999, fontFamily: 'DM Serif Display, serif', fontSize: 14, fontStyle: 'italic', ...pillStyle }}>{t[section.labelKey]}</span>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr)', gap: 24, marginTop: 18, alignItems: 'stretch' }}>
          <div style={{ position: 'relative', minHeight: timelineColumnMinHeight, height: '100%' }}>
            <div style={{ color: 'var(--desktop-root-text)', fontSize: 15, fontWeight: 500 }}>{section.start}</div>
            <div style={{ position: 'absolute', left: 5, top: DESKTOP_TIME_AXIS_LINE_TOP, bottom: DESKTOP_TIME_AXIS_LINE_BOTTOM, width: 1, background: 'var(--desktop-time-axis-line)' }} />
            {markerStyle ? <div style={{ position: 'absolute', left: 2, width: DESKTOP_TIME_MARKER_SIZE, height: DESKTOP_TIME_MARKER_SIZE, borderRadius: '50%', background: 'var(--desktop-accent)', ...markerStyle }} /> : null}
            <div style={{ position: 'absolute', left: 0, bottom: 0, color: 'var(--desktop-root-text)', fontSize: 15, fontWeight: 500 }}>{section.end}</div>
          </div>
          <div
            data-desktop-block-id={section.mobileId}
            className={`desktop-schedule-task-grid ${isDragOver ? 'is-drag-over' : ''}`}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: DESKTOP_SLOT_GAP, alignItems: 'stretch' }}
          >
            {renderSlots.map((item, slotIndex) => (
              <div
                key={`${section.mobileId}-${slotIndex}`}
                data-desktop-slot-id={`${section.mobileId}-${slotIndex}`}
                data-desktop-slot-section={section.mobileId}
                data-desktop-slot-index={slotIndex}
                className="desktop-schedule-slot"
              >
                {item.type === 'task' ? (
                  <div data-desktop-layout-id={`task-${item.task.id}`}>
                <TaskCard
                  task={item.task}
                  appearance={appearance}
                  labels={labels}
                  isDragging={draggedTaskId === item.task.id}
                      onClick={(event) => onTaskClick(item.task, event)}
                  onEdit={() => onTaskEdit(item.task)}
                  onDelete={() => onTaskDelete(item.task)}
                      onPointerDown={(event) => onTaskPointerDown(item.task, event)}
                      onPointerMove={(event) => onTaskPointerMove(item.task, event)}
                      onPointerUp={(event) => onTaskPointerUp(item.task, event)}
                      onPointerCancel={(event) => onTaskPointerCancel(item.task, event)}
                      editLabel={labels.edit}
                      deleteLabel={labels.delete}
                    />
                  </div>
                ) : item.type === 'placeholder' ? (
                  <div data-desktop-layout-id="desktop-drag-placeholder" className="desktop-drag-placeholder" aria-hidden="true" />
                ) : (
                  <div className="desktop-empty-slot" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

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
}) => (
  <div style={{ width: layoutWidth, minHeight: canvasHeight, height: canvasHeight, margin: '0 auto', position: 'relative' }}>
    <svg className="desktop-canvas-connection-layer" aria-hidden="true">
      {connectionLinks.map((link) => {
        const connectionKey = `${link.sourceId}->${link.targetId}`;
        const path = getDesktopCanvasConnectionPath(link.from, link.to);
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
          d={getDesktopCanvasConnectionPath(connectionDraft.from, connectionDraft.to)}
        />
      ) : null}
    </svg>
    {connectionLinks.map((link) => {
      const connectionKey = `${link.sourceId}->${link.targetId}`;
      if (selectedConnectionKey !== connectionKey) return null;
      const midpoint = getDesktopCanvasConnectionMidpoint(link.from, link.to);
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
                <GroupedTaskCard
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
      )})
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

const CollectionItemPreview = ({ task, appearance, labels, compact = false }) => {
  const { displayTitle } = getTaskCardPresentation(task, labels || {});
  const sourceMeta = getPackItemSourceMeta(task, labels || {});
  const cardType = normalizeCardType(task?.cardType);

  return (
    <div className={`desktop-collection-item-preview ${compact ? 'is-compact' : ''}`}>
      <span className="desktop-collection-item-icon">
        <PackItemSourceIcon task={task} appearance={appearance} labels={labels} />
      </span>
      <div className="desktop-collection-item-copy">
        <span className="desktop-collection-item-title">{displayTitle}</span>
        <span className="desktop-collection-item-subtitle">
          {formatDesktopGroupChipLabel(cardType)} / {sourceMeta.label}
        </span>
      </div>
    </div>
  );
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
const InlineMiniCalendar = ({
  language,
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
}) => {
  const [calendarOffset, setCalendarOffset] = useState(0);
  const locale = getLocaleForLanguage(language);
  const calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + calendarOffset, 1);
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthLabel = monthStart.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
  const startOffset = monthStart.getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const trailingCells = Math.max(0, 42 - startOffset - daysInMonth);
  const desktopCalendarCellSize = 32;
  const desktopCalendarGap = 6;
  const calendarWeekdayLabels = getCalendarWeekdayLabels(language);
  const normalizedMinDate = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
  const normalizedMaxDate = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
  const isAtMinMonth = normalizedMinDate
    ? monthStart.getFullYear() === normalizedMinDate.getFullYear() && monthStart.getMonth() === normalizedMinDate.getMonth()
    : false;
  const isAtMaxMonth = normalizedMaxDate
    ? monthStart.getFullYear() === normalizedMaxDate.getFullYear() && monthStart.getMonth() === normalizedMaxDate.getMonth()
    : false;

  return (
    <div style={{ width: 'fit-content', maxWidth: '100%', marginBottom: 16, padding: '4px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          disabled={isAtMinMonth}
          onClick={() => setCalendarOffset((prev) => prev - 1)}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--desktop-panel-close-bg)', color: isAtMinMonth ? 'var(--desktop-muted-subtle)' : 'var(--desktop-root-text)', cursor: isAtMinMonth ? 'default' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {'<'}
        </button>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, fontStyle: 'italic' }}>{monthLabel}</span>
        <button
          type="button"
          disabled={isAtMaxMonth}
          onClick={() => setCalendarOffset((prev) => prev + 1)}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--desktop-panel-close-bg)', color: isAtMaxMonth ? 'var(--desktop-muted-subtle)' : 'var(--desktop-root-text)', cursor: isAtMaxMonth ? 'default' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {'>'}
        </button>
      </div>
      <div style={{ display: 'grid', width: 'fit-content', maxWidth: '100%', gridTemplateColumns: `repeat(7, ${desktopCalendarCellSize}px)`, gap: desktopCalendarGap }}>
        {calendarWeekdayLabels.map((label, index) => (
          <div key={`${label}-${index}`} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--desktop-muted-subtle)' }}>{label}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, index) => <div key={`empty-${index}`} />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
          const inRange = (!normalizedMinDate || cellDate >= normalizedMinDate) && (!normalizedMaxDate || cellDate <= normalizedMaxDate);
          const currentSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const selected = sameDay(cellDate, currentSelectedDate);
          const today = sameDay(cellDate, getLogicalToday());

          return (
            <button
              key={day}
              type="button"
              disabled={!inRange}
              onClick={() => {
                if (!inRange) return;
                onSelectDate(cellDate);
              }}
              style={{
                width: desktopCalendarCellSize,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                border: today && !selected ? '1px solid var(--desktop-accent)' : 'none',
                background: selected ? 'var(--desktop-active-date-bg)' : 'transparent',
                color: selected ? '#fff' : today ? 'var(--desktop-accent)' : inRange ? 'var(--desktop-root-text)' : 'var(--desktop-disabled-text)',
                fontSize: 14,
                fontWeight: selected || today ? 700 : 500,
                cursor: inRange ? 'pointer' : 'default',
              }}
            >
              {day}
            </button>
          );
        })}
        {Array.from({ length: trailingCells }).map((_, index) => <div key={`trail-${index}`} />)}
      </div>
    </div>
  );
};

const AddPanel = ({
  open,
  language,
  inputText,
  setInputText,
  fileAttachments,
  onAddFiles,
  onRemoveFile,
  onShowToast,
  onClose,
  onSubmit,
}) => {
  const createInitialConvertState = () => ({
    selectedFile: null,
    status: 'idle',
    markdown: '',
    error: '',
  });
  const [mode, setMode] = useState('add');
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [isConvertDragActive, setIsConvertDragActive] = useState(false);
  const [convertState, setConvertState] = useState(createInitialConvertState);
  const fileInputRef = useRef(null);
  const convertFileInputRef = useRef(null);
  const previousModeRef = useRef('add');
  const t = getTranslationsForLanguage(language);

  const resetConvertState = useCallback(() => {
    console.debug('[add-panel] resetConvertState invoked');
    setIsConvertDragActive(false);
    setConvertState((current) => {
      const isAlreadyInitial = (
        current.selectedFile === null
        && current.status === 'idle'
        && !current.markdown
        && !current.error
      );
      console.debug('[add-panel] resetConvertState setConvertState', {
        current,
        isAlreadyInitial,
      });
      return isAlreadyInitial ? current : createInitialConvertState();
    });
    if (convertFileInputRef.current) {
      convertFileInputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    console.debug('[add-panel] open reset effect', {
      open,
      mode,
      isFileDragActive,
      convertState,
    });
    if (!open) {
      console.debug('[add-panel] open reset effect setState', {
        nextMode: 'add',
        nextIsFileDragActive: false,
        action: 'resetConvertState',
      });
      setMode('add');
      setIsFileDragActive(false);
      resetConvertState();
    }
  }, [open, mode, isFileDragActive, convertState, resetConvertState]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    console.debug('[add-panel] mode sync effect', {
      previousMode,
      mode,
      convertStatus: convertState.status,
      hasMarkdown: Boolean(convertState.markdown),
      error: convertState.error,
    });
    if (previousMode === 'convert' && mode !== 'convert') {
      console.debug('[add-panel] mode sync effect setState', {
        action: 'resetConvertState',
      });
      resetConvertState();
    }
    previousModeRef.current = mode;
  }, [mode, convertState.status, convertState.markdown, convertState.error, resetConvertState]);

  const handleConvertFiles = (files) => {
    const selectedFiles = Array.from(files || []);
    const firstSupportedFile = selectedFiles.find((file) => isSupportedConvertFile(file));
    if (!firstSupportedFile) {
      setConvertState({
        selectedFile: null,
        status: 'error',
        markdown: '',
        error: 'Please choose a PDF, DOCX, HTML, or TXT-based file.',
      });
      return;
    }

    setConvertState({
      selectedFile: firstSupportedFile,
      status: 'ready',
      markdown: '',
      error: '',
    });
  };

  const handleUseMarkdownInAdd = useCallback((markdown) => {
    const nextMarkdown = String(markdown || '').trim();
    console.debug('[add-panel] handleUseMarkdownInAdd', {
      markdownLength: nextMarkdown.length,
      willSetInputText: Boolean(nextMarkdown),
    });
    if (!nextMarkdown) return;
    setInputText(nextMarkdown);
    onShowToast?.('Markdown added to draft');
    setMode('add');
  }, [onShowToast, setInputText]);

  const handleRunConvert = async () => {
    if (!convertState.selectedFile || convertState.status === 'converting') return;

    setConvertState((current) => ({
      ...current,
      status: 'converting',
      markdown: '',
      error: '',
    }));

    try {
      const markdown = await convertDocumentFileToMarkdown(convertState.selectedFile);
      setConvertState((current) => ({
        ...current,
        status: 'success',
        markdown,
        error: '',
      }));
      handleUseMarkdownInAdd(markdown);
    } catch (error) {
      setConvertState((current) => ({
        ...current,
        status: 'error',
        markdown: '',
        error: error instanceof Error ? error.message : 'Unable to convert this file.',
      }));
    }
  };

  const convertActionLabel = (() => {
    if (convertState.status === 'converting') return 'Converting...';
    if (convertState.status === 'success') return 'Converted';
    if (convertState.status === 'error' && convertState.selectedFile) return 'Retry';
    return 'Convert';
  })();

  const handlePrimaryConvertAction = () => {
    handleRunConvert();
  };

  if (!open) return null;

  return (
    <div role="dialog" className="desktop-add-panel">
      <div className="desktop-add-panel-header">
        <div className="desktop-add-panel-segmented" role="tablist" aria-label="Panel mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'add'}
            className={`desktop-add-panel-segment ${mode === 'add' ? 'active' : ''}`}
            onClick={() => setMode('add')}
          >
            {t.addPanelAdd || 'Add'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'convert'}
            className={`desktop-add-panel-segment ${mode === 'convert' ? 'active' : ''}`}
            onClick={() => setMode('convert')}
          >
            {t.addPanelConvert || 'Convert'}
          </button>
        </div>
        <button type="button" onClick={onClose} aria-label={t.close} className="desktop-add-panel-close"><CloseIcon /></button>
      </div>
      <div className="desktop-add-panel-body">
        <div className="desktop-add-panel-mode-content">
          {mode === 'add' ? (
            <>
              <div className="desktop-add-panel-copy">
                <h2 className="desktop-add-panel-title">{t.addPanelTitle || 'Add to workspace'}</h2>
                <p className="desktop-add-panel-support">{t.addPanelSupport || 'Type a note, paste a link, or drop an image'}</p>
              </div>
              <div
                className={`desktop-add-panel-surface ${isFileDragActive ? 'drag-active' : ''}`}
                onDragEnter={(event) => {
                  if (!hasSupportedUploadFiles(event.dataTransfer)) return;
                  event.preventDefault();
                  setIsFileDragActive(true);
                }}
                onDragOver={(event) => {
                  if (!hasSupportedUploadFiles(event.dataTransfer)) return;
                  event.preventDefault();
                  if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'copy';
                  }
                  if (!isFileDragActive) {
                    setIsFileDragActive(true);
                  }
                }}
                onDragLeave={(event) => {
                  if (!hasSupportedUploadFiles(event.dataTransfer)) return;
                  event.preventDefault();
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsFileDragActive(false);
                  }
                }}
                onDrop={(event) => {
                  if (!hasSupportedUploadFiles(event.dataTransfer)) return;
                  event.preventDefault();
                  setIsFileDragActive(false);
                  const files = Array.from(event.dataTransfer?.files || []);
                  if (files.length) {
                    onAddFiles?.(files);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SUPPORTED_UPLOAD_ACCEPT}
                  multiple
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    if (files.length) {
                      onAddFiles?.(files);
                    }
                    event.target.value = '';
                  }}
                />
                {fileAttachments.length ? (
                  <div className="desktop-add-panel-attachment-strip">
                    {fileAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className={`desktop-add-panel-attachment ${attachment.uploadKind === 'image' ? 'image' : 'document'}`}
                      >
                        {attachment.uploadKind === 'image' ? (
                          <img
                            src={attachment.previewUrl || attachment.photoDataUrl}
                            alt={attachment.title}
                            draggable={false}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="desktop-add-panel-attachment-content">
                            <div className={`desktop-add-panel-attachment-badge ${attachment.uploadKind}`}>
                              {attachment.uploadKind === 'pdf' ? 'PDF' : 'DOC'}
                            </div>
                            <div className="desktop-add-panel-attachment-copy">
                              <span className="desktop-add-panel-attachment-title">{attachment.title}</span>
                              <span className="desktop-add-panel-attachment-kind">{attachment.uploadKind}</span>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          aria-label={`Remove ${attachment.title}`}
                          onClick={() => onRemoveFile?.(attachment.id)}
                          className="desktop-add-panel-attachment-remove"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <textarea
                  autoFocus
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      onSubmit();
                    }
                  }}
                  placeholder={t.placeholder}
                  className="desktop-add-panel-textarea"
                />
                {isFileDragActive ? (
                  <div className="desktop-add-panel-drop-overlay">
                    {t.dropToAttach || 'Drop PDF, Word, or image to attach'}
                  </div>
                ) : null}
              </div>
              <div className="desktop-add-panel-footer">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="desktop-add-panel-files-button"
                >
                  <AttachFileIcon />
                  <span>{t.document || 'Files'}</span>
                </button>
                <button type="button" onClick={onSubmit} className="desktop-add-panel-submit-button">{t.add || 'Add'}</button>
              </div>
            </>
          ) : (
            <>
              <div className="desktop-add-panel-copy">
                <h2 className="desktop-add-panel-title">{t.convertPanelTitle || 'Convert to Markdown'}</h2>
                <p className="desktop-add-panel-support">{t.convertPanelSupport || 'Drop a PDF, DOCX, HTML, or TXT-based file to turn it into reusable markdown'}</p>
              </div>
              <div
                className={`desktop-convert-panel-dropzone ${isConvertDragActive ? 'drag-active' : ''}`}
                onClick={() => convertFileInputRef.current?.click()}
                onDragEnter={(event) => {
                  if (!hasSupportedConvertFiles(event.dataTransfer)) return;
                  event.preventDefault();
                  setIsConvertDragActive(true);
                }}
                onDragOver={(event) => {
                  if (!hasSupportedConvertFiles(event.dataTransfer)) return;
                  event.preventDefault();
                  if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'copy';
                  }
                  if (!isConvertDragActive) {
                    setIsConvertDragActive(true);
                  }
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsConvertDragActive(false);
                  }
                }}
                onDrop={(event) => {
                  const files = Array.from(event.dataTransfer?.files || []);
                  if (!files.some((file) => isSupportedConvertFile(file))) return;
                  event.preventDefault();
                  setIsConvertDragActive(false);
                  handleConvertFiles(files);
                }}
              >
                <input
                  ref={convertFileInputRef}
                  type="file"
                  accept={SUPPORTED_CONVERT_ACCEPT}
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    handleConvertFiles(event.target.files || []);
                    event.target.value = '';
                  }}
                />
                <div className="desktop-convert-panel-icon-shell">
                  <ConvertUploadIcon />
                </div>
                <div className="desktop-convert-panel-drop-copy">
                  <div className="desktop-convert-panel-drop-title">
                    {convertState.selectedFile?.name || (t.convertPanelSupport || 'Click or drag a PDF, DOCX, HTML, or TXT-based file here')}
                  </div>
                  {convertState.selectedFile ? (
                    <div className="desktop-convert-panel-drop-subtitle">
                      {convertState.status === 'success'
                        ? 'Markdown added to Add so you can review and save'
                        : convertState.status === 'converting'
                          ? 'Extracting text and formatting markdown'
                          : 'Ready to convert'}
                    </div>
                  ) : null}
                </div>
              </div>
              {convertState.error ? (
                <div className="desktop-convert-panel-feedback error">{convertState.error}</div>
              ) : null}
              {convertState.markdown ? (
                <div className="desktop-convert-panel-preview">
                  <div className="desktop-convert-panel-preview-header">
                    <span>Markdown preview</span>
                    <span>{convertState.markdown.length} chars</span>
                  </div>
                  <textarea
                    value={convertState.markdown}
                    readOnly
                    className="desktop-convert-panel-preview-textarea"
                  />
                </div>
              ) : null}
              <div className="desktop-convert-panel-meta">
                <span>Supports PDF, DOCX, HTML, TXT</span>
                <span>Up to 10MB</span>
              </div>
              <div className="desktop-convert-panel-actions">
                <button
                  type="button"
                  onClick={() => convertFileInputRef.current?.click()}
                  className="desktop-add-panel-files-button"
                >
                  {convertState.selectedFile ? 'Choose another file' : 'Choose file'}
                </button>
                <button
                  type="button"
                  onClick={handlePrimaryConvertAction}
                  disabled={!convertState.selectedFile || convertState.status === 'converting' || convertState.status === 'success'}
                  className="desktop-add-panel-submit-button"
                >
                  {convertActionLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


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

const normalizeDesktopAppearancePreference = (value) => (
  ['light', 'dark'].includes(value) ? value : 'dark'
);

function App() {
  const user = MOCK_USER;
  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = parseSharedSelectedDate(localStorage.getItem(SHARED_SELECTED_DATE_KEY));
    return savedDate || getLogicalToday();
  });
  const [language, setLanguage] = useState(getInitialLanguage);
  const [appearancePreference, setAppearancePreferenceState] = useState(() => (
    normalizeDesktopAppearancePreference(localStorage.getItem(DESKTOP_APPEARANCE_KEY))
  ));
  const setAppearancePreference = useCallback((value) => {
    setAppearancePreferenceState(normalizeDesktopAppearancePreference(value));
  }, []);
  const appearance = appearancePreference;
  const [workspaces, setWorkspaces] = useState(() => {
    try {
      return normalizeDesktopWorkspaces(JSON.parse(localStorage.getItem(DESKTOP_WORKSPACES_KEY) || 'null'));
    } catch (_) {
      return getDefaultDesktopWorkspaces();
    }
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    if (localStorage.getItem(DESKTOP_WORKSPACE_SCHEMA_KEY) !== DESKTOP_WORKSPACE_SCHEMA_VERSION) {
      return DEFAULT_DESKTOP_WORKSPACE_ID;
    }
    const savedWorkspaceId = localStorage.getItem(DESKTOP_ACTIVE_WORKSPACE_KEY);
    if (!savedWorkspaceId || savedWorkspaceId === LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID) {
      return DEFAULT_DESKTOP_WORKSPACE_ID;
    }
    return savedWorkspaceId;
  });
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [isWorkspaceNameEditing, setIsWorkspaceNameEditing] = useState(false);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState('');
  const [desktopViewMode, setDesktopViewMode] = useState(DESKTOP_VIEW_MODES.CANVAS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileOpen, setProfileOpenState] = useState(false);
  const setProfileOpen = useCallback((val) => {
    sessionStorage.setItem('shared_profile_open', String(Boolean(val)));
    setProfileOpenState(val);
  }, []);
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
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [desktopSelectionRect, setDesktopSelectionRect] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [isCanvasFileDragActive, setIsCanvasFileDragActive] = useState(false);
  const [desktopDragDayFeedback, setDesktopDragDayFeedback] = useState(null);
  const [desktopDragDayZones, setDesktopDragDayZones] = useState(null);
  const [desktopDragDayConfirming, setDesktopDragDayConfirming] = useState(false);
  const [desktopDragOverlapTargetId, setDesktopDragOverlapTargetId] = useState(null);
  const [desktopDragOverlayActive, setDesktopDragOverlayActive] = useState(false);
  const [desktopDragOverlaySnapshot, setDesktopDragOverlaySnapshot] = useState(null);
  const [historyOpen, setHistoryOpenState] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingGroupPrompt, setPendingGroupPrompt] = useState(null);
  const [pendingGroupName, setPendingGroupName] = useState('');
  const [activeGroupView, setActiveGroupView] = useState(null);
  const [pendingCanvasDeletion, setPendingCanvasDeletion] = useState(null);
  const [workspaceActionMenu, setWorkspaceActionMenu] = useState(null);
  const [pendingWorkspaceDeletion, setPendingWorkspaceDeletion] = useState(null);
  const workspaceMenuRef = useRef(null);
  const workspaceNameInputRef = useRef(null);
  const quickAddMenuRef = useRef(null);
  const quickAddTextareaRef = useRef(null);
  const quickAddFileInputRef = useRef(null);
  const quickAddPhotoInputRef = useRef(null);
  const setHistoryOpen = useCallback((val) => {
    sessionStorage.setItem('shared_history_open', String(Boolean(val)));
    setHistoryOpenState(val);
  }, []);
  const [tasks, setTasks] = useSyncedTodos({
    normalizeTodo: normalizeTask,
  });
  const t = useMemo(() => getTranslationsForLanguage(language), [language]);
  const userProfile = useMemo(() => getUserProfile(user), [user]);
  const currentWorkspaceTasks = useMemo(
    () => tasks.filter((task) => taskBelongsToWorkspace(task, activeWorkspaceId)),
    [activeWorkspaceId, tasks],
  );
  const selectedDateRef = useRef(selectedDate);
  const tasksRef = useRef(currentWorkspaceTasks);
  const desktopDragViewportRef = useRef(null);
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
  const selectedTaskIdsRef = useRef(new Set());
  const previousUploadedFileKeysRef = useRef(new Set());
  const selectedDayEntriesRef = useRef([]);
  const desktopSelectionStateRef = useRef({ pointerId: null, origin: null });
  const dragOverSectionRef = useRef(null);
  const dragOverSlotRef = useRef(null);
  const desktopDayFlipTimerRef = useRef(null);
  const desktopDayFlipDirectionRef = useRef(0);
  const desktopDayFlipCooldownUntilRef = useRef(0);
  const desktopDragDayEntryPointXRef = useRef(null);
  const desktopDragDayIsReadyRef = useRef(false);
  const desktopDragDayFeedbackRef = useRef(null);
  const desktopDragDayZonesRef = useRef(null);
  const desktopDragOverlapTargetIdRef = useRef(null);
  const desktopDragOverlapRafRef = useRef(null);
  const desktopDragOverlapPendingRef = useRef(null);
  const suppressTaskClickRef = useRef(null);
  const suppressAllTaskClicksUntilRef = useRef(0);
  const suppressTaskClickTimeoutRef = useRef(null);
  const desktopLayoutRectsRef = useRef(new Map());
  const desktopCanvasContentRef = useRef(null);
  const viewportContainerRef = useRef(null);
  const searchDragSeparateRef = useRef(false);
  const editCopyResetTimerRef = useRef(null);
  const canvasFileDragDepthRef = useRef(0);
  const [viewport, setViewport] = useState({ panX: 0, panY: 0, zoom: DESKTOP_CANVAS_DEFAULT_ZOOM });
  const viewportRef = useRef({ panX: 0, panY: 0, zoom: DESKTOP_CANVAS_DEFAULT_ZOOM });
  const [desktopCanvasPanReady, setDesktopCanvasPanReady] = useState(false);
  const [desktopCanvasPanActive, setDesktopCanvasPanActive] = useState(false);
  const [desktopZoomMenuOpen, setDesktopZoomMenuOpen] = useState(false);
  const [desktopConnectionDraft, setDesktopConnectionDraft] = useState(null);
  const [selectedDesktopConnectionKey, setSelectedDesktopConnectionKey] = useState(null);
  const desktopConnectionDraftRef = useRef(null);
  const desktopCanvasPanStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);
  useEffect(() => {
    sessionStorage.setItem('shared_profile_open', 'false');
    sessionStorage.setItem('shared_history_open', 'false');
  }, []);
  useEffect(() => {
    tasksRef.current = currentWorkspaceTasks;
  }, [currentWorkspaceTasks]);
  useEffect(() => {
    const nextKeys = new Set(
      tasks
        .map((task) => task.uploadedFileStorageKey)
        .filter((storageKey) => typeof storageKey === 'string' && storageKey.trim())
    );
    const previousKeys = previousUploadedFileKeysRef.current;
    previousKeys.forEach((storageKey) => {
      if (!nextKeys.has(storageKey)) {
        deleteUploadedFileBlob(storageKey).catch((error) => {
          console.error('Failed to delete uploaded file blob:', error);
        });
      }
    });
    previousUploadedFileKeysRef.current = nextKeys;
  }, [tasks]);
  useEffect(() => {
    const existingIds = new Set(currentWorkspaceTasks.map((task) => task.id));
    console.debug('[desktop-workspace] prune selected tasks effect', {
      taskCount: currentWorkspaceTasks.length,
      taskIds: currentWorkspaceTasks.map((task) => task.id),
    });
    setSelectedTaskIds((current) => {
      const next = current.filter((taskId) => existingIds.has(taskId));
      const changed = next.length !== current.length;
      console.debug('[desktop-workspace] prune selected tasks setState', {
        previous: current,
        next,
        changed,
      });
      return changed ? next : current;
    });
  }, [currentWorkspaceTasks]);
  useEffect(() => {
    if (!workspaceMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target)) {
        setWorkspaceMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setWorkspaceMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [workspaceMenuOpen]);
  useEffect(() => {
    if (!workspaceMenuOpen) {
      setWorkspaceActionMenu(null);
    }
  }, [workspaceMenuOpen]);
  useEffect(() => {
    if (!workspaceActionMenu) return undefined;
    const closeActionMenu = () => setWorkspaceActionMenu(null);
    window.addEventListener('resize', closeActionMenu);
    window.addEventListener('scroll', closeActionMenu, true);
    return () => {
      window.removeEventListener('resize', closeActionMenu);
      window.removeEventListener('scroll', closeActionMenu, true);
    };
  }, [workspaceActionMenu]);
  useEffect(() => {
    if (!isWorkspaceNameEditing) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      workspaceNameInputRef.current?.focus();
      workspaceNameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isWorkspaceNameEditing]);
  useEffect(() => {
    selectedTaskIdsRef.current = new Set(selectedTaskIds);
  }, [selectedTaskIds]);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);
  useEffect(() => {
    if (!desktopZoomMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest('.desktop-canvas-zoom-toolbar')) return;
      setDesktopZoomMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDesktopZoomMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [desktopZoomMenuOpen]);
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
    if (desktopDayFlipTimerRef.current !== null) {
      window.clearTimeout(desktopDayFlipTimerRef.current);
      desktopDayFlipTimerRef.current = null;
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(SHARED_SELECTED_DATE_KEY, dateKey(selectedDate));
  }, [selectedDate]);
  useEffect(() => {
    localStorage.setItem(DESKTOP_LANGUAGE_KEY, language);
  }, [language]);
  useEffect(() => {
    localStorage.setItem(DESKTOP_APPEARANCE_KEY, appearancePreference);
  }, [appearancePreference]);
  useEffect(() => {
    localStorage.setItem(DESKTOP_WORKSPACES_KEY, JSON.stringify(workspaces));
    localStorage.setItem(DESKTOP_WORKSPACE_SCHEMA_KEY, DESKTOP_WORKSPACE_SCHEMA_VERSION);
  }, [workspaces]);
  useEffect(() => {
    const hasActiveWorkspace = workspaces.some((workspace) => workspace.id === activeWorkspaceId);
    if (hasActiveWorkspace) {
      localStorage.setItem(DESKTOP_ACTIVE_WORKSPACE_KEY, activeWorkspaceId);
      return;
    }
    const fallbackWorkspaceId = workspaces.some((workspace) => workspace.id === DEFAULT_DESKTOP_WORKSPACE_ID)
      ? DEFAULT_DESKTOP_WORKSPACE_ID
      : (workspaces[0]?.id || DEFAULT_DESKTOP_WORKSPACE_ID);
    setActiveWorkspaceId(fallbackWorkspaceId);
    localStorage.setItem(DESKTOP_ACTIVE_WORKSPACE_KEY, fallbackWorkspaceId);
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === DESKTOP_APPEARANCE_KEY && e.newValue) {
        setAppearancePreference(normalizeDesktopAppearancePreference(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const logicalToday = getLogicalToday();
  const todaySelected = sameDay(selectedDate, logicalToday);
  const currentBlock = currentSection(currentTime);

  const fitDesktopCanvas = useCallback(() => {
    const container = viewportContainerRef.current;
    if (!container) return;
    const vw = container.clientWidth;
    const zoom = clampDesktopCanvasScale(Math.min(vw / DESKTOP_MAIN_CONTENT_MAX_WIDTH, DESKTOP_CANVAS_DEFAULT_ZOOM));
    const contentW = DESKTOP_MAIN_CONTENT_MAX_WIDTH;
    const nextPanX = vw > contentW ? (vw - contentW) / 2 : 0;
    const nextVp = { panX: nextPanX, panY: 0, zoom };
    viewportRef.current = nextVp;
    setViewport(nextVp);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const attemptFit = () => {
      if (!isMounted) return;
      if (viewportContainerRef.current && viewportContainerRef.current.clientWidth > 0) {
        if (viewportRef.current.panX === 0 && viewportRef.current.panY === 0) {
          fitDesktopCanvas();
        }
      } else {
        setTimeout(attemptFit, 50);
      }
    };
    attemptFit();
    return () => { isMounted = false; };
  }, [fitDesktopCanvas]);

  const getCanvasPointFromClient = useCallback((clientX, clientY) => {
    const container = viewportContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const appScale = viewportRef.current.zoom || DESKTOP_APP_WINDOW_SCALE;
    return screenToCanvas(
      (clientX - rect.left) / appScale,
      (clientY - rect.top) / appScale,
      viewportRef.current,
    );
  }, []);

  const getDragCanvasPointFromClient = useCallback((clientX, clientY) => {
    const rect = desktopDragContainerRectRef.current;
    if (rect) {
      const appScale = viewportRef.current.zoom || DESKTOP_APP_WINDOW_SCALE;
      return screenToCanvas(
        (clientX - rect.left) / appScale,
        (clientY - rect.top) / appScale,
        viewportRef.current,
      );
    }
    return getCanvasPointFromClient(clientX, clientY);
  }, [getCanvasPointFromClient]);

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

  const updateDesktopSelectionFromRect = useCallback((selectionRect) => {
    const nextSelectedTaskIds = selectedDayEntriesRef.current.flatMap((entry) => {
      const entryRect = {
        x: entry.x,
        y: entry.y,
        width: DESKTOP_CANVAS_CARD_WIDTH,
        height: getDesktopCanvasEntryHeight(entry),
      };

      return doDesktopRectsIntersect(selectionRect, entryRect)
        ? getDesktopCanvasEntryTaskIds(entry)
        : [];
    });

    setSelectedTaskIds([...new Set(nextSelectedTaskIds)]);
  }, []);

  // Clamp panX/panY so the canvas content is always at least MIN_VISIBLE px
  // inside the viewport — prevents tasks from floating completely off-screen.
  const clampViewportPan = useCallback((vp) => {
    const container = viewportContainerRef.current;
    if (!container) return vp;
    const MIN_VISIBLE = 128; // px — minimum overlap required on each axis
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const contentW = DESKTOP_MAIN_CONTENT_MAX_WIDTH;
    // Horizontal: canvas right edge must be at least MIN_VISIBLE from the left;
    //             canvas left edge must be at most (cw - MIN_VISIBLE) from the left.
    const minPanX = MIN_VISIBLE - contentW;  // canvas almost entirely right of viewport
    const maxPanX = cw - MIN_VISIBLE;         // canvas almost entirely left of viewport
    // Vertical: keep top of canvas reachable (panY should not exceed containerHeight - MIN_VISIBLE).
    //           Infinite height downward is fine, but don't push top too far down.
    const minPanY = -(ch * 4);               // generous — allow lots of vertical canvas
    const maxPanY = ch - MIN_VISIBLE;
    return {
      panX: Math.min(maxPanX, Math.max(minPanX, vp.panX)),
      panY: Math.min(maxPanY, Math.max(minPanY, vp.panY)),
      zoom: vp.zoom,
    };
  }, []);

  // Zoom only changes the canvas background density. Cards keep fixed screen
  // size and fixed canvas coordinates, so groups do not drift when zooming.
  const updateDesktopCanvasZoomAnchored = useCallback((nextZoom, anchor) => {
    const current = viewportRef.current;
    const clampedZoom = clampDesktopCanvasScale(Number(nextZoom.toFixed(3)));
    if (Math.abs(clampedZoom - current.zoom) < 0.001) return;

    const nextVp = clampViewportPan({ ...current, zoom: clampedZoom });
    viewportRef.current = nextVp;
    setViewport(nextVp);
  }, [clampViewportPan]);

  // Zoom around the visible viewport center so toolbar buttons and shortcuts
  // keep the current canvas focus in place.
  const updateDesktopCanvasZoom = useCallback((nextZoom) => {
    const container = viewportContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    updateDesktopCanvasZoomAnchored(nextZoom, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
  }, [updateDesktopCanvasZoomAnchored]);

  const handleDesktopCanvasWheel = useCallback((event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    updateDesktopCanvasZoomAnchored(
      viewportRef.current.zoom + (direction * DESKTOP_CANVAS_SCALE_STEP),
      { clientX: event.clientX, clientY: event.clientY },
    );
  }, [updateDesktopCanvasZoomAnchored]);

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
    setSelectedTaskIds([]);
  }, [desktopCanvasPanReady, getCanvasPointFromClient]);

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
  }, [clampViewportPan, desktopCanvasPanActive, getCanvasPointFromClient, updateDesktopSelectionFromRect]);

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
  }, []);
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
  }, [activeGroupView, deleteDesktopConnection, editingTaskId, fitDesktopCanvas, panelOpen, selectedDesktopConnectionKey]);
  const handleDesktopZoomPresetSelect = useCallback((preset) => {
    if (preset === 'in') {
      updateDesktopCanvasZoom(viewportRef.current.zoom + DESKTOP_CANVAS_SCALE_STEP);
    } else if (preset === 'out') {
      updateDesktopCanvasZoom(viewportRef.current.zoom - DESKTOP_CANVAS_SCALE_STEP);
    } else if (preset === 'fit') {
      fitDesktopCanvas();
    } else if (typeof preset === 'number') {
      updateDesktopCanvasZoom(preset);
    }
    setDesktopZoomMenuOpen(false);
  }, [fitDesktopCanvas, updateDesktopCanvasZoom]);

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

  const resetDesktopDragInteraction = useCallback(() => {
    if (desktopDayFlipTimerRef.current !== null) {
      window.clearTimeout(desktopDayFlipTimerRef.current);
      desktopDayFlipTimerRef.current = null;
    }
    desktopDayFlipDirectionRef.current = 0;
    desktopDragDayEntryPointXRef.current = null;
    desktopDragDayIsReadyRef.current = false;
    desktopDragDayFeedbackRef.current = null;
    desktopDragDayZonesRef.current = null;
    setDesktopDragDayFeedback(null);
    setDesktopDragDayZones(null);
    setDesktopDragDayConfirming(false);

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

  const clearDesktopDayFlipHoldTimer = useCallback(() => {
    if (desktopDayFlipTimerRef.current !== null) {
      window.clearTimeout(desktopDayFlipTimerRef.current);
      desktopDayFlipTimerRef.current = null;
    }
  }, []);

  const setDesktopDragDayArmed = useCallback((nextValue) => {
    if (desktopDragDayIsReadyRef.current === nextValue) return;
    desktopDragDayIsReadyRef.current = nextValue;
    setDesktopDragDayConfirming(nextValue);
  }, []);

  const scheduleDesktopDayFlipArm = useCallback((direction, taskId) => {
    clearDesktopDayFlipHoldTimer();
    desktopDayFlipTimerRef.current = window.setTimeout(() => {
      desktopDayFlipTimerRef.current = null;
      if (!desktopDragModeRef.current || desktopDragStateRef.current.taskId !== taskId) return;
      if (desktopDayFlipDirectionRef.current !== direction) return;
      setDesktopDragDayArmed(true);
    }, DESKTOP_DRAG_DAY_EDGE_HOLD_MS);
  }, [clearDesktopDayFlipHoldTimer, setDesktopDragDayArmed]);

  const clearDesktopDayFlipTimer = useCallback(() => {
    resetDesktopDragInteraction();
  }, [resetDesktopDragInteraction]);

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

  const moveDraggedTaskToDate = useCallback((taskId, nextDate) => {
    if (!taskId || !nextDate) return;

    const currentDate = selectedDateRef.current;
    if (sameDay(currentDate, nextDate)) return;

    const draggedTask = tasksRef.current.find((task) => task.id === taskId);
    const preservedSection = dragOverSectionRef.current || draggedTask?.timeOfDay || 'Morning';
    const nextDateKey = dateKey(nextDate);
    const nextSlot = getDesktopSectionTaskOrder(
      tasksRef.current.filter((task) => task.id !== taskId),
      nextDateKey,
      preservedSection,
    ).length;

    dragOverSectionRef.current = preservedSection;
    dragOverSlotRef.current = nextSlot;
    setDragOverSection(preservedSection);
    setDragOverSlot(nextSlot);
    selectedDateRef.current = nextDate;
    setSelectedDate(nextDate);
  }, []);

  const updateDesktopDragDayAutoFlip = useCallback((clientX, taskId) => {
    const viewportEl = desktopDragViewportRef.current || viewportContainerRef.current;
    if (!viewportEl || !taskId) return;

    const rect = viewportEl.getBoundingClientRect();
    const zones = getDesktopDayFlipZones(rect);

    let direction = 0;
    if (clientX <= zones.previousEnd) {
      direction = -1;
    } else if (clientX >= zones.nextStart) {
      direction = 1;
    }

    // Sync zone state for visual overlay
    const currentZones = desktopDragDayZonesRef.current;
    if (
      !currentZones
      || currentZones.previousStart !== zones.previousStart
      || currentZones.previousEnd !== zones.previousEnd
      || currentZones.nextStart !== zones.nextStart
      || currentZones.nextEnd !== zones.nextEnd
    ) {
      desktopDragDayZonesRef.current = zones;
      setDesktopDragDayZones(zones);
    }

    const nextFeedback = direction === -1 ? 'previous' : direction === 1 ? 'next' : null;
    if (desktopDragDayFeedbackRef.current !== nextFeedback) {
      desktopDragDayFeedbackRef.current = nextFeedback;
      setDesktopDragDayFeedback(nextFeedback);
    }

    // Pointer left edge zones — full reset
    if (direction === 0) {
      clearDesktopDayFlipTimer();
      return;
    }

    if (Date.now() < desktopDayFlipCooldownUntilRef.current) {
      clearDesktopDayFlipHoldTimer();
      setDesktopDragDayArmed(false);
      return;
    }

    if (desktopDayFlipDirectionRef.current !== direction) {
      clearDesktopDayFlipHoldTimer();
      desktopDayFlipDirectionRef.current = direction;
      desktopDragDayEntryPointXRef.current = clientX;
      setDesktopDragDayArmed(false);
      scheduleDesktopDayFlipArm(direction, taskId);
      return;
    }

    const entryX = desktopDragDayEntryPointXRef.current;
    if (entryX === null) return;

    const outwardDelta = (clientX - entryX) * direction;

    if (outwardDelta <= -DESKTOP_DRAG_DAY_CANCEL_DISTANCE_PX) {
      clearDesktopDayFlipTimer();
      return;
    }

    if (!desktopDragDayIsReadyRef.current && outwardDelta >= DESKTOP_DRAG_DAY_ARM_DISTANCE_PX) {
      clearDesktopDayFlipHoldTimer();
      setDesktopDragDayArmed(true);
    } else if (desktopDragDayIsReadyRef.current && outwardDelta < DESKTOP_DRAG_DAY_ARM_DISTANCE_PX * 0.35) {
      setDesktopDragDayArmed(false);
      if (desktopDayFlipTimerRef.current === null) {
        scheduleDesktopDayFlipArm(direction, taskId);
      }
    } else if (!desktopDragDayIsReadyRef.current && desktopDayFlipTimerRef.current === null) {
      scheduleDesktopDayFlipArm(direction, taskId);
    }

    if (desktopDragDayIsReadyRef.current && outwardDelta >= DESKTOP_DRAG_DAY_CONFIRM_DISTANCE_PX) {
      if (!desktopDragModeRef.current || desktopDragStateRef.current.taskId !== taskId) {
        clearDesktopDayFlipTimer();
        return;
      }
      desktopDayFlipCooldownUntilRef.current = Date.now() + DESKTOP_DRAG_DAY_FLIP_COOLDOWN_MS;
      moveDraggedTaskToDate(taskId, shiftDateByDays(selectedDateRef.current, direction));
      clearDesktopDayFlipTimer();
    }
  }, [clearDesktopDayFlipHoldTimer, clearDesktopDayFlipTimer, moveDraggedTaskToDate, scheduleDesktopDayFlipArm, setDesktopDragDayArmed]);


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
  }, [getCanvasPointFromClient, scheduleDesktopDragVisualUpdate, setDesktopDragSourceHidden, setHistoryOpen, syncDesktopDraggedTaskPosition]);

  const finishDesktopTaskDrag = useCallback((task, pointerTarget, pointerId) => {
    clearDesktopDayFlipTimer();
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
        const nextPosition = liveDraggedRect
          ? { x: liveDraggedRect.x, y: liveDraggedRect.y }
          : getDesktopDragAnchorPosition(currentPt);
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
    desktopDayFlipCooldownUntilRef.current = 0;
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
  }, [clearDesktopDayFlipTimer, getActiveDraggedCanvasRect, getDesktopCanvasOverlapEntryFromDom, getDesktopDragAnchorPosition, getDragCanvasPointFromClient, setDesktopDragSourceHidden, setTasks, suppressNextTaskClick]);


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
  }, [getCanvasPointFromClient]);

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
    updateDesktopDragDayAutoFlip(clientX, task.id);
    scheduleDesktopDragOverlapUpdate(clientX, clientY, task.id);
  }, [scheduleDesktopDragOverlapUpdate, scheduleDesktopDragVisualUpdate, startDesktopTaskDrag, updateDesktopDragDayAutoFlip]);

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
  }, [clearDesktopDayFlipTimer, finishDesktopTaskDrag, setHistoryOpen]);

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
        clearDesktopDayFlipTimer();
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
        clearDesktopDayFlipTimer();
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
  }, [clearDesktopDayFlipTimer, finishDesktopTaskDrag, processDesktopDragMove]);

  const selectedDateKey = dateKey(selectedDate);
  const desktopPreviousDayLabel = useMemo(
    () => panelLabel(shiftDateByDays(selectedDate, -1), language),
    [language, selectedDate],
  );
  const desktopNextDayLabel = useMemo(
    () => panelLabel(shiftDateByDays(selectedDate, 1), language),
    [language, selectedDate],
  );
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
  const closeNotePanel = useCallback(() => {
    setNotePanelTaskId(null);
    setNotePanelCollapsed(false);
  }, []);

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
  }, [notePanelTaskId, setTasks]);

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

  const closeEditModal = useCallback(() => {
    setEditingTaskId(null);
    setEditText('');
    setEditCopied(false);
    if (editCopyResetTimerRef.current !== null) {
      window.clearTimeout(editCopyResetTimerRef.current);
      editCopyResetTimerRef.current = null;
    }
  }, []);

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
      closeEditModal();
    }
  }, [closeEditModal, editingTask, editingTaskId]);

  useEffect(() => {
    if (notePanelTaskId && !notePanelTask) {
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

  const closeQuickAddResourcesModal = useCallback(() => {
    setQuickAddReviewOpen(false);
  }, []);

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
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0] || getDefaultDesktopWorkspaces()[0];
  const workspaceActionTarget = workspaceActionMenu
    ? workspaces.find((workspace) => workspace.id === workspaceActionMenu.workspaceId)
    : null;
  const canAddWorkspace = workspaces.length < MAX_DESKTOP_WORKSPACES;
  const handleSelectWorkspace = (workspaceId) => {
    setActiveWorkspaceId(workspaceId);
    setWorkspaceMenuOpen(false);
    setWorkspaceActionMenu(null);
    setIsWorkspaceNameEditing(false);
    setSelectedTaskIds([]);
    setPendingCanvasDeletion(null);
    setActiveGroupView(null);
    setHistoryOpen(false);
  };
  const handleStartWorkspaceRename = () => {
    setWorkspaceMenuOpen(false);
    setWorkspaceActionMenu(null);
    setWorkspaceNameDraft(activeWorkspace?.name || 'Untitled');
    setIsWorkspaceNameEditing(true);
  };
  const handleCommitWorkspaceRename = () => {
    const nextName = workspaceNameDraft.trim() || 'Untitled';
    setWorkspaces((current) => current.map((workspace) => (
      workspace.id === activeWorkspace?.id
        ? { ...workspace, name: nextName }
        : workspace
    )));
    setIsWorkspaceNameEditing(false);
  };
  const handleCancelWorkspaceRename = () => {
    setWorkspaceNameDraft(activeWorkspace?.name || 'Untitled');
    setIsWorkspaceNameEditing(false);
  };
  const handleAddWorkspace = () => {
    if (!canAddWorkspace) return;
    setWorkspaces((current) => {
      const nextWorkspace = {
        id: `workspace-${Date.now()}`,
        name: getNextWorkspaceName(current),
        iconType: 'dot',
      };
      setActiveWorkspaceId(nextWorkspace.id);
      setWorkspaceNameDraft(nextWorkspace.name);
      setIsWorkspaceNameEditing(true);
      return [...current, nextWorkspace];
    });
    setWorkspaceMenuOpen(false);
    setWorkspaceActionMenu(null);
    setSelectedTaskIds([]);
    setPendingCanvasDeletion(null);
    setActiveGroupView(null);
    setHistoryOpen(false);
  };
  const handleWorkspaceActionsToggle = (workspaceId, event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 112;
    const left = Math.min(
      window.innerWidth - popoverWidth - 12,
      Math.max(12, rect.right - popoverWidth),
    );
    const top = Math.min(window.innerHeight - 52, rect.bottom + 8);
    setWorkspaceActionMenu((current) => (
      current?.workspaceId === workspaceId
        ? null
        : { workspaceId, top, left }
    ));
  };
  const handleWorkspaceDeleteRequest = (workspace, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (workspaces.length <= 1) return;
    setWorkspaceActionMenu(null);
    setPendingWorkspaceDeletion({
      workspaceId: workspace.id,
      workspaceName: workspace.name || 'Untitled',
      title: `Delete workspace "${workspace.name || 'Untitled'}"?`,
      description: 'This will remove this page and its items.',
    });
  };
  const cancelWorkspaceDeletion = () => {
    setPendingWorkspaceDeletion(null);
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
    setSelectedTaskIds([]);
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
            ref={desktopDragViewportRef}
            className={`desktop-main-stage ${desktopDragDayFeedback ? `desktop-main-stage-feedback-${desktopDragDayFeedback}` : ''} ${desktopDragDayConfirming ? 'desktop-main-stage-feedback-armed' : ''}`}
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
            {desktopViewMode === DESKTOP_VIEW_MODES.CANVAS ? (
              <DragDayFeedbackOverlayV2
                direction={desktopDragDayFeedback}
                previousLabel={desktopPreviousDayLabel}
                nextLabel={desktopNextDayLabel}
                zones={desktopDragDayZones}
                isConfirming={desktopDragDayConfirming}
              />
            ) : null}
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

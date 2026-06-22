import { CARD_TYPES, normalizeCardType } from '../taskCardUtils';

export const DESKTOP_GROUP_CARD_MIN_HEIGHT = 176;
export const DESKTOP_GROUP_CARD_ITEM_HEIGHT = 60;
export const DESKTOP_GROUP_CARD_ROW_GAP = 6;
export const DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT = 320;
export const DESKTOP_GROUP_CARD_EXPANDED_LIST_MAX_HEIGHT = 680;
export const DESKTOP_GROUP_CARD_BASE_HEIGHT = 82;
export const DESKTOP_GROUP_CARD_MORE_LABEL_HEIGHT = 48;

export const getDesktopEstimatedGroupRowHeight = (task) => (
  normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO ? 232 : DESKTOP_GROUP_CARD_ITEM_HEIGHT
);

export const getDesktopVisibleGroupTaskCount = (tasks, maxHeight) => {
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

export const getDesktopGroupListHeight = (tasks, visibleItemCount = tasks.length) => {
  if (!Array.isArray(tasks) || tasks.length === 0 || visibleItemCount <= 0) return 0;
  const visibleTasks = tasks.slice(0, visibleItemCount);
  return visibleTasks.reduce((total, task, index) => (
    total + getDesktopEstimatedGroupRowHeight(task) + (index > 0 ? DESKTOP_GROUP_CARD_ROW_GAP : 0)
  ), 0);
};

export const getDesktopCollapsedGroupVisibleCount = (tasks) => (
  getDesktopVisibleGroupTaskCount(tasks, DESKTOP_GROUP_CARD_COLLAPSED_LIST_MAX_HEIGHT)
);

export const getDesktopGroupCardHeight = (tasks, visibleItemCount = tasks?.length ?? 0) => {
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

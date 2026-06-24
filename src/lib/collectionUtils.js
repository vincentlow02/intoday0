import { DESKTOP_GROUP_CARD_MIN_HEIGHT, DESKTOP_GROUP_CARD_ITEM_HEIGHT } from './desktopConstants';
import { getCollectionIconFromTasks, getCollectionTagsFromTasks } from './collectionAppearanceUtils';
import { normalizeCardType } from '../taskCardUtils';
import { normalizeTask } from './taskNormalize';

// Compatibility getters to handle fallback from new 'collection' keys to old 'desktopGroup' keys
export const getTaskCollectionId = (task) => task?.collectionId || task?.desktopGroupId || null;
export const getTaskCollectionName = (task) => task?.collectionName || task?.desktopGroupName || '';
export const getTaskCollectionIcon = (task) => task?.collectionIcon || task?.desktopGroupIcon || null;
export const getTaskCollectionCover = (task) => task?.collectionCover || task?.desktopGroupCover || null;
export const getTaskCollectionTags = (task) => task?.collectionTags || task?.desktopGroupTags || [];

export const getCollectionDisplayName = (tasks) => {
  const namedTask = tasks.find((task) => {
    const name = getTaskCollectionName(task);
    return typeof name === 'string' && name.trim();
  });
  return namedTask ? getTaskCollectionName(namedTask) : (tasks[0]?.text || 'Untitled collection');
};

export const getCollectionIcon = (tasks) => getCollectionIconFromTasks(tasks);

export const getCollectionTags = (tasks) => getCollectionTagsFromTasks(tasks);

export const getCollectionDisplayTags = (tasks) => {
  const storedTags = getCollectionTags(tasks);
  if (storedTags && storedTags.length > 0) return storedTags;
  return getCollectionChips(tasks);
};

export const getCollectionChips = (tasks) => {
  const uniqueTypes = [...new Set(tasks.map((task) => normalizeCardType(task.cardType)).filter(Boolean))];
  if (uniqueTypes.length === 0) return [];
  if (uniqueTypes.length > 1) {
    return ['Mixed Content', formatCollectionChipLabel(uniqueTypes[0])];
  }
  return [formatCollectionChipLabel(uniqueTypes[0])];
};

export const formatCollectionChipLabel = (value) => {
  if (!value) return '';
  if (value === 'text') return 'Note';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const getSuggestedCollectionName = (movingTasks, overlapEntry) => {
  const overlapTasks = overlapEntry?.type === 'group' || overlapEntry?.type === 'collection'
    ? overlapEntry.tasks 
    : overlapEntry?.task 
      ? [overlapEntry.task] 
      : [];
  const existingName = getCollectionDisplayName([...movingTasks, ...overlapTasks]);
  return existingName || 'New collection';
};

export const cleanupCollectionMetadata = (tasks) => {
  const groupCounts = tasks.reduce((map, task) => {
    const colId = getTaskCollectionId(task);
    if (!colId) return map;
    map.set(colId, (map.get(colId) || 0) + 1);
    return map;
  }, new Map());

  return tasks.map((task) => {
    const colId = getTaskCollectionId(task);
    if (colId && (groupCounts.get(colId) || 0) <= 1) {
      return normalizeTask({
        ...task,
        desktopGroupId: null,
        desktopGroupName: null,
        desktopGroupIcon: null,
        desktopGroupCover: null,
        desktopGroupTags: [],
        collectionId: null,
        collectionName: null,
        collectionIcon: null,
        collectionCover: null,
        collectionTags: [],
      });
    }
    return task;
  });
};

export const getCollectionCardHeight = (itemCount, visibleItemCount = itemCount, actualContentHeight = null) => {
  if (typeof actualContentHeight === 'number') {
    return Math.max(DESKTOP_GROUP_CARD_MIN_HEIGHT, actualContentHeight + 12);
  }
  const visibleCount = Math.max(1, Math.min(visibleItemCount, itemCount));
  const hasExtra = itemCount > visibleCount;
  const padding = hasExtra ? 20 : 12;
  return Math.max(
    DESKTOP_GROUP_CARD_MIN_HEIGHT,
    70 + (visibleCount * DESKTOP_GROUP_CARD_ITEM_HEIGHT) + padding,
  );
};

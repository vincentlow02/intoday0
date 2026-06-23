import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage desktop marquee selection state and its pruning logic.
 *
 * @param {Object} params
 * @param {Array} params.currentWorkspaceTasks
 * @param {Object} params.selectedDayEntriesRef
 * @param {Function} params.getDesktopCanvasEntryHeight
 * @param {Function} params.getDesktopCanvasEntryTaskIds
 * @param {Function} params.doDesktopRectsIntersect
 * @param {number} params.DESKTOP_CANVAS_CARD_WIDTH
 */
export const useDesktopSelection = ({
  currentWorkspaceTasks,
  selectedDayEntriesRef,
  getDesktopCanvasEntryHeight,
  getDesktopCanvasEntryTaskIds,
  doDesktopRectsIntersect,
  DESKTOP_CANVAS_CARD_WIDTH,
}) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [desktopSelectionRect, setDesktopSelectionRect] = useState(null);

  const selectedTaskIdsRef = useRef(new Set());
  const desktopSelectionStateRef = useRef({ pointerId: null, origin: null });

  // Sync selectedTaskIdsRef with selectedTaskIds state
  useEffect(() => {
    selectedTaskIdsRef.current = new Set(selectedTaskIds);
  }, [selectedTaskIds]);

  // Prune selected task IDs when currentWorkspaceTasks changes
  useEffect(() => {
    const existingIds = new Set(currentWorkspaceTasks.map((task) => task.id));
    console.debug('[desktop-workspace] prune selected tasks effect', {
      taskCount: currentWorkspaceTasks.length,
      taskIds: currentWorkspaceTasks.map((task) => task.id),
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Update selection array from marquee selection bounding rect
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
  }, [selectedDayEntriesRef, DESKTOP_CANVAS_CARD_WIDTH, getDesktopCanvasEntryHeight, getDesktopCanvasEntryTaskIds, doDesktopRectsIntersect]);

  // Clear current task selection
  const clearSelection = useCallback(() => {
    setSelectedTaskIds([]);
  }, []);

  return {
    selectedTaskIds,
    setSelectedTaskIds,
    selectedTaskIdsRef,
    desktopSelectionRect,
    setDesktopSelectionRect,
    desktopSelectionStateRef,
    updateDesktopSelectionFromRect,
    clearSelection,
  };
};

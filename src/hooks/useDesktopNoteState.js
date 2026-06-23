import { useState, useCallback, useEffect } from 'react';
import { createUpdatedTimestamp } from '../lib/packMetadata';
import { normalizeTask } from '../lib/taskNormalize';

/**
 * Custom hook to manage the state and handlers for the Desktop Note Side Panel.
 *
 * @param {Object} params
 * @param {Array} params.tasks - The current list of tasks.
 * @param {Function} params.setTasks - State setter for tasks.
 * @param {Function} params.setActiveGroupView - State setter for the active group view modal.
 */
export const useDesktopNoteState = ({ tasks, setTasks, setActiveGroupView }) => {
  const [notePanelTaskId, setNotePanelTaskId] = useState(null);
  const [notePanelCollapsed, setNotePanelCollapsed] = useState(false);

  const notePanelTask = notePanelTaskId
    ? tasks.find((task) => task.id === notePanelTaskId) || null
    : null;

  const closeNotePanel = useCallback(() => {
    setNotePanelTaskId(null);
    setNotePanelCollapsed(false);
  }, []);

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
  }, [setTasks, setActiveGroupView]);

  useEffect(() => {
    if (notePanelTaskId && !notePanelTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      closeNotePanel();
    }
  }, [closeNotePanel, notePanelTask, notePanelTaskId]);

  return {
    notePanelTaskId,
    setNotePanelTaskId,
    notePanelCollapsed,
    setNotePanelCollapsed,
    notePanelTask,
    closeNotePanel,
    handleNotePanelTextChange,
  };
};

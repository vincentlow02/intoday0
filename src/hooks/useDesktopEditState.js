import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to manage the state and handlers for the Desktop Task Editor Modal.
 *
 * @param {Object} params
 * @param {Array} params.tasks - The current list of tasks.
 */
export const useDesktopEditState = ({ tasks }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCopied, setEditCopied] = useState(false);
  const editCopyResetTimerRef = useRef(null);

  const editingTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId) || null
    : null;

  const canSaveEdit = editText.trim().length > 0;

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      closeEditModal();
    }
  }, [closeEditModal, editingTask, editingTaskId]);

  // Clean up timer on unmount
  useEffect(() => () => {
    if (editCopyResetTimerRef.current !== null) {
      window.clearTimeout(editCopyResetTimerRef.current);
      editCopyResetTimerRef.current = null;
    }
  }, []);

  return {
    editingTaskId,
    setEditingTaskId,
    editText,
    setEditText,
    editCopied,
    setEditCopied,
    editingTask,
    canSaveEdit,
    closeEditModal,
    handleEditCopy,
  };
};

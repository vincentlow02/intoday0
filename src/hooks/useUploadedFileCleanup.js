import { useEffect, useRef } from 'react';
import { deleteUploadedFileBlob } from '../lib/uploadedFileStorage';

/**
 * Custom hook to monitor task list changes and prune/delete uploaded file blobs
 * that are no longer associated with any task.
 *
 * @param {Array} tasks - The current list of tasks.
 */
export const useUploadedFileCleanup = (tasks) => {
  const previousUploadedFileKeysRef = useRef(new Set());

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
};

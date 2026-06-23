import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  getNextWorkspaceName,
  normalizeDesktopWorkspaces,
  getDefaultDesktopWorkspaces,
} from '../lib/workspaceUtils';

// Workspace Constants
export const DESKTOP_WORKSPACES_KEY = 'desktop_workspace_items';
export const DESKTOP_ACTIVE_WORKSPACE_KEY = 'desktop_active_workspace';
export const DESKTOP_WORKSPACE_SCHEMA_KEY = 'desktop_workspace_schema_version';
export const DESKTOP_WORKSPACE_SCHEMA_VERSION = '2';
export const LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID = 'workspace-untitled';
export const EMPTY_DESKTOP_WORKSPACE_ID = 'workspace-untitled-2';
export const DEFAULT_DESKTOP_WORKSPACE_ID = 'workspace-untitled-3';
export const MAX_DESKTOP_WORKSPACES = 3;
export const LEGACY_SAMPLE_WORKSPACE_IDS = new Set(['workspace-personal-projects', 'workspace-work-setup']);
export const DEFAULT_DESKTOP_WORKSPACES = [
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

/**
 * Custom hook to manage desktop workspaces state, persistence, and basic menu handlers.
 *
 * @param {Object} params
 * @param {Function} [params.onWorkspaceChange] - Callback when workspace changes (switching or adding).
 */
export const useDesktopWorkspaceState = ({ onWorkspaceChange } = {}) => {
  const [workspaces, setWorkspaces] = useState(() => {
    try {
      return normalizeDesktopWorkspaces(JSON.parse(localStorage.getItem(DESKTOP_WORKSPACES_KEY) || 'null'));
    } catch {
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
  const [workspaceActionMenu, setWorkspaceActionMenu] = useState(null);
  const [pendingWorkspaceDeletion, setPendingWorkspaceDeletion] = useState(null);

  const workspaceMenuRef = useRef(null);
  const workspaceNameInputRef = useRef(null);

  const activeWorkspace = useMemo(() => (
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ||
    workspaces[0] ||
    getDefaultDesktopWorkspaces()[0]
  ), [workspaces, activeWorkspaceId]);

  const workspaceActionTarget = useMemo(() => (
    workspaceActionMenu
      ? workspaces.find((workspace) => workspace.id === workspaceActionMenu.workspaceId)
      : null
  ), [workspaces, workspaceActionMenu]);

  const canAddWorkspace = workspaces.length < MAX_DESKTOP_WORKSPACES;

  // Sync workspaces to localStorage
  useEffect(() => {
    localStorage.setItem(DESKTOP_WORKSPACES_KEY, JSON.stringify(workspaces));
    localStorage.setItem(DESKTOP_WORKSPACE_SCHEMA_KEY, DESKTOP_WORKSPACE_SCHEMA_VERSION);
  }, [workspaces]);

  // Sync active workspace ID to localStorage with fallback resolution
  useEffect(() => {
    const hasActiveWorkspace = workspaces.some((workspace) => workspace.id === activeWorkspaceId);
    if (hasActiveWorkspace) {
      localStorage.setItem(DESKTOP_ACTIVE_WORKSPACE_KEY, activeWorkspaceId);
      return;
    }
    const fallbackWorkspaceId = workspaces.some((workspace) => workspace.id === DEFAULT_DESKTOP_WORKSPACE_ID)
      ? DEFAULT_DESKTOP_WORKSPACE_ID
      : (workspaces[0]?.id || DEFAULT_DESKTOP_WORKSPACE_ID);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveWorkspaceId(fallbackWorkspaceId);
    localStorage.setItem(DESKTOP_ACTIVE_WORKSPACE_KEY, fallbackWorkspaceId);
  }, [activeWorkspaceId, workspaces]);

  // Handle outside click or Escape key to close workspace dropdown menu
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

  // Close actions menu when workspace dropdown menu closes
  useEffect(() => {
    if (!workspaceMenuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkspaceActionMenu(null);
    }
  }, [workspaceMenuOpen]);

  // Close workspace actions menu on window resize or scroll
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

  // Automatically focus/select input when workspace renaming starts
  useEffect(() => {
    if (!isWorkspaceNameEditing) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      workspaceNameInputRef.current?.focus();
      workspaceNameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isWorkspaceNameEditing]);

  // Handlers
  const handleSelectWorkspace = useCallback((workspaceId) => {
    setActiveWorkspaceId(workspaceId);
    setWorkspaceMenuOpen(false);
    setWorkspaceActionMenu(null);
    setIsWorkspaceNameEditing(false);
    if (onWorkspaceChange) {
      onWorkspaceChange();
    }
  }, [onWorkspaceChange]);

  const handleStartWorkspaceRename = useCallback(() => {
    setWorkspaceMenuOpen(false);
    setWorkspaceActionMenu(null);
    setWorkspaceNameDraft(activeWorkspace?.name || 'Untitled');
    setIsWorkspaceNameEditing(true);
  }, [activeWorkspace]);

  const handleCommitWorkspaceRename = useCallback(() => {
    const nextName = workspaceNameDraft.trim() || 'Untitled';
    setWorkspaces((current) => current.map((workspace) => (
      workspace.id === activeWorkspace?.id
        ? { ...workspace, name: nextName }
        : workspace
    )));
    setIsWorkspaceNameEditing(false);
  }, [workspaceNameDraft, activeWorkspace]);

  const handleCancelWorkspaceRename = useCallback(() => {
    setWorkspaceNameDraft(activeWorkspace?.name || 'Untitled');
    setIsWorkspaceNameEditing(false);
  }, [activeWorkspace]);

  const handleAddWorkspace = useCallback(() => {
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
    if (onWorkspaceChange) {
      onWorkspaceChange();
    }
  }, [canAddWorkspace, onWorkspaceChange]);

  const handleWorkspaceActionsToggle = useCallback((workspaceId, event) => {
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
  }, []);

  const handleWorkspaceDeleteRequest = useCallback((workspace, event) => {
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
  }, [workspaces.length]);

  const cancelWorkspaceDeletion = useCallback(() => {
    setPendingWorkspaceDeletion(null);
  }, []);

  return {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    workspaceMenuOpen,
    setWorkspaceMenuOpen,
    isWorkspaceNameEditing,
    setIsWorkspaceNameEditing,
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
  };
};

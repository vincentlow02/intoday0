import {
  DEFAULT_DESKTOP_WORKSPACES,
  LEGACY_SAMPLE_WORKSPACE_IDS,
  DEFAULT_DESKTOP_WORKSPACE_ID,
  LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID,
  MAX_DESKTOP_WORKSPACES,
} from './desktopConstants';

export const normalizeDesktopWorkspaces = (value) => {
  if (!Array.isArray(value) || !value.length) return getDefaultDesktopWorkspaces();
  const normalized = value
    .filter((workspace) => workspace && !LEGACY_SAMPLE_WORKSPACE_IDS.has(workspace.id))
    .filter((workspace) => workspace && typeof workspace.id === 'string' && typeof workspace.name === 'string')
    .map((workspace, index) => {
      const migratedId = workspace.id === LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID
        ? DEFAULT_DESKTOP_WORKSPACE_ID
        : workspace.id;
      return {
        id: migratedId,
        name: workspace.id === LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID
          ? 'Untitled 3'
          : (workspace.name.trim() || getUntitledWorkspaceName(index + 1)),
        iconType: workspace.iconType === 'letter' ? 'letter' : 'dot',
        iconLetter: typeof workspace.iconLetter === 'string' ? workspace.iconLetter.slice(0, 1).toUpperCase() : null,
        iconBackground: typeof workspace.iconBackground === 'string' ? workspace.iconBackground : null,
        iconColor: typeof workspace.iconColor === 'string' ? workspace.iconColor : null,
      };
    });
  const byId = new Map();
  [...DEFAULT_DESKTOP_WORKSPACES, ...normalized].forEach((workspace) => {
    byId.set(workspace.id, {
      ...workspace,
      iconType: workspace.iconType === 'letter' ? 'letter' : 'dot',
      iconLetter: typeof workspace.iconLetter === 'string' ? workspace.iconLetter.slice(0, 1).toUpperCase() : null,
      iconBackground: typeof workspace.iconBackground === 'string' ? workspace.iconBackground : null,
      iconColor: typeof workspace.iconColor === 'string' ? workspace.iconColor : null,
    });
  });
  return Array.from(byId.values()).slice(0, MAX_DESKTOP_WORKSPACES);
};

export const getTaskWorkspaceId = (task) => (
  typeof task?.desktopWorkspaceId === 'string' && task.desktopWorkspaceId.trim()
    ? (task.desktopWorkspaceId === LEGACY_DEFAULT_DESKTOP_WORKSPACE_ID ? DEFAULT_DESKTOP_WORKSPACE_ID : task.desktopWorkspaceId)
    : DEFAULT_DESKTOP_WORKSPACE_ID
);


export const taskBelongsToWorkspace = (task, workspaceId) => getTaskWorkspaceId(task) === workspaceId;

export const getDefaultDesktopWorkspaces = () => DEFAULT_DESKTOP_WORKSPACES.map((workspace) => ({ ...workspace }));

export const getUntitledWorkspaceName = (index) => (index <= 1 ? 'Untitled' : `Untitled ${index}`);

export const areTaskIdSelectionsEqual = (currentIds, nextIds) => (
  currentIds.length === nextIds.length && nextIds.every((taskId) => currentIds.includes(taskId))
);

export const getNextWorkspaceName = (workspaces) => {
  const usedNames = new Set(workspaces.map((workspace) => workspace.name));
  for (let index = 1; index <= MAX_DESKTOP_WORKSPACES + 1; index += 1) {
    const candidate = getUntitledWorkspaceName(index);
    if (!usedNames.has(candidate)) return candidate;
  }
  return getUntitledWorkspaceName(workspaces.length + 1);
};

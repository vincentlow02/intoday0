export const mockConnections = [
  {
    id: "connection-note-to-link",
    workspaceId: "workspace-my",
    sourceId: "resource-note-1",
    targetId: "resource-link-1",
    label: "reference",
    type: "related",
  },
  {
    id: "connection-link-to-collection",
    workspaceId: "workspace-my",
    sourceId: "resource-link-1",
    targetId: "collection-research-1",
    label: "collected in",
    type: "collection",
  },
  {
    id: "connection-file-to-collection",
    workspaceId: "workspace-my",
    sourceId: "resource-file-1",
    targetId: "collection-portfolio-1",
    label: "part of",
    type: "collection",
  },
];

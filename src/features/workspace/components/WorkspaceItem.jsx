export default function WorkspaceItem({ workspace, active }) {
  const className = active ? "sidebar-item active" : "sidebar-item";

  return (
    <button
      type="button"
      className={className}
      aria-current={active ? "page" : undefined}
      title={workspace.description}
    >
      <span className="workspace-item-icon" aria-hidden="true">
        {workspace.icon}
      </span>
      <span>{workspace.name}</span>
    </button>
  );
}

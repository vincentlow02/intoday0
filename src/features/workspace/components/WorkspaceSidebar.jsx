import { mockWorkspaces } from "../../../data/mockWorkspaces";
import WorkspaceItem from "./WorkspaceItem";

export default function WorkspaceSidebar() {
  return (
    <aside className="desktop-sidebar">
      <div className="app-brand">
        <div className="app-brand-mark">I</div>
        <div>
          <div className="app-brand-name">IntoDay</div>
          <div className="app-brand-subtitle">Clean frontend shell</div>
        </div>
      </div>

      <nav className="sidebar-section" aria-label="Workspaces">
        <div className="sidebar-label">Workspace</div>
        {mockWorkspaces.map((workspace, index) => (
          <WorkspaceItem
            key={workspace.id}
            workspace={workspace}
            active={index === 0}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Step 2 shell</span>
      </div>
    </aside>
  );
}

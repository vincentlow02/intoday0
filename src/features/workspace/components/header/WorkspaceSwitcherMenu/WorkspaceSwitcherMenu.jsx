import './WorkspaceSwitcherMenu.css';
import WorkspaceSwitcherItem from './WorkspaceSwitcherItem/WorkspaceSwitcherItem';
import AddWorkspaceButton from './AddWorkspaceButton/AddWorkspaceButton';

export default function WorkspaceSwitcherMenu() {
  return (
    <div className="workspace-switcher-menu">
      <div className="workspace-switcher-menu-content">
        <div className="workspace-switcher-menu-main">
          <div className="workspace-switcher-menu-header">
            <div className="workspace-switcher-menu-header-text">My Spaces</div>
          </div>

          <WorkspaceSwitcherItem name="Untitled 1" />

          <div className="workspace-switcher-divider" />
        </div>

        <AddWorkspaceButton />
      </div>
    </div>
  );
}
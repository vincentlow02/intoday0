import './WorkspaceSwitcherMenu.css';

function MoreIcon() {
  return (
    <span className="workspace-switcher-more" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function WorkspaceSwitcherMenu() {
  return (
    <div className="workspace-switcher-menu">
      <div className="workspace-switcher-menu-content">
        <div className="workspace-switcher-menu-main">
          <div className="workspace-switcher-menu-header">
            <div className="workspace-switcher-menu-header-text">My Spaces</div>
          </div>

          <button className="workspace-switcher-item active" type="button">
            <span className="workspace-switcher-item-name">Untitled 1</span>
            <MoreIcon />
          </button>

          <div className="workspace-switcher-divider" />
        </div>

        <button className="workspace-switcher-add" type="button">
          <span className="workspace-switcher-add-icon" aria-hidden="true" />
          <span className="workspace-switcher-add-text">Add workspace</span>
        </button>
      </div>
    </div>
  );
}

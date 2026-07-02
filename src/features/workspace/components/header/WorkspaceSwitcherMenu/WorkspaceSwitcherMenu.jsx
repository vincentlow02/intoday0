import { createPortal } from 'react-dom';
import './WorkspaceSwitcherMenu.css';
import WorkspaceSwitcherItem from './WorkspaceSwitcherItem/WorkspaceSwitcherItem';
import AddWorkspaceButton from './AddWorkspaceButton/AddWorkspaceButton';

export default function WorkspaceSwitcherMenu({ anchorRect, onClose }) {
  if (!anchorRect) return null;

  const style = {
    position: 'fixed',
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
    zIndex: 500,
  };

  return createPortal(
    <>
      {/* Invisible backdrop to close on outside click */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 499 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="workspace-switcher-menu" style={style}>
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
    </>,
    document.body
  );
}
import { useState } from 'react';
import './WorkspaceSwitcherItem.css';
import MoreIcon from '../MoreIcon/MoreIcon';
import WorkspaceMoreMenu from '../WorkspaceMoreMenu/WorkspaceMoreMenu';

export default function WorkspaceSwitcherItem({ name }) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <div className="workspace-switcher-item active">
      <span className="workspace-switcher-item-name">{name}</span>

      <div className="workspace-switcher-more-wrap">
        <button
          className="workspace-switcher-more-button"
          type="button"
          aria-label="Workspace options"
          onClick={(event) => {
            event.stopPropagation();
            setIsMoreMenuOpen((prev) => !prev);
          }}
        >
          <MoreIcon />
        </button>

        {isMoreMenuOpen && <WorkspaceMoreMenu />}
      </div>
    </div>
  );
}

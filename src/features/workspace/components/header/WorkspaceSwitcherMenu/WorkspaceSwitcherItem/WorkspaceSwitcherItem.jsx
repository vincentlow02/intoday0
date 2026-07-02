import { useState } from 'react';
import { createPortal } from 'react-dom';
import './WorkspaceSwitcherItem.css';
import MoreIcon from '../MoreIcon/MoreIcon';
import WorkspaceMoreMenu from '../WorkspaceMoreMenu/WorkspaceMoreMenu';
import DeleteWorkspaceModal from '../DeleteWorkspaceModal/DeleteWorkspaceModal';

export default function WorkspaceSwitcherItem({ name }) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

        {isMoreMenuOpen && (
          <WorkspaceMoreMenu
            onDeleteClick={(event) => {
              event.stopPropagation();
              setIsMoreMenuOpen(false);
              setIsDeleteModalOpen(true);
            }}
          />
        )}
      </div>

      {isDeleteModalOpen && createPortal(
        <DeleteWorkspaceModal
          workspaceName={name}
          onClose={(event) => {
            event?.stopPropagation();
            setIsDeleteModalOpen(false);
          }}
          onConfirm={(event) => {
            event?.stopPropagation();
            setIsDeleteModalOpen(false);
          }}
        />,
        document.body
      )}
    </div>
  );
}

import './WorkspaceMoreMenu.css';
import trashIcon from '../../../../../../assets/icons/trash-icon.svg';

function DeletedWorkspaceIcon() {
  return (
    <img
      className="workspace-switcher-deleted-icon"
      src={trashIcon}
      alt=""
      aria-hidden="true"
    />
  );
}

export default function WorkspaceMoreMenu({ onDeleteClick }) {
  return (
    <button className="workspace-switcher-more-menu" type="button" onClick={onDeleteClick}>
      <DeletedWorkspaceIcon />
      <span className="workspace-switcher-more-menu-text">
        Delete Workspace
      </span>
    </button>
  );
}

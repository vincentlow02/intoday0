import './AddWorkspaceButton.css';

export default function AddWorkspaceButton() {
  return (
    <button className="workspace-switcher-add" type="button">
      <span className="workspace-switcher-add-icon" aria-hidden="true" />
      <span className="workspace-switcher-add-text">Add workspace</span>
    </button>
  );
}

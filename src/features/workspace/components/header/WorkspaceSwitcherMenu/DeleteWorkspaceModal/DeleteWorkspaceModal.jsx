import './DeleteWorkspaceModal.css';

export default function DeleteWorkspaceModal({
  workspaceName,
  onClose,
  onConfirm,
}) {
  return (
    <div
      className="delete-workspace-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="delete-workspace-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-workspace-modal-title"
      >
        <div className="delete-workspace-modal-content">
          <div className="delete-workspace-modal-text-group">
            <div className="delete-workspace-modal-title-wrap">
              <h2
                id="delete-workspace-modal-title"
                className="delete-workspace-modal-title"
              >
                Delete workspace
                <br />
                "{workspaceName}"?
              </h2>
            </div>

            <div className="delete-workspace-modal-description-wrap">
              <p className="delete-workspace-modal-description">
                This will remove this page and its items.
              </p>
            </div>
          </div>

          <div className="delete-workspace-modal-actions">
            <button
              className="delete-workspace-modal-button delete-workspace-modal-button-cancel"
              type="button"
              onClick={onClose}
            >
              <span className="delete-workspace-modal-button-text delete-workspace-modal-button-text-cancel">
                Cancel
              </span>
            </button>

            <button
              className="delete-workspace-modal-button delete-workspace-modal-button-delete"
              type="button"
              onClick={onConfirm}
            >
              <span className="delete-workspace-modal-button-text delete-workspace-modal-button-text-delete">
                Delete
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
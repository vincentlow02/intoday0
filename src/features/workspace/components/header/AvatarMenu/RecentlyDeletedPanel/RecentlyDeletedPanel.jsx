import './RecentlyDeletedPanel.css';
import backIcon from '../../../../../../assets/icons/account-back.svg';
import closeIcon from '../../../../../../assets/icons/account-close.svg';
import recentlyDeletedEmptyIcon from '../../../../../../assets/icons/recently-deleted-empty.svg';
import IconImage from '../Shared/IconImage';

export default function RecentlyDeletedPanel({ closeRecentlyDeleted, onClose }) {
  return (
    <div className="recently-deleted-panel" onClick={(event) => event.stopPropagation()}>
      <div className="recently-deleted-panel__content">
        <div className="recently-deleted-panel__top">
          <button className="recently-deleted-panel__back" type="button" onClick={closeRecentlyDeleted} aria-label="Back to account panel">
            <IconImage src={backIcon} />
          </button>
          <button className="recently-deleted-panel__close" type="button" onClick={onClose} aria-label="Close recently deleted">
            <IconImage src={closeIcon} />
          </button>
        </div>

        <div className="recently-deleted-panel__header">
          <h2>Recently deleted</h2>
          <p>Items will be permanently deleted after 30 days.</p>
        </div>
      </div>

      <div className="recently-deleted-panel__empty">
        <IconImage src={recentlyDeletedEmptyIcon} />
        <div className="recently-deleted-panel__empty-copy">
          <h3>No items here</h3>
          <p>Deleted items will appear here</p>
        </div>
      </div>
    </div>
  );
}

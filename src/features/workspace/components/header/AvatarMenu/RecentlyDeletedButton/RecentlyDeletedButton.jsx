import '../Shared/MenuRow.css';
import './RecentlyDeletedButton.css';
import recentlyDeletedIcon from '../../../../../../assets/icons/account-recently-deleted.svg';
import arrowRightIcon from '../../../../../../assets/icons/account-arrow-right.svg';
import IconImage from '../Shared/IconImage';

export default function RecentlyDeletedButton({ openRecentlyDeleted }) {
  return (
    <button className="avatar-menu__row avatar-menu__row-button" type="button" onClick={openRecentlyDeleted}>
      <div className="avatar-menu__row-left avatar-menu__row-left--deleted">
        <div className="avatar-menu__icon avatar-menu__icon--deleted">
          <IconImage src={recentlyDeletedIcon} />
        </div>
        <span className="avatar-menu__row-label">Recently deleted</span>
      </div>
      <div className="avatar-menu__row-right">
        <div className="avatar-menu__arrow-right">
          <IconImage src={arrowRightIcon} />
        </div>
      </div>
    </button>
  );
}

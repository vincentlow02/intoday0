import '../Shared/MenuRow.css';
import helpIcon from '../../../../../../assets/icons/account-help.svg';
import IconImage from '../Shared/IconImage';

export default function HelpCard() {
  return (
    <div className="avatar-menu__settings-card avatar-menu__help-card">
      <div className="avatar-menu__row">
        <div className="avatar-menu__row-left">
          <div className="avatar-menu__icon">
            <IconImage src={helpIcon} />
          </div>
          <span className="avatar-menu__row-label">Help & Feedback</span>
        </div>
      </div>
    </div>
  );
}

import './StorageCard.css';
export default function StorageCard() {
  return (
    <div className="avatar-menu__storage-card">
      <div className="avatar-menu__storage-header">
        <span className="avatar-menu__storage-title">Storage</span>
        <span className="avatar-menu__storage-usage">
          <strong>0.2GB</strong> / 2GB
        </span>
      </div>
      <div className="avatar-menu__storage-progress">
        <div className="avatar-menu__storage-progress-bar" style={{ width: '12%' }} />
      </div>
      <div className="avatar-menu__storage-footer">Manage storage</div>
    </div>
  );
}

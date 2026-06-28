import './AddResourceMenu.css';
import noteIcon from '../../../../assets/icons/add-quick-note.svg';
import uploadFileIcon from '../../../../assets/icons/add-upload-file.svg';
import uploadPhotoIcon from '../../../../assets/icons/add-upload-photo.svg';

const menuItems = [
  { label: 'Upload file', icon: uploadFileIcon, variant: 'file' },
  { label: 'Upload photo', icon: uploadPhotoIcon, variant: 'photo' },
  { label: 'Quick Note', icon: noteIcon, variant: 'note' },
];

export default function AddResourceMenu({ onSelect }) {
  return (
    <div className="add-resource-menu" role="menu" aria-label="Add resource">
      {menuItems.map(({ label, icon, variant }) => (
        <button
          key={label}
          type="button"
          className={`add-resource-menu__item add-resource-menu__item--${variant}`}
          role="menuitem"
          onClick={() => onSelect?.(label)}
        >
          <span className={`add-resource-menu__icon add-resource-menu__icon--${variant}`}>
            <img src={icon} alt="" aria-hidden="true" />
          </span>
          <span className="add-resource-menu__label">{label}</span>
        </button>
      ))}
    </div>
  );
}

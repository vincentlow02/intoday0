import './AddResourceMenu.css';

const menuItems = [
  { label: 'Upload file', icon: FileIcon },
  { label: 'Upload photo', icon: PhotoIcon },
  { label: 'Quick Note', icon: NoteIcon },
];

function FileIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M6.2 2.8h4.1l2.2 2.3v10.1H6.2z" />
      <path d="M10.1 2.8v2.5h2.4" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3.2 5.1h11.6v7.8H3.2z" />
      <path d="M5.4 11.5 7.9 9l1.7 1.7 1.2-1.2 1.8 2" />
      <path d="M11.9 7.2h.1" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M5 3.7h6.8l1.2 1.2v9.4H5z" />
      <path d="M11.6 3.8v2.6H13" />
      <path d="M7.1 8.3h3.8" />
      <path d="M7.1 10.8h2.9" />
    </svg>
  );
}

export default function AddResourceMenu({ onSelect }) {
  return (
    <div className="add-resource-menu" role="menu" aria-label="Add resource">
      {menuItems.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          className="add-resource-menu__item"
          role="menuitem"
          onClick={() => onSelect?.(label)}
        >
          <span className="add-resource-menu__icon">
            <Icon />
          </span>
          <span className="add-resource-menu__label">{label}</span>
        </button>
      ))}
    </div>
  );
}

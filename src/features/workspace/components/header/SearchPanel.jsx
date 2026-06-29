import './SearchPanel.css';
import closeIcon from '../../../../assets/icons/account-close.svg';
import emptyEllipse from '../../../../assets/icons/search-empty-ellipse.svg';
import emptyLinkIcon from '../../../../assets/icons/search-empty-link.svg';
import emptyNoteIcon from '../../../../assets/icons/search-empty-note.png';
import emptyPdfIcon from '../../../../assets/icons/search-empty-pdf.svg';
import searchIcon from '../../../../assets/icons/search-input-icon.svg';
import starLarge from '../../../../assets/icons/search-star-large.svg';
import starSmall from '../../../../assets/icons/search-star-small.svg';

export default function SearchPanel({ onClose }) {
  return (
    <div className="search-panel__backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <section className="search-panel" aria-label="Search panel" onClick={(event) => event.stopPropagation()}>
        <div className="search-panel__content">
          <div className="search-panel__toparea">
            <div className="search-panel__toolbar">
              <div className="search-panel__searchbar">
                <img className="search-panel__search-icon" src={searchIcon} alt="" aria-hidden="true" />
                <input
                  className="search-panel__input"
                  placeholder="Search links, notes, files..."
                  aria-label="Search links, notes, files"
                />
              </div>

              <button className="search-panel__close" type="button" onClick={onClose} aria-label="Close search">
                <img src={closeIcon} alt="" aria-hidden="true" />
              </button>
            </div>

            <div className="search-panel__tabs" aria-label="Search filters">
              <div className="search-panel__tab-row">
                <button className="search-panel__tab search-panel__tab--active" type="button">All</button>
                <button className="search-panel__tab" type="button">Packs</button>
                <button className="search-panel__tab" type="button">Items</button>
              </div>
              <div className="search-panel__divider" />
            </div>
          </div>

          <div className="search-panel__empty">
            <div className="search-panel__empty-art" aria-hidden="true">
              <img className="search-panel__empty-ellipse" src={emptyEllipse} alt="" />
              <img className="search-panel__star search-panel__star--top" src={starLarge} alt="" />
              <img className="search-panel__star search-panel__star--right" src={starSmall} alt="" />
              <img className="search-panel__star search-panel__star--center" src={starSmall} alt="" />
              <img className="search-panel__star search-panel__star--left" src={starSmall} alt="" />

              <div className="search-panel__empty-tile search-panel__empty-tile--link">
                <img src={emptyLinkIcon} alt="" />
              </div>
              <div className="search-panel__empty-tile search-panel__empty-tile--note">
                <img src={emptyNoteIcon} alt="" />
              </div>
              <div className="search-panel__empty-tile search-panel__empty-tile--pdf">
                <img src={emptyPdfIcon} alt="" />
              </div>
            </div>

            <div className="search-panel__empty-copy">
              <h2>Nothing here yet</h2>
              <div className="search-panel__empty-lines">
                <p>Start collecting your first context</p>
                <p>All your links, notes and files will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

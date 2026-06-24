import React, { useState, useRef, useEffect } from 'react';
import { Share, Download, Trash2, ChevronRight, Sparkles, FileText, Archive } from 'lucide-react';

const CollectionContextMenu = ({ isOpen, onClose, anchorRef, onAction }) => {
  const [showExportSubmenu, setShowExportSubmenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setShowExportSubmenu(false);
      return;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const handleAction = (action) => {
    onAction?.(action);
    onClose();
  };

  return (
    <div 
      ref={menuRef} 
      className="desktop-collection-context-menu"
      onMouseLeave={() => setShowExportSubmenu(false)}
    >
      <div className="desktop-collection-context-menu-item" onClick={() => handleAction('share')}>
        <div className="desktop-collection-context-menu-icon">
          <Share size={16} strokeWidth={2} />
        </div>
        <div className="desktop-collection-context-menu-text">
          <div className="desktop-collection-context-menu-title">Share collection</div>
          <div className="desktop-collection-context-menu-subtitle">Create a public link for this collection</div>
        </div>
      </div>

      <div 
        className="desktop-collection-context-menu-item" 
        onMouseEnter={() => setShowExportSubmenu(true)}
      >
        <div className="desktop-collection-context-menu-icon">
          <Download size={16} strokeWidth={2} />
        </div>
        <div className="desktop-collection-context-menu-text">
          <div className="desktop-collection-context-menu-title">Export collection</div>
          <div className="desktop-collection-context-menu-subtitle">Export all groups and assets</div>
        </div>
        <div className="desktop-collection-context-menu-chevron">
          <ChevronRight size={16} strokeWidth={2} />
        </div>
      </div>

      <div className="desktop-collection-context-menu-item is-danger" onClick={() => handleAction('delete')}>
        <div className="desktop-collection-context-menu-icon">
          <Trash2 size={16} strokeWidth={2} />
        </div>
        <div className="desktop-collection-context-menu-text">
          <div className="desktop-collection-context-menu-title">Delete collection</div>
          <div className="desktop-collection-context-menu-subtitle">Permanently delete this collection</div>
        </div>
      </div>

      {showExportSubmenu && (
        <div className="desktop-collection-context-submenu">
          <div className="desktop-collection-context-menu-item" onClick={() => handleAction('copy-for-ai')}>
            <div className="desktop-collection-context-menu-icon">
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <div className="desktop-collection-context-menu-text">
              <div className="desktop-collection-context-menu-title">Copy for AI</div>
              <div className="desktop-collection-context-menu-subtitle">Copy optimized content for AI</div>
            </div>
          </div>

          <div className="desktop-collection-context-menu-item" onClick={() => handleAction('export-markdown')}>
            <div className="desktop-collection-context-menu-icon">
              <FileText size={16} strokeWidth={2} />
            </div>
            <div className="desktop-collection-context-menu-text">
              <div className="desktop-collection-context-menu-title">Export as Markdown</div>
              <div className="desktop-collection-context-menu-subtitle">.md file</div>
            </div>
          </div>

          <div className="desktop-collection-context-menu-item" onClick={() => handleAction('download-zip')}>
            <div className="desktop-collection-context-menu-icon">
              <Archive size={16} strokeWidth={2} />
            </div>
            <div className="desktop-collection-context-menu-text">
              <div className="desktop-collection-context-menu-title">Download ZIP</div>
              <div className="desktop-collection-context-menu-subtitle">All assets in a ZIP file</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionContextMenu;

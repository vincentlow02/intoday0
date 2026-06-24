import React from 'react';
import { X, Copy, Info } from 'lucide-react';
import '../styles/desktop.css';

const CollectionShareModal = ({ isOpen, onClose, collectionName, labels = {} }) => {
  if (!isOpen) return null;

  const renderInfoText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="desktop-share-modal-link-text">{part.slice(2, -2)}</span>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="desktop-share-modal-overlay" onClick={onClose}>
      <div className="desktop-share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="desktop-share-modal-header">
          <h2 className="desktop-share-modal-title">{collectionName || 'Deep Research'}</h2>
          <button className="desktop-share-modal-close" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        
        <div className="desktop-share-modal-body">
          <div className="desktop-share-modal-link-container">
            <button className="desktop-share-modal-copy-btn" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              onClose();
            }}>
              <Copy size={14} strokeWidth={2} />
              <span>{labels.shareModalCopyLink || 'Copy link'}</span>
            </button>
          </div>
          
          <div className="desktop-share-modal-info">
            <Info size={14} className="desktop-share-modal-info-icon" />
            <p>
              {renderInfoText(labels.shareModalInfo || 'Public links are accessible to anyone. Share at your own **risk**. **Delete** anytime. When sharing on a third-party platform, that platform\'s policies apply.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionShareModal;

import React from 'react';
import { X, FileText, ImageIcon } from 'lucide-react';

const formatQuickAddFileSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const DesktopAddResourcesModal = ({
  attachments,
  linkPreviews = [],
  onClose,
  onRemoveAttachment,
  onRemoveLink,
  onSubmit,
}) => {
  const itemCount = attachments.length + linkPreviews.length;
  if (itemCount === 0) return null;

  return (
    <div className="desktop-add-resources-backdrop" role="presentation" onPointerDown={onClose}>
      <section
        className="desktop-add-resources-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-add-resources-title"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="desktop-add-resources-header">
          <h2 id="desktop-add-resources-title">Add</h2>
          <button type="button" className="desktop-add-resources-close" aria-label="Close add" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <p className="desktop-add-resources-subtitle">You can add multiple links, photos, and PDFs at once.</p>

        <div className="desktop-add-resources-list" aria-label="Selected resources">
          {linkPreviews.map((linkPreview) => (
            <article key={linkPreview.url} className="desktop-add-resource-item">
              <div
                className={`desktop-add-resource-thumb desktop-add-resource-link-thumb ${linkPreview.thumbnailUrl ? 'has-thumbnail' : ''}`}
                style={linkPreview.thumbnailUrl ? undefined : { background: linkPreview.visual }}
              >
                {linkPreview.thumbnailUrl ? <img src={linkPreview.thumbnailUrl} alt="" /> : null}
              </div>
              <div className="desktop-add-resource-copy">
                <div className="desktop-add-resource-kicker">
                  <img
                    className="desktop-add-resource-favicon"
                    src={`https://www.google.com/s2/favicons?domain=${linkPreview.domain}&sz=64`}
                    alt=""
                  />
                  <span>{linkPreview.domain}</span>
                </div>
                <strong>{String(linkPreview.customTitle || '').trim() || linkPreview.title || linkPreview.domain}</strong>
                <span>Saved from {linkPreview.domain}</span>
              </div>
              <button type="button" className="desktop-add-resource-remove" aria-label={`Remove ${linkPreview.domain}`} onClick={() => onRemoveLink(linkPreview.url)}>
                <X size={16} strokeWidth={2} />
              </button>
            </article>
          ))}

          {attachments.map((attachment) => {
            const isImage = attachment.uploadKind === 'image';
            const isPdf = attachment.uploadKind === 'pdf';
            const fileSize = formatQuickAddFileSize(attachment.size);
            const dimensions = isImage && Number.isFinite(attachment.photoWidth) && Number.isFinite(attachment.photoHeight)
              ? `${attachment.photoWidth} × ${attachment.photoHeight}`
              : '';
            const meta = [fileSize, dimensions || (isPdf ? 'PDF document' : attachment.uploadKind)]
              .filter(Boolean)
              .join('  ·  ');

            return (
              <article key={attachment.id} className="desktop-add-resource-item">
                <div className={`desktop-add-resource-thumb ${isPdf ? 'is-pdf' : ''}`}>
                  {isImage ? (
                    <img src={attachment.previewUrl || attachment.photoDataUrl} alt="" />
                  ) : (
                    <FileText size={34} strokeWidth={1.7} />
                  )}
                </div>
                <div className="desktop-add-resource-copy">
                  <div className="desktop-add-resource-kicker">
                    {isImage ? <ImageIcon size={15} strokeWidth={1.8} /> : <FileText size={15} strokeWidth={1.8} />}
                    <span>{isImage ? 'Photo' : isPdf ? 'PDF' : 'Document'}</span>
                  </div>
                  <strong>{attachment.originalFileName || attachment.title}</strong>
                  {meta ? <span>{meta}</span> : null}
                </div>
                <button
                  type="button"
                  className="desktop-add-resource-remove"
                  aria-label={`Remove ${attachment.originalFileName || attachment.title}`}
                  onClick={() => onRemoveAttachment(attachment.id)}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </article>
            );
          })}
        </div>

        <button type="button" className="desktop-add-resources-submit" onClick={onSubmit}>
          {itemCount > 1 ? `Add (${itemCount})` : 'Add to canvas'}
        </button>
      </section>
    </div>
  );
};

export default DesktopAddResourcesModal;

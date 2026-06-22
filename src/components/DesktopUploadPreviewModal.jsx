import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, ImageIcon, ChevronRight } from 'lucide-react';

const DesktopUploadPreviewModal = ({ attachment, onClose, onReplace, onSubmit }) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const replacementInputRef = useRef(null);
  const isPhoto = attachment?.uploadKind === 'image';
  const isPdf = attachment?.uploadKind === 'pdf';

  useEffect(() => {
    if (!isPdf || !attachment?.file) {
      setPdfPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(attachment.file);
    setPdfPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [attachment?.file, isPdf]);

  if (!attachment || (!isPhoto && !isPdf)) return null;

  const fileSize = (() => {
    if (!Number.isFinite(attachment.size) || attachment.size <= 0) return '';
    if (attachment.size < 1024 * 1024) return `${Math.max(1, Math.round(attachment.size / 1024))} KB`;
    return `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`;
  })();
  const dimensions = isPhoto && Number.isFinite(attachment.photoWidth) && Number.isFinite(attachment.photoHeight)
    ? `${attachment.photoWidth} × ${attachment.photoHeight} px`
    : '';

  return (
    <div className="desktop-upload-preview-backdrop" role="presentation" onPointerDown={onClose}>
      <section
        className="desktop-upload-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-upload-preview-title"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="desktop-upload-preview-header">
          <h2 id="desktop-upload-preview-title">Add</h2>
          <button type="button" className="desktop-upload-preview-close" aria-label="Close upload" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="desktop-upload-preview-body">
          <input
            ref={replacementInputRef}
            className="desktop-upload-preview-input"
            type="file"
            accept={isPhoto ? 'image/*' : '.pdf,application/pdf'}
            onChange={onReplace}
          />
          <span className="desktop-upload-preview-label">{isPhoto ? 'Image file' : 'PDF file'}</span>
          <button type="button" className="desktop-upload-preview-file" onClick={() => replacementInputRef.current?.click()}>
            <span className={`desktop-upload-preview-file-icon ${isPdf ? 'is-pdf' : ''}`}>
              {isPhoto ? <ImageIcon size={18} strokeWidth={1.8} /> : <FileText size={18} strokeWidth={1.8} />}
            </span>
            <span className="desktop-upload-preview-file-copy">
              <strong>{attachment.originalFileName || attachment.title}</strong>
              {fileSize ? <span>{fileSize}</span> : null}
            </span>
            <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>

          {isPhoto ? (
            <div className="desktop-upload-preview-media">
              <img src={attachment.previewUrl || attachment.photoDataUrl} alt="Selected photo preview" />
            </div>
          ) : (
            <div className="desktop-upload-preview-media desktop-upload-preview-pdf">
              {pdfPreviewUrl ? (
                <object data={`${pdfPreviewUrl}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" aria-label="Selected PDF preview">
                  <div className="desktop-upload-preview-fallback"><FileText size={42} /><span>PDF preview</span></div>
                </object>
              ) : (
                <div className="desktop-upload-preview-fallback"><FileText size={42} /><span>PDF preview</span></div>
              )}
            </div>
          )}

          <div className="desktop-upload-preview-meta">
            <span>
              {isPhoto ? <ImageIcon size={15} strokeWidth={1.8} /> : <FileText size={15} strokeWidth={1.8} />}
              {isPhoto ? `${attachment.mimeType?.split('/')[1]?.toUpperCase() || 'Image'} image` : 'PDF document'}
            </span>
            {dimensions ? <><i aria-hidden="true" /><span>{dimensions}</span></> : null}
            {fileSize ? <><i aria-hidden="true" /><span>{fileSize}</span></> : null}
          </div>

          <button type="button" className="desktop-upload-preview-submit" onClick={onSubmit}>Add to canvas</button>
        </div>
      </section>
    </div>
  );
};

export default DesktopUploadPreviewModal;

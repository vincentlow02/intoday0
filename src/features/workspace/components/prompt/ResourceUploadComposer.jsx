import { useEffect, useState } from 'react';
import './ResourceUploadComposer.css';
import closeIcon from '../../../../assets/icons/Vector (6).svg';

function formatFileSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function ResourceUploadComposer({
  files = [],
  resourceType = 'file',
  note = '',
  onNoteChange,
  onRemove,
  onSubmit,
  onAddClick,
}) {
  const [previewUrls, setPreviewUrls] = useState({});

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviewUrls({});
      return;
    }

    const newUrls = {};
    files.forEach((file, index) => {
      if (file?.type?.startsWith('image/')) {
        newUrls[index] = URL.createObjectURL(file);
      }
    });
    setPreviewUrls(newUrls);

    return () => {
      Object.values(newUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  if (!files || files.length === 0) return null;

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit?.({
      files,
      note,
      resourceType,
    });
  }

  return (
    <form className="resource-upload-composer" onSubmit={handleSubmit}>
      <div className="resource-upload-composer__inner">
        <div className={`resource-upload-composer__previews ${files.length > 1 ? 'resource-upload-composer__previews--multiple' : ''}`}>
          {files.map((file, index) => {
            const isImage = file?.type?.startsWith('image/');
            const previewUrl = previewUrls[index];
            const extension = file?.name?.split('.').pop()?.toUpperCase()?.slice(0, 5);

            if (isImage && previewUrl) {
              return (
                <div key={index} className="resource-upload-composer__image-preview">
                  <img src={previewUrl} alt={file.name} />
                  <button
                    type="button"
                    className="resource-upload-composer__remove"
                    aria-label="Remove selected file"
                    onClick={() => onRemove?.(index)}
                  >
                    <img src={closeIcon} alt="Close" aria-hidden="true" />
                  </button>
                </div>
              );
            }

            return (
              <div key={index} className="resource-upload-composer__file-chip">
                <div className="resource-upload-composer__file-icon">
                  {extension || 'FILE'}
                </div>
                <div className="resource-upload-composer__file-info">
                  <span className="resource-upload-composer__file-name">{file.name}</span>
                  <span className="resource-upload-composer__file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="resource-upload-composer__file-remove"
                  aria-label="Remove selected file"
                  onClick={() => onRemove?.(index)}
                >
                  <img src={closeIcon} alt="Close" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="resource-upload-composer__bottom">
          <div className="resource-upload-composer__input-area">
            <button
              type="button"
              className="resource-upload-composer__add-btn"
              aria-label="Add attachment"
              onClick={onAddClick}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="#9A9898"
                  strokeWidth="1.19"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <input
              className="resource-upload-composer__input"
              value={note}
              onChange={(event) => onNoteChange?.(event.target.value)}
              placeholder="Paste a link , note, or file..."
            />
          </div>

          <button
            type="submit"
            className="resource-upload-composer__send-btn"
            aria-label="Send message"
          >
            <svg
              width="11"
              height="14"
              viewBox="0 0 12 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 13V1M6 1L1 6M6 1L11 6"
                stroke="white"
                strokeWidth="1.19"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}

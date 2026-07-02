import React, { useState, useRef } from 'react';
import AddResourceMenu from './AddResourceMenu';
import ResourceUploadComposer from './ResourceUploadComposer';
import './WorkspacePrompt.css';

export default function WorkspacePrompt({ onOpenQuickNote }) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleAddMenuSelect = (label) => {
    setIsAddMenuOpen(false);

    if (label === 'Upload file') {
      fileInputRef.current?.click();
    }

    if (label === 'Upload photo') {
      photoInputRef.current?.click();
    }

    if (label === 'Quick Note') {
      onOpenQuickNote?.();
    }
  };

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    event.target.value = '';
  }

  return (
    <div className="workspace-prompt-container">
      {isAddMenuOpen && (
        <div className="workspace-prompt-menu-layer">
          <AddResourceMenu onSelect={handleAddMenuSelect} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleFileChange}
      />

      <input
        ref={photoInputRef}
        type="file"
        hidden
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />

      {selectedFiles.length > 0 ? (
        <ResourceUploadComposer
          files={selectedFiles}
          onAddClick={() => setIsAddMenuOpen((value) => !value)}
          onRemove={(indexToRemove) => {
            setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
          }}
          onSubmit={() => {
            setSelectedFiles([]);
          }}
        />
      ) : (
        <div className="workspace-prompt-inner">
          <div className="workspace-prompt-left">
            <button
              type="button"
              className="workspace-prompt-icon-button add-button"
              aria-label="Add attachment"
              aria-expanded={isAddMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsAddMenuOpen((value) => !value)}
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
                  stroke="#111111"
                  strokeWidth="1.19"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="workspace-prompt-placeholder">
              Paste a link , note, or file...
            </div>
          </div>

          <button
            type="button"
            className="workspace-prompt-icon-button send-button"
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
      )}
    </div>
  );
}

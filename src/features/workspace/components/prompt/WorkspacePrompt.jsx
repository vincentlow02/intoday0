import React, { useState } from 'react';
import AddResourceMenu from './AddResourceMenu';
import './WorkspacePrompt.css';

export default function WorkspacePrompt({ onOpenQuickNote }) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const handleAddMenuSelect = (label) => {
    setIsAddMenuOpen(false);

    if (label === 'Quick Note') {
      onOpenQuickNote?.();
    }
  };

  return (
    <div className="workspace-prompt-container">
      {isAddMenuOpen && (
        <div className="workspace-prompt-menu-layer">
          <AddResourceMenu onSelect={handleAddMenuSelect} />
        </div>
      )}

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
              width="11"
              height="11"
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
    </div>
  );
}
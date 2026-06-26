import React from 'react';

export default function WorkspacePrompt() {
  return (
    <div className="workspace-prompt-container">
      <div className="workspace-prompt-inner">
        <button className="workspace-prompt-icon-button add-button" aria-label="Add attachment">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1V11M1 6H11" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="workspace-prompt-input-wrapper">
          <input
            type="text"
            className="workspace-prompt-input"
            placeholder="Paste a link, note, or file..."
            readOnly
          />
        </div>
        <button className="workspace-prompt-icon-button send-button" aria-label="Send message">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 13V1M6 1L1 6M6 1L11 6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

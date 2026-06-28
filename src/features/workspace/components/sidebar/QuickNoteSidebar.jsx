import React from 'react';
import './QuickNoteSidebar.css';

export default function QuickNoteSidebar({ onClose, onAddToCanvas }) {
  return (
    <aside className="quick-note-sidebar">
      <div className="quick-note-sidebar-inner">
        <div className="quick-note-main">
          <div className="quick-note-topbar">
            <button
              type="button"
              className="quick-note-collapse-button"
              aria-label="Collapse"
            >
              <svg
                width="11"
                height="12"
                viewBox="0 0 11 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 2L5 6L1 10"
                  stroke="#111111"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 2L10 6L6 10"
                  stroke="#111111"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              className="quick-note-close-button"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 3.5L8.5 8.5"
                  stroke="#111111"
                  strokeWidth="0.95"
                  strokeLinecap="round"
                />
                <path
                  d="M8.5 3.5L3.5 8.5"
                  stroke="#111111"
                  strokeWidth="0.95"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="quick-note-section">
            <div className="quick-note-divider" />

            <div className="quick-note-title-row">
              <div className="quick-note-title-icon">
                <img
                  className="quick-note-title-icon-image"
                  src="https://placehold.co/12x12"
                  alt=""
                />
              </div>

              <div className="quick-note-title-text">
                Quick Note
              </div>
            </div>

            <div className="quick-note-divider" />
          </div>

          <div className="quick-note-content">
            <input
              className="quick-note-input-title"
              type="text"
              placeholder="Untitled note"
            />

            <textarea
              className="quick-note-input-body"
              placeholder="Start typing..."
            />
          </div>
        </div>

        <div className="quick-note-footer">
          <button
            type="button"
            className="quick-note-add-button"
            onClick={onAddToCanvas}
          >
            <span className="quick-note-add-icon">
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="6.5"
                  cy="6.5"
                  r="5.9"
                  stroke="#7D7B77"
                  strokeWidth="1"
                />
                <path
                  d="M6.5 3.8V9.2"
                  stroke="#7D7B77"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <path
                  d="M3.8 6.5H9.2"
                  stroke="#7D7B77"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span className="quick-note-add-text">
              Add to Canvas
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
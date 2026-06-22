import React from 'react';

const DragDayFeedbackOverlay = ({
  direction,
  previousLabel,
  nextLabel,
  zones,
  isConfirming,
}) => {
  const renderEdge = (edgeDirection, label, arrow, width) => {
    const isActive = direction === edgeDirection;
    const stateClass = isActive ? (isConfirming ? 'is-armed' : 'is-preview') : '';

    return (
      <div
        className={`desktop-drag-day-feedback-edge desktop-drag-day-feedback-edge-${edgeDirection} ${isActive ? 'is-active' : ''} ${stateClass}`}
        style={typeof width === 'number' ? { width } : undefined}
      >
        <div className="desktop-drag-day-feedback-chip">
          {edgeDirection === 'previous' ? (
            <span className="desktop-drag-day-feedback-arrow desktop-drag-day-feedback-arrow-previous">{'<'}</span>
          ) : null}
          <div className="desktop-drag-day-feedback-copy">
            <span className="desktop-drag-day-feedback-label">{label}</span>
            {isActive ? (
              <span className="desktop-drag-day-feedback-hint">
                {isConfirming ? 'Ready to switch' : 'Hold or drag further'}
              </span>
            ) : null}
          </div>
          {edgeDirection === 'next' ? (
            <span className="desktop-drag-day-feedback-arrow desktop-drag-day-feedback-arrow-next">{'>'}</span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className={`desktop-drag-day-feedback ${direction ? 'is-visible' : ''} ${isConfirming ? 'is-confirming' : ''}`} aria-hidden="true">
      {renderEdge('previous', previousLabel, '<', zones ? Math.max(0, zones.previousEnd - zones.previousStart) : undefined)}
      {renderEdge('next', nextLabel, '>', zones ? Math.max(0, zones.nextEnd - zones.nextStart) : undefined)}
    </div>
  );
};

export default DragDayFeedbackOverlay;

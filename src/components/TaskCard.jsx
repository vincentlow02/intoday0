import React, { useState } from 'react';
import { PenLine, Trash2 } from 'lucide-react';
import { CARD_TYPES, getTaskCardPresentation, normalizeCardType } from '../taskCardUtils';
import { getCollectionItemSourceMeta } from '../lib/collectionItemUtils';
import { DESKTOP_PHOTO_CARD_HEIGHT } from '../lib/desktopConstants';

const TaskCardFaviconIcon = ({ task, appearance, cfg, faviconUrl: propFaviconUrl }) => {
  const [imgError, setImgError] = useState(false);
  const { domain } = getCollectionItemSourceMeta(task, {});
  const iconBackground = appearance === 'dark' ? cfg.darkBg : cfg.bg;
  const iconBorder = appearance === 'dark' ? `1px solid ${cfg.darkStroke}` : 'none';
  const photoPreview = task?.photoDataUrl || task?.photoUrl;

  if (normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO && photoPreview) {
    return (
        <div style={{ width: 32, height: 32, borderRadius: 11, overflow: 'hidden', background: '#f3f3f3', border: iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img
            src={photoPreview}
            alt=""
            width={32}
            height={32}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
    );
  }

  const faviconUrl = propFaviconUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null);

  if (faviconUrl && !imgError) {
    return (
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 11,
        background: appearance === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
        border: appearance === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src={faviconUrl}
          alt=""
          width={18}
          height={18}
          style={{ borderRadius: 3, objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: existing card-type icon
  return (
    <div style={{ width: 32, height: 32, borderRadius: 11, background: iconBackground, border: iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {appearance === 'dark' && cfg.darkIconColor ? (
        <div style={{
          width: 18,
          height: 18,
          backgroundColor: cfg.darkIconColor,
          maskImage: `url(${cfg.icon})`,
          WebkitMaskImage: `url(${cfg.icon})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }} />
      ) : (
        <img src={cfg.icon} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
      )}
    </div>
  );
};

const TaskCardContent = ({ task, appearance, labels }) => {
  const { cfg, displayTitle, displaySub, faviconUrl } = getTaskCardPresentation(task, labels);
  const isPhotoCard = normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO;
  const photoPreview = task?.photoDataUrl || task?.photoUrl;

  // Resolve the best available content title
  const contentTitle = (() => {
    const fetched = task.photoTitle || task.linkTitle || task.videoTitle || task.musicTitle || task.mapTitle;
    if (fetched && fetched.trim()) return fetched.trim();
    return displayTitle; // already derived (may be slug, URL slug, or platform name)
  })();

  // Source label: e.g. "ChatGPT", "YouTube", "youtube.com"
  const { label: sourceLabel } = getCollectionItemSourceMeta(task, labels || {});

  // Only show subtitle if it adds different info from the title
  const subtitle = sourceLabel && sourceLabel.toLowerCase() !== contentTitle.toLowerCase()
    ? sourceLabel
    : displaySub;

  if (isPhotoCard && photoPreview) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            width: '100%',
            height: 162,
            borderRadius: 12,
            overflow: 'hidden',
            background: appearance === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,17,0.04)',
            border: appearance === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(17,17,17,0.06)',
            flexShrink: 0,
          }}
        >
            <img
              src={photoPreview}
              alt={contentTitle || 'Photo'}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', wordBreak: 'break-word', color: 'var(--desktop-card-title)', fontSize: 13, fontWeight: 590, lineHeight: '18px' }}>
            {contentTitle}
          </div>
          <div style={{ color: 'var(--desktop-card-desc)', fontSize: 11, fontWeight: 400, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TaskCardFaviconIcon task={task} appearance={appearance} cfg={cfg} faviconUrl={faviconUrl} />
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', wordBreak: 'break-word', color: 'var(--desktop-card-title)', fontSize: 13, fontWeight: 590, lineHeight: '20px' }}>
          {contentTitle}
        </div>
        <div style={{ color: 'var(--desktop-card-desc)', fontSize: 11, fontWeight: 400, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </div>
      </div>
    </>
  );
};

const TaskCard = (props) => {
  const {
    task,
    appearance,
    onClick,
    onEdit,
    onDelete,
    onPointerDown,
    onPointerMove,
    onPointerUp,
      onPointerCancel,
      isDragging,
      isSelected,
      editLabel,
      deleteLabel,
    } = props;
  const taskCardLabels = props?.labels;

  const isPhotoCard = normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO;

  return (
      <div id={`desktop-task-wrapper-${task.id}`} className={`desktop-task-wrapper ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-selected' : ''}`}>
      <button
        id={`desktop-task-card-${task.id}`}
        type="button"
        className={`desktop-task-card ${isDragging ? 'is-dragging' : ''}`}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDragStart={(event) => event.preventDefault()}
        style={{
          width: '100%',
          minHeight: isPhotoCard ? DESKTOP_PHOTO_CARD_HEIGHT : 76,
          borderRadius: 11,
          border: '2px solid var(--desktop-task-border)',
          background: 'var(--desktop-task-bg)',
          padding: isPhotoCard ? '10px' : '12px 14px',
          display: 'flex',
          flexDirection: isPhotoCard ? 'column' : 'row',
          alignItems: isPhotoCard ? 'stretch' : 'center',
          gap: 12,
          boxShadow: 'var(--desktop-task-shadow)',
          cursor: isDragging ? 'grabbing' : 'pointer',
          textAlign: 'left',
          opacity: 1,
          transition: 'none',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <TaskCardContent
          task={task}
          appearance={appearance}
          labels={taskCardLabels}
          onDragStart={(e) => e.preventDefault()}
        />
      </button>
      <div className="desktop-task-actions">
        <button
          type="button"
          className="desktop-task-action-button desktop-task-edit-button"
          aria-label={editLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerDownCapture={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onPointerUpCapture={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.(task);
          }}
        >
          <PenLine size={14} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="desktop-task-action-button desktop-task-delete-button"
          aria-label={deleteLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerDownCapture={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onPointerUpCapture={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(task);
          }}
        >
          <Trash2 size={14} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

export { TaskCardFaviconIcon, TaskCardContent, TaskCard };

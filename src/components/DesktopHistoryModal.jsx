import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { getLogicalToday } from '../lib/dateHelpers';

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
import { getTaskCardPresentation, normalizeCardType } from '../taskCardUtils';

const getCalendarWeekdayLabels = (language) => {
  if (language === 'ZH') return ['日', '一', '二', '三', '四', '五', '六'];
  if (language === 'JA') return ['日', '月', '火', '水', '木', '金', '土'];
  if (language === 'MS') return ['AH', 'IS', 'SE', 'RA', 'KH', 'JU', 'SA'];
  if (language === 'TH') return ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
};

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="15" height="15">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ShareIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="18" cy="5" r="2.4" fill="currentColor" />
    <circle cx="6" cy="12" r="2.4" fill="currentColor" />
    <circle cx="18" cy="19" r="2.4" fill="currentColor" />
    <path d="M8.2 10.9L15.8 6.1M8.2 13.1L15.8 17.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const CopyLinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 8H5.8C4.8 8 4 8.8 4 9.8V18.2C4 19.2 4.8 20 5.8 20H14.2C15.2 20 16 19.2 16 18.2V16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9.8 4H18.2C19.2 4 20 4.8 20 5.8V14.2C20 15.2 19.2 16 18.2 16H9.8C8.8 16 8 15.2 8 14.2V5.8C8 4.8 8.8 4 9.8 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shiftDateByDays = (date, dayOffset) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  return nextDate;
};

const GroupedDateLabel = ({ labelKey }) => {
  return (
    <div style={{ fontSize: 13, color: 'var(--desktop-muted)', marginTop: 16, marginBottom: 8, paddingLeft: 12, fontWeight: 500 }}>
      {labelKey}
    </div>
  );
};

const getPackDisplayName = (tasks) => (
  tasks.find((task) => typeof task.desktopGroupName === 'string' && task.desktopGroupName.trim())?.desktopGroupName
  || tasks[0]?.text
  || 'Untitled pack'
);

const MAX_PACK_PREVIEW_ITEMS = 6;

const getShareLinkLabels = (language) => {
  if (language === 'JA') {
    return {
      copyLink: '\u30ea\u30f3\u30af\u3092\u30b3\u30d4\u30fc',
      copied: '\u30b3\u30d4\u30fc\u6e08\u307f',
      noteStart: '\u516c\u958b\u30ea\u30f3\u30af\u306f\u8ab0\u3067\u3082\u30a2\u30af\u30bb\u30b9\u53ef\u80fd\u3067\u3059\u3002\u5171\u6709\u306f',
      responsibility: '\u81ea\u5df1\u8cac\u4efb',
      noteMiddle: '\u3067\u884c\u3063\u3066\u304f\u3060\u3055\u3044\u3002',
      delete: '\u524a\u9664',
      noteEnd: '\u306f\u3044\u3064\u3067\u3082\u53ef\u80fd\u3067\u3059\u3002\u7b2c\u4e09\u8005\u30d7\u30e9\u30c3\u30c8\u30d5\u30a9\u30fc\u30e0\u3067\u5171\u6709\u3059\u308b\u5834\u5408\u3001\u305d\u306e\u30d7\u30e9\u30c3\u30c8\u30d5\u30a9\u30fc\u30e0\u306e\u30dd\u30ea\u30b7\u30fc\u304c\u9069\u7528\u3055\u308c\u307e\u3059\u3002',
    };
  }
  if (language === 'ZH') {
    return {
      copyLink: '\u590d\u5236\u94fe\u63a5',
      copied: '\u5df2\u590d\u5236',
      noteStart: '\u516c\u5f00\u94fe\u63a5\u4efb\u4f55\u4eba\u90fd\u53ef\u4ee5\u8bbf\u95ee\u3002\u5206\u4eab\u8bf7',
      responsibility: '\u81ea\u884c\u8d1f\u8d23',
      noteMiddle: '\u3002',
      delete: '\u5220\u9664',
      noteEnd: '\u94fe\u63a5\u53ef\u4ee5\u968f\u65f6\u8fdb\u884c\u3002\u5982\u679c\u901a\u8fc7\u7b2c\u4e09\u65b9\u5e73\u53f0\u5206\u4eab\uff0c\u5c06\u9002\u7528\u8be5\u5e73\u53f0\u7684\u653f\u7b56\u3002',
    };
  }
  return {
    copyLink: 'Copy link',
    copied: 'Copied',
    noteStart: 'Anyone with the public link can access this pack. Share it at your ',
    responsibility: 'own risk',
    noteMiddle: '. You can ',
    delete: 'delete',
    noteEnd: ' the link at any time. If shared on a third-party platform, that platform\'s policies apply.',
  };
};

const makePackShareUrl = (packInfo) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://intoday.prototype';
  return `${origin}/share/${encodeURIComponent(String(packInfo?.groupId || 'pack'))}`;
};

const copyShareUrlWithFallback = (shareUrl) => {
  if (typeof document === 'undefined') return;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = shareUrl;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch {
    // Prototype-only fallback: keep the UI responsive even if clipboard access is blocked.
  }
};

const PackShareLinkModal = ({ packInfo, appearance, language, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [packInfo?.groupId]);

  if (!packInfo) return null;

  const isDark = appearance === 'dark';
  const shareLabels = getShareLinkLabels(language);
  const shareUrl = makePackShareUrl(packInfo);

  const handleCopyLink = async (event) => {
    event.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        copyShareUrlWithFallback(shareUrl);
      }
    } catch {
      copyShareUrlWithFallback(shareUrl);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        background: isDark ? 'rgba(0,0,0,0.32)' : 'rgba(245,245,245,0.38)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${packInfo.packTitle} share link`}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(742px, calc(100vw - 48px))',
          borderRadius: 34,
          padding: '30px 30px 34px',
          background: isDark ? '#1F1F21' : '#FFFFFF',
          border: `1px solid ${isDark ? '#323236' : '#EFEFEF'}`,
          boxShadow: isDark ? '0 28px 70px rgba(0,0,0,0.55)' : '0 26px 64px rgba(17,17,17,0.10)',
          color: isDark ? '#F5F5F7' : '#111',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {packInfo.packTitle}
          </h2>
          <button
            type="button"
            aria-label="Close share link"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              border: 'none',
              borderRadius: '50%',
              background: 'transparent',
              color: isDark ? '#F5F5F7' : '#111',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ height: 1, background: isDark ? '#343438' : '#E6E0DA', marginTop: 16 }} />

        <div
          style={{
            marginTop: 28,
            height: 74,
            borderRadius: 999,
            background: isDark ? '#2A2A2E' : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            padding: 6,
            gap: 10,
            overflow: 'hidden',
          }}
        >
          <div
            title={shareUrl}
            style={{
              flex: 1,
              minWidth: 0,
              paddingLeft: 24,
              color: isDark ? 'rgba(255,255,255,0.45)' : '#A8AFBA',
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {shareUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              height: 62,
              minWidth: 210,
              border: 'none',
              borderRadius: 999,
              background: '#050505',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '0 28px',
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: language === 'JA' ? '0.01em' : '-0.01em',
              cursor: 'pointer',
              boxShadow: '0 10px 22px rgba(0,0,0,0.12)',
            }}
          >
            <CopyLinkIcon />
            <span>{copied ? shareLabels.copied : shareLabels.copyLink}</span>
          </button>
        </div>

        <div
          style={{
            marginTop: 30,
            display: 'grid',
            gridTemplateColumns: '22px 1fr',
            gap: 12,
            alignItems: 'start',
            color: isDark ? 'rgba(255,255,255,0.62)' : '#6E7A8A',
            fontSize: 16,
            lineHeight: 1.55,
            fontWeight: 500,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `1.4px solid ${isDark ? 'rgba(255,255,255,0.38)' : '#B6C0CC'}`,
              color: isDark ? 'rgba(255,255,255,0.56)' : '#9CA7B5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
              marginTop: 3,
            }}
          >
            i
          </span>
          <p style={{ margin: 0 }}>
            {shareLabels.noteStart}
            <span style={{ color: isDark ? '#7FB0FF' : '#2B68C8', fontWeight: 700 }}>{shareLabels.responsibility}</span>
            {shareLabels.noteMiddle}
            <span style={{ color: isDark ? '#7FB0FF' : '#2B68C8', fontWeight: 700 }}>{shareLabels.delete}</span>
            {shareLabels.noteEnd}
          </p>
        </div>
      </section>
    </div>
  );
};

const PackSearchResultCard = ({ packInfo, appearance, labels, onClickPack, onClickItem, onSharePack, onResultPointerDown, onResultPointerEnd }) => {
  const isDark = appearance === 'dark';
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const packDragTask = {
    ...packInfo.tasks[0],
    groupTaskIds: packInfo.tasks.map((task) => task.id),
    groupSize: packInfo.tasks.length,
    desktopGroupName: packInfo.packTitle,
  };

  useEffect(() => {
    if (!isExportMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  const visiblePreviewTasks = (packInfo.previewTasks || packInfo.previews || []).slice(0, MAX_PACK_PREVIEW_ITEMS);
  const hiddenPreviewCount = Math.max(0, (packInfo.previewTasks || []).length - visiblePreviewTasks.length);
  const moreLabel = (labels.plusMore || '+ {count} more').replace('{count}', hiddenPreviewCount);

  return (
    <div
      onClick={() => onClickPack(packInfo.tasks)}
      onPointerDown={(e) => onResultPointerDown?.(packDragTask, e)}
      onPointerUp={() => onResultPointerEnd?.()}
      onPointerCancel={() => onResultPointerEnd?.()}
      style={{
        background: isDark ? '#252527' : '#F8F8F8',
        border: `1px solid ${isDark ? '#333' : '#F1F1F1'}`,
        borderRadius: 8,
        padding: '14px 12px 12px',
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? '#2C2C2E' : '#F7F7F7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDark ? '#252527' : '#F8F8F8';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#FFF' : '#111', lineHeight: 1.1 }}>
          {packInfo.packTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? '#C4C4C7' : '#9A9A9A',
              background: isDark ? '#1C1C1E' : '#FFF',
              padding: '4px 10px',
              borderRadius: 999,
              cursor: 'default',
            }}
          >
            {packInfo.matchedCount} {packInfo.matchedCount === 1 ? 'item' : 'items'}
          </button>
          <div
            ref={exportMenuRef}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              onClick={() => setIsExportMenuOpen((current) => !current)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? 'rgba(255,255,255,0.64)' : '#8B8B8B',
                cursor: 'pointer',
                transition: 'color 0.16s ease',
              }}
            >
              Export
            </button>
            {isExportMenuOpen ? (
              <div
                role="menu"
                aria-label="Pack export options"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 156,
                  padding: 6,
                  borderRadius: 12,
                  background: isDark ? '#1F1F21' : 'rgba(255,255,255,0.96)',
                  border: `1px solid ${isDark ? '#343438' : '#ECE7E1'}`,
                  boxShadow: isDark ? '0 14px 30px rgba(0,0,0,0.34)' : '0 12px 28px rgba(28,23,18,0.12)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  zIndex: 2,
                }}
              >
                {[
                  { key: 'copy', label: 'Copy for AI' },
                  { key: 'markdown', label: 'Export as Markdown' },
                  { key: 'open', label: 'Open pack' },
                ].map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (action.key === 'open') {
                        onClickPack(packInfo.tasks);
                      }
                      setIsExportMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 9,
                      padding: '8px 10px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 500,
                      color: isDark ? '#E7E7EA' : '#2A2622',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.04)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Share pack"
            onClick={(event) => {
              event.stopPropagation();
              onSharePack?.(packInfo);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              width: 20,
              height: 20,
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: isDark ? 'rgba(255,255,255,0.62)' : '#8E8E8E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ShareIcon />
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '7px 8px' }}>
        {visiblePreviewTasks.map(task => {
          const { cfg, displayTitle } = getTaskCardPresentation(task, labels);
          return (
            <div
              key={task.id}
              onClick={(e) => {
                e.stopPropagation();
                onClickItem(task);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResultPointerDown?.(task, e);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onResultPointerEnd?.();
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onResultPointerEnd?.();
              }}
              style={{
                minHeight: 34,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 7,
                background: isDark ? '#1C1C1E' : '#FFF',
                border: `1px solid ${isDark ? '#333' : '#F0F0F0'}`,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#333' : '#F9F9F9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#1C1C1E' : '#FFF'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 7, background: isDark ? cfg.darkBg : cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isDark && cfg.darkIconColor ? (
                   <div style={{ width: 12, height: 12, backgroundColor: cfg.darkIconColor, maskImage: `url(${cfg.icon})`, WebkitMaskImage: `url(${cfg.icon})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
                ) : (
                   <img src={cfg.icon} alt="icon" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: isDark ? '#DDD' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayTitle}
              </div>
            </div>
          );
        })}
        {hiddenPreviewCount > 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '2px 2px 0',
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? 'rgba(255,255,255,0.48)' : '#9A9A9A',
              lineHeight: 1.3,
            }}
          >
            {moreLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
};



const HistoryTaskItem = ({ task, appearance, labels, onClick, onResultPointerDown, onResultPointerEnd }) => {
  const { cfg, displayTitle } = getTaskCardPresentation(task, labels);
  const iconBackground = appearance === 'dark' ? cfg.darkBg : cfg.bg;
  const iconBorder = appearance === 'dark' ? `1px solid ${cfg.darkStroke}` : 'none';

  const handleClick = useCallback(() => {
    onClick(task);
  }, [onClick, task]);

  const hoverBg = appearance === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={(e) => onResultPointerDown?.(task, e)}
      onPointerUp={() => onResultPointerEnd?.()}
      onPointerCancel={() => onResultPointerEnd?.()}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div style={{ width: 24, height: 24, borderRadius: 6, background: iconBackground, border: iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {appearance === 'dark' && cfg.darkIconColor ? (
          <div
            style={{
              width: 14,
              height: 14,
              backgroundColor: cfg.darkIconColor,
              maskImage: `url(${cfg.icon})`,
              WebkitMaskImage: `url(${cfg.icon})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
        ) : (
          <img src={cfg.icon} alt={normalizeCardType(task.cardType)} style={{ width: 14, height: 14, objectFit: 'contain' }} />
        )}
      </div>
      <div style={{
        flex: 1,
        minWidth: 0,
        color: 'var(--desktop-root-text)',
        fontSize: 14,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {displayTitle}
      </div>
    </button>
  );
};

const CalendarPopover = ({ open, anchorRef, language, onClose, onSelectDate, appearance }) => {
  const [calendarOffset, setCalendarOffset] = useState(0);

  if (!open || !anchorRef.current) return null;

  const logicalToday = getLogicalToday();
  const maxDate = new Date(logicalToday);
  maxDate.setDate(maxDate.getDate() + 30);

  const calendarMonth = new Date(logicalToday.getFullYear(), logicalToday.getMonth() + calendarOffset, 1);
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const localeMap = { 'ZH': 'zh-CN', 'JA': 'ja-JP', 'MS': 'ms-MY', 'TH': 'th-TH', 'EN': 'en-US' };
  const locale = localeMap[language] || 'en-US';
  const monthLabel = monthStart.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
  const startOffset = monthStart.getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const trailingCells = Math.max(0, 42 - startOffset - daysInMonth);

  const isAtMinMonth = monthStart.getFullYear() === logicalToday.getFullYear() && monthStart.getMonth() === logicalToday.getMonth();
  const isAtMaxMonth = monthStart.getFullYear() === maxDate.getFullYear() && monthStart.getMonth() === maxDate.getMonth();

  const desktopCalendarCellSize = 30;
  const desktopCalendarGap = 4;
  const calendarWeekdayLabels = getCalendarWeekdayLabels(language);
  const isDark = appearance === 'dark';

  const anchorRect = anchorRef.current.getBoundingClientRect();
  const popoverTop = anchorRect.bottom + 4;
  const popoverRight = window.innerWidth - anchorRect.right;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 900 }} onClick={onClose} />
      <div style={{
        position: 'fixed',
        top: popoverTop,
        right: popoverRight,
        width: 260,
        background: isDark ? '#2C2C2E' : '#FFF',
        border: `1px solid ${isDark ? '#444' : '#E5E5E5'}`,
        borderRadius: 11,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button type="button" disabled={isAtMinMonth} onClick={() => setCalendarOffset((prev) => prev - 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: isDark ? '#3A3A3C' : '#F5F5F5', color: isAtMinMonth ? (isDark ? '#555' : '#CCC') : (isDark ? '#FFF' : '#111'), cursor: isAtMinMonth ? 'default' : 'pointer' }}>
            {'<'}
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: isDark ? '#FFF' : '#111' }}>{monthLabel}</span>
          <button type="button" disabled={isAtMaxMonth} onClick={() => setCalendarOffset((prev) => prev + 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: isDark ? '#3A3A3C' : '#F5F5F5', color: isAtMaxMonth ? (isDark ? '#555' : '#CCC') : (isDark ? '#FFF' : '#111'), cursor: isAtMaxMonth ? 'default' : 'pointer' }}>
            {'>'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${desktopCalendarCellSize}px)`, gap: desktopCalendarGap, justifyContent: 'center' }}>
          {calendarWeekdayLabels.map((label, index) => (
            <div key={`${label}-${index}`} style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: 11, fontWeight: 700, color: isDark ? '#777' : '#999', marginBottom: 4 }}>{label}</div>
          ))}
          {Array.from({ length: startOffset }).map((_, index) => <div key={`empty-${index}`} />)}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
            const inRange = cellDate >= logicalToday && cellDate <= maxDate;
            const today = sameDay(cellDate, logicalToday);
            return (
              <button
                key={day}
                type="button"
                disabled={!inRange}
                onClick={() => {
                  if (!inRange) return;
                  onSelectDate(dateKey(cellDate));
                }}
                style={{
                  width: desktopCalendarCellSize,
                  height: desktopCalendarCellSize,
                  borderRadius: '50%',
                  border: today ? `1.5px solid ${isDark ? '#FF453A' : '#FF3B30'}` : 'none',
                  background: 'transparent',
                  color: inRange ? (isDark ? '#FFF' : '#111') : (isDark ? '#555' : '#CCC'),
                  fontSize: 13,
                  fontWeight: today ? 700 : 500,
                  cursor: inRange ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onMouseEnter={(e) => { if (inRange) e.target.style.background = isDark ? '#3A3A3C' : '#F5F5F5'; }}
                onMouseLeave={(e) => { if (inRange) e.target.style.background = 'transparent'; }}
              >
                {day}
              </button>
            );
          })}
          {Array.from({ length: trailingCells }).map((_, index) => <div key={`trail-${index}`} />)}
        </div>
      </div >
    </>
  );
};

const DesktopHistoryModal = ({ open, tasks, appearance, language, t, onClose, onTaskClick, onPackClick, onPackItemClick, onTaskPointerDown, onTaskLongPress }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sharePackInfo, setSharePackInfo] = useState(null);
  const resultLongPressTimerRef = useRef(null);
  const closeTopLayerOrModal = useCallback(() => {
    if (sharePackInfo) {
      setSharePackInfo(null);
      return;
    }
    onClose?.();
  }, [onClose, sharePackInfo]);
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeTopLayerOrModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, closeTopLayerOrModal]);
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSharePackInfo(null);
      if (resultLongPressTimerRef.current) {
        clearTimeout(resultLongPressTimerRef.current);
        resultLongPressTimerRef.current = null;
      }
    }
  }, [open]);

  const clearLongPressTimer = useCallback(() => {
    if (resultLongPressTimerRef.current) {
      clearTimeout(resultLongPressTimerRef.current);
      resultLongPressTimerRef.current = null;
    }
  }, []);

  const handleResultPointerDown = useCallback((task, event) => {
    onTaskPointerDown?.(task, event);
    clearLongPressTimer();
    resultLongPressTimerRef.current = setTimeout(() => {
      onTaskLongPress?.(task);
      resultLongPressTimerRef.current = null;
    }, 500);
  }, [clearLongPressTimer, onTaskLongPress, onTaskPointerDown]);

  const handleResultPointerEnd = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleTaskClick = useCallback((task) => {
    onTaskClick(task);
    onClose?.();
  }, [onTaskClick, onClose]);

  const handleOpenSharePack = useCallback((packInfo) => {
    setSharePackInfo(packInfo);
  }, []);

  const { matchedPacks, matchedItems } = useMemo(() => {
    if (!tasks || tasks.length === 0) return { matchedPacks: [], matchedItems: [] };

    const q = searchQuery.trim().toLowerCase();
    
    // 1. Group tasks into packs and standalone items
    const packsMap = new Map();
    const standaloneItems = [];

    tasks.forEach(task => {
      if (task.desktopGroupId) {
        if (!packsMap.has(task.desktopGroupId)) {
          packsMap.set(task.desktopGroupId, []);
        }
        packsMap.get(task.desktopGroupId).push(task);
      } else {
        standaloneItems.push(task);
      }
    });

    // 2. Evaluate Packs
    const resultPacks = [];
    packsMap.forEach((packTasks, groupId) => {
      packTasks.sort((a, b) => b.id - a.id); // newest first
      
      const packTitle = getPackDisplayName(packTasks);
      
      let matches = false;
      const matchedChildTasks = [];

      if (!q) {
        matches = true;
      } else {
        if (packTitle.toLowerCase().includes(q)) {
          matches = true;
          matchedChildTasks.push(...packTasks);
        } else {
          packTasks.forEach(pt => {
            const { displayTitle, displaySub } = getTaskCardPresentation(pt, t);
            if (displayTitle.toLowerCase().includes(q) || (displaySub && displaySub.toLowerCase().includes(q)) || pt.text.toLowerCase().includes(q)) {
              matches = true;
              matchedChildTasks.push(pt);
            }
          });
        }
      }

      if (matches) {
        const previews = q ? matchedChildTasks : packTasks;
        resultPacks.push({
          groupId,
          packTitle,
          tasks: packTasks,
          matchedCount: previews.length,
          previewTasks: previews,
          previews: previews.slice(0, MAX_PACK_PREVIEW_ITEMS),
          updatedAt: Math.max(...packTasks.map(t => t.updatedAt || t.id))
        });
      }
    });

    // 3. Evaluate Standalone Items
    const resultItems = [];
    standaloneItems.forEach(item => {
      if (!q) {
        resultItems.push(item);
      } else {
        const { displayTitle, displaySub } = getTaskCardPresentation(item, t);
        if (displayTitle.toLowerCase().includes(q) || (displaySub && displaySub.toLowerCase().includes(q)) || item.text.toLowerCase().includes(q)) {
          resultItems.push(item);
        }
      }
    });

    resultPacks.sort((a, b) => b.updatedAt - a.updatedAt);
    resultItems.sort((a, b) => {
      if (a.dateString !== b.dateString) return b.dateString.localeCompare(a.dateString);
      return b.id - a.id;
    });

    return { matchedPacks: resultPacks, matchedItems: resultItems };
  }, [tasks, searchQuery, t]);

  const isEmpty = matchedPacks.length === 0 && matchedItems.length === 0;

  if (!open) return null;

  const isDark = appearance === 'dark';
  const mutedColor = 'var(--desktop-muted)';

  return (
    <>
      <div
        role="presentation"
        onClick={closeTopLayerOrModal}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
        }}
      >
        <div
          style={{
            width: 'min(100%, 586px)',
            height: 'min(670px, calc(100vh - 56px))',
            background: isDark ? '#1C1C1E' : '#FFFFFF',
            border: `1px solid ${isDark ? '#333' : '#ECECEC'}`,
            borderRadius: 6,
            boxShadow: isDark ? '0 18px 48px rgba(0,0,0,0.5)' : '0 18px 50px rgba(17,17,17,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: '15px 16px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderBottom: `1px solid ${isDark ? '#333' : '#F1F1F1'}`,
          }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 18px',
                  borderRadius: 15,
                  border: 'none',
                  background: isDark ? '#2C2C2E' : '#F3F3F3',
                  color: 'var(--desktop-root-text)',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? '#2C2C2E' : '#FFFFFF',
                border: isDark ? '1px solid #333' : '1px solid #F0F0F0',
                color: isDark ? '#FFF' : '#111',
                boxShadow: 'none',
                backdropFilter: isDark ? 'none' : 'blur(8px)',
                WebkitBackdropFilter: isDark ? 'none' : 'blur(8px)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 22, padding: '0 18px', minHeight: 45, alignItems: 'flex-end', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            {['all', 'packs', 'items'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
                  padding: '0 0 12px',
                  fontFamily: '"DM Serif Display", "Playfair Display", Georgia, serif',
                  fontSize: 16,
                  fontWeight: activeTab === tab ? 800 : 700,
                  color: activeTab === tab ? (isDark ? '#FFF' : '#111') : (isDark ? '#777' : '#111'),
                  borderBottom: activeTab === tab ? `2px solid ${isDark ? '#FFF' : '#111'}` : '2px solid transparent',
                  textTransform: 'capitalize', transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="desktop-history-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 10px 20px', minHeight: 0 }}>
            {isEmpty ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: mutedColor, fontSize: 14 }}>
                No results found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(activeTab === 'all' || activeTab === 'packs') && matchedPacks.map(pack => (
                  <PackSearchResultCard
                    key={pack.groupId}
                    packInfo={pack}
                    appearance={appearance}
                    labels={t}
                    onClickPack={onPackClick}
                    onClickItem={onPackItemClick}
                    onSharePack={handleOpenSharePack}
                    onResultPointerDown={handleResultPointerDown}
                    onResultPointerEnd={handleResultPointerEnd}
                  />
                ))}

                {(activeTab === 'all' || activeTab === 'items') && matchedItems.map(task => (
                  <HistoryTaskItem
                    key={task.id}
                    task={task}
                    appearance={appearance}
                    labels={t}
                    onClick={handleTaskClick}
                    onResultPointerDown={handleResultPointerDown}
                    onResultPointerEnd={handleResultPointerEnd}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <PackShareLinkModal
        packInfo={sharePackInfo}
        appearance={appearance}
        language={language}
        onClose={() => setSharePackInfo(null)}
      />
    </>
  );
};

export default DesktopHistoryModal;

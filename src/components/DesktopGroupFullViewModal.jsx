import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { CloseIcon, SearchIcon, PackSelectIcon, PackExportIcon, EditIcon } from './icons/AppIcons';
import DesktopPackPageHeader from './DesktopPackPageHeader';
import DesktopDeleteConfirmModal from './DesktopDeleteConfirmModal';
import { getDesktopGroupDisplayName, getDesktopGroupDisplayTags } from '../lib/groupMetadata';
import { getTaskCardPresentation, normalizeCardType, CARD_TYPES, extractPrimaryUrl } from '../taskCardUtils';
import PackItemSourceIcon from './PackItemSourceIcon';
import { getPackItemSourceMeta, getPackExportBodyText, getPackItemPrimaryUrl } from '../lib/packItemUtils';
import { deriveTaskDisplayTitle } from '../lib/taskDisplayUtils';
import { getPackMetadataTextFromItems } from '../lib/packMetadata';
import { getUploadedFileRecord } from '../lib/uploadedFileStorage';

const PACK_FILTER_LABELS = {
  all: 'すべて',
  file: 'ファイル',
  link: 'リンク',
  memo: 'メモ',
};

const getPackRoleHeading = (role, labels = {}) => {
  const roleMap = {
    Context: labels.contextFilter || 'Context',
    Code: labels.techFilter || 'Tech',
    Notes: labels.notesFilter || 'Notes',
    Reference: labels.referenceFilter || 'Reference',
  };
  return roleMap[role] || role;
};

const getPackFilterLabel = (filter, labels = {}) => {
  return PACK_FILTER_LABELS[filter] || labels?.[`${filter}Filter`] || filter;
};

const PACK_FILE_CARD_TYPES = new Set([
  CARD_TYPES.DOCUMENT,
  CARD_TYPES.PHOTO,
]);

const PACK_LINK_CARD_TYPES = new Set([
  CARD_TYPES.LINK,
  CARD_TYPES.VIDEO,
  CARD_TYPES.PODCAST,
  CARD_TYPES.MUSIC,
  CARD_TYPES.PLACE,
  CARD_TYPES.SOCIAL,
  CARD_TYPES.SHOPPING,
  CARD_TYPES.FINANCIAL,
  CARD_TYPES.AI_TOOL,
]);

const PACK_MEMO_CARD_TYPES = new Set([
  CARD_TYPES.TEXT,
  CARD_TYPES.MEETING,
]);

const getPackTaskFilterCategories = (task) => {
  const cardType = normalizeCardType(task?.cardType);
  const categories = [];
  const hasUploadedFile = Boolean(
    task?.uploadedFileStorageKey
    || task?.uploadedFileName
    || task?.fileName
    || task?.attachmentName
    || task?.photoDataUrl
    || task?.photoUrl
  );
  const hasUrl = Boolean(extractPrimaryUrl(task?.text || '') || task?.url || task?.href || task?.linkUrl);

  if (PACK_FILE_CARD_TYPES.has(cardType) || hasUploadedFile) {
    categories.push('file');
  }

  if (PACK_LINK_CARD_TYPES.has(cardType) || (hasUrl && !PACK_FILE_CARD_TYPES.has(cardType))) {
    categories.push('link');
  }

  if (PACK_MEMO_CARD_TYPES.has(cardType) || categories.length === 0) {
    categories.push('memo');
  }

  return categories;
};

const getPackTaskRoles = (task, labels) => {
  const q = (task?.text || '').toLowerCase();
  const title = (deriveTaskDisplayTitle(task) || '').toLowerCase();
  const sourceMeta = getPackItemSourceMeta(task, labels);
  const source = sourceMeta.key.toLowerCase();
  const sourceLabel = String(sourceMeta.label || '').toLowerCase();
  const sourceDomain = String(sourceMeta.domain || '').toLowerCase();
  const tags = Array.isArray(task?.tags) ? task.tags.map((tag) => String(tag).toLowerCase()) : [];
  const cardType = normalizeCardType(task?.cardType);
  const roles = [];

  if (
    ['gpt'].includes(source)
    || q.includes('chat.openai.com')
    || q.includes('chatgpt.com')
    || q.includes('gemini.google.com')
    || q.includes('claude.ai')
    || q.includes('perplexity.ai')
    || tags.some((tag) => ['context', 'prompt', 'ai'].includes(tag))
    || ['context', 'background', 'summary', 'description', 'prompt'].some((keyword) => q.includes(keyword) || title.includes(keyword))
  ) {
    roles.push('Context');
  }

  if (
    ['github'].includes(source)
    || sourceLabel.includes('github')
    || sourceDomain.includes('github.com')
    || q.includes('github.com')
    || title.includes('github')
    || q.includes('```')
    || tags.some((tag) => ['code', 'dev', 'api', 'technical'].includes(tag))
    || ['code', 'dev', 'api', 'implementation', 'technical'].some((keyword) => q.includes(keyword) || title.includes(keyword))
  ) {
    roles.push('Code');
  }

  if (
    cardType === CARD_TYPES.TEXT
    || tags.some((tag) => ['note', 'memo', 'reminder', 'thoughts'].includes(tag))
  ) {
    if (!roles.includes('Code') && !roles.includes('Context')) {
      roles.push('Notes');
    }
  }

  if (['link', 'video', 'shopping', 'social', 'financial', 'location', 'document', 'meeting', 'music', 'podcast', 'photo'].includes(cardType)) {
    if (!roles.includes('Code') && !roles.includes('Context')) {
      roles.push('Reference');
    }
  }

  if (roles.length === 0) {
    if (cardType === CARD_TYPES.LINK) roles.push('Reference');
    else roles.push('Notes');
  }

  return roles;
};

const getPrimaryPackTaskRole = (task, labels) => {
  const roles = getPackTaskRoles(task, labels);
  const PACK_EXPORT_SECTION_ORDER = [
    { role: 'Context', heading: 'Context' },
    { role: 'Code', heading: 'Tech' },
    { role: 'Notes', heading: 'Notes' },
    { role: 'Reference', heading: 'Reference' },
  ];
  return PACK_EXPORT_SECTION_ORDER.find(({ role }) => roles.includes(role))?.role || null;
};

const getPackTasksByRole = (tasks, labels, role) => (
  tasks.filter((task) => getPrimaryPackTaskRole(task, labels) === role)
);

const sanitizePackFilename = (value) => {
  const normalized = String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return normalized || 'untitled-pack';
};

const isCodeLikeContent = (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  if (text.includes('```')) return false;
  if (/[{};]/.test(text) && /\b(const|let|var|function|return|import|export|class|if|else|await|async)\b/.test(text)) return true;
  if (/<[A-Za-z][\s\S]*>/.test(text)) return true;
  if (/^\s{2,}\S/m.test(text)) return true;
  if (/=>/.test(text)) return true;
  return false;
};

const shouldIncludePackExportUrl = (value) => /^(https?:\/\/|www\.)/i.test(String(value || '').trim());

const isBundleExportableUploadedAsset = (task) => (
  Boolean(task?.uploadedFileStorageKey)
  && ['pdf', 'word', 'image'].includes(String(task?.uploadedFileType || '').toLowerCase())
);

const isDataUrl = (value) => /^data:/i.test(String(value || '').trim());

const dataUrlToBlob = async (value) => {
  const [header, base64Data = ''] = String(value).split(',');
  const mimeMatch = /^data:([^;]+);base64$/i.exec(header || '');
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = atob(base64Data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
};

const sanitizeAssetFilename = (value, fallback = 'file') => {
  const trimmed = String(value || '').trim();
  const extensionMatch = /\.([a-z0-9]+)$/i.exec(trimmed);
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : '';
  const baseName = (extension ? trimmed.slice(0, -extension.length) : trimmed) || fallback;
  const sanitizedBase = baseName
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || fallback;
  const sanitizedExtension = extension.replace(/[^.a-z0-9]+/gi, '').toLowerCase();
  return `${sanitizedBase}${sanitizedExtension}`.toLowerCase();
};

const ensureUniqueAssetFilename = (fileName, usedNames) => {
  const extensionMatch = /(\.[a-z0-9]+)$/i.exec(fileName);
  const extension = extensionMatch ? extensionMatch[1] : '';
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  let candidate = fileName;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${baseName}-${suffix}${extension}`;
    suffix += 1;
  }
  usedNames.add(candidate);
  return candidate;
};

const collectPackAssets = async (tasks) => {
  const usedNames = new Set();
  const assetPathByStorageKey = new Map();
  const assetPathByTaskId = new Map();
  const assets = [];

  for (const task of tasks) {
    if (isBundleExportableUploadedAsset(task)) {
      const storageKey = task.uploadedFileStorageKey;
      if (assetPathByStorageKey.has(storageKey)) {
        assetPathByTaskId.set(task.id, assetPathByStorageKey.get(storageKey));
        continue;
      }

      try {
        const record = await getUploadedFileRecord(storageKey);
        if (!record?.blob) continue;

        const safeName = ensureUniqueAssetFilename(
          sanitizeAssetFilename(
            task.uploadedOriginalFileName
            || record.originalFileName
            || `${deriveTaskDisplayTitle(task) || 'file'}`
          ),
          usedNames,
        );
        const relativePath = `assets/${safeName}`;
        assetPathByStorageKey.set(storageKey, relativePath);
        assetPathByTaskId.set(task.id, relativePath);
        assets.push({
          storageKey,
          path: relativePath,
          blob: record.blob,
        });
      } catch (error) {
        console.error('Failed to collect uploaded asset for export bundle:', error);
      }
      continue;
    }

    if (normalizeCardType(task?.cardType) !== CARD_TYPES.PHOTO) continue;

    const photoReference = task?.photoDataUrl || task?.photoUrl || '';
    if (!isDataUrl(photoReference)) continue;

    try {
      const blob = await dataUrlToBlob(photoReference);
      const mimeType = blob.type || task?.photoMimeType || 'image/png';
      const extension = mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('webp') ? '.webp' : '.png';
      const safeName = ensureUniqueAssetFilename(
        sanitizeAssetFilename(
          task?.photoFileName || `${deriveTaskDisplayTitle(task) || 'image'}${extension}`
        ),
        usedNames,
      );
      const relativePath = `assets/${safeName}`;
      assetPathByTaskId.set(task.id, relativePath);
      assets.push({
        storageKey: null,
        path: relativePath,
        blob,
      });
    } catch (error) {
      console.error('Failed to collect legacy photo asset for export bundle:', error);
    }
  }

  return {
    assets,
    assetPathByStorageKey,
    assetPathByTaskId,
  };
};

const buildPackExportItemMarkdown = (task, labels, role, options = {}) => {
  const title = deriveTaskDisplayTitle(task).trim() || task?.text?.trim() || 'Untitled item';
  const sourceMeta = getPackItemSourceMeta(task, labels);
  const primaryUrl = getPackItemPrimaryUrl(task).trim();
  const bodyText = getPackExportBodyText(task);
  const cardType = normalizeCardType(task?.cardType);
  const isPhotoCard = cardType === CARD_TYPES.PHOTO;
  const assetReferencePath = (
    (task?.uploadedFileStorageKey
      ? options.assetPathByStorageKey?.get(task.uploadedFileStorageKey)
      : null)
    || options.assetPathByTaskId?.get(task?.id)
    || null
  );
  const lines = [`### ${title}`];

  if (sourceMeta?.label) {
    lines.push('');
    lines.push(`Source: ${sourceMeta.label}`);
  }

  if (assetReferencePath && !isPhotoCard) {
    lines.push(`File: ${assetReferencePath}`);
  }

  if (shouldIncludePackExportUrl(primaryUrl)) {
    lines.push(`URL: ${primaryUrl}`);
  }

  if (bodyText) {
    lines.push('');
    if (role === 'Code' && isCodeLikeContent(bodyText)) {
      lines.push('```');
      lines.push(bodyText);
      lines.push('```');
    } else {
      lines.push(bodyText);
    }
  }

  return lines.join('\n');
};

const buildPackSectionMarkdown = (tasks, labels, role, heading, options = {}) => {
  const sectionTasks = getPackTasksByRole(tasks, labels, role);
  if (!sectionTasks.length) return '';

  const lines = [`## ${heading}`, ''];
  sectionTasks.forEach((task, index) => {
    lines.push(buildPackExportItemMarkdown(task, labels, role, options));
    if (index < sectionTasks.length - 1) {
      lines.push('');
    }
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
};

const buildPackExportHeaderLines = (tasks, title) => {
  const updatedLabel = getPackMetadataTextFromItems(tasks);
  const tags = getDesktopGroupDisplayTags(tasks);
  const lines = [`# ${title}`, ''];

  lines.push(`- Updated: ${updatedLabel || 'Not available'}`);
  if (tags.length) {
    lines.push(`- Tags: ${tags.join(', ')}`);
  }

  return lines;
};

const buildRoleMarkdown = (tasks, labels, role) => {
  const PACK_EXPORT_SECTION_ORDER = [
    { role: 'Context', heading: 'Context' },
    { role: 'Code', heading: 'Tech' },
    { role: 'Notes', heading: 'Notes' },
    { role: 'Reference', heading: 'Reference' },
  ];
  const roleConfig = PACK_EXPORT_SECTION_ORDER.find((entry) => entry.role === role);
  if (!roleConfig) return '';

  const sectionTasks = getPackTasksByRole(tasks, labels, role);
  if (!sectionTasks.length) return '';

  const packTitle = getDesktopGroupDisplayName(tasks) || 'Untitled pack';
  const lines = buildPackExportHeaderLines(tasks, `${packTitle} — ${roleConfig.heading}`);
  lines.push('');
  lines.push(`## ${roleConfig.heading}`);
  lines.push('');

  sectionTasks.forEach((task, index) => {
    lines.push(buildPackExportItemMarkdown(task, labels, role));
    if (index < sectionTasks.length - 1) {
      lines.push('');
    }
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
};

const buildCopyForAIText = (tasks, labels, exportType) => {
  const packTitle = getDesktopGroupDisplayName(tasks) || 'Untitled pack';
  const PACK_EXPORT_SECTION_ORDER = [
    { role: 'Context', heading: 'Context' },
    { role: 'Code', heading: 'Tech' },
    { role: 'Notes', heading: 'Notes' },
    { role: 'Reference', heading: 'Reference' },
  ];

  if (exportType === 'all') {
    const sectionBlocks = PACK_EXPORT_SECTION_ORDER
      .map(({ role, heading }) => buildPackSectionMarkdown(tasks, labels, role, heading))
      .filter(Boolean);

    if (!sectionBlocks.length) return '';

    return [
      'Here is the context for my current task.',
      '',
      `# ${packTitle}`,
      '',
      sectionBlocks.join('\n'),
      '',
      'Please use the information above to help me with the next step.',
    ].join('\n').trim();
  }

  const roleMap = {
    context: 'Context',
    code: 'Code',
    notes: 'Notes',
    reference: 'Reference',
  };
  const role = roleMap[exportType];
  const heading = getPackRoleHeading(role, labels);
  if (!role || !heading) return '';

  const sectionBlock = buildPackSectionMarkdown(tasks, labels, role, heading);
  if (!sectionBlock) return '';

  return [
    `Here is the ${heading.toLowerCase()} for my current task.`,
    '',
    `# ${packTitle} — ${heading}`,
    '',
    sectionBlock.trim(),
    '',
    'Please use the information above to help me.',
  ].join('\n').trim();
};

const buildWholePackMarkdown = (tasks, labels, options = {}) => {
  const packTitle = getDesktopGroupDisplayName(tasks) || 'Untitled pack';
  const PACK_EXPORT_SECTION_ORDER = [
    { role: 'Context', heading: 'Context' },
    { role: 'Code', heading: 'Tech' },
    { role: 'Notes', heading: 'Notes' },
    { role: 'Reference', heading: 'Reference' },
  ];
  const sectionMap = new Map(PACK_EXPORT_SECTION_ORDER.map(({ role }) => [role, []]));

  tasks.forEach((task) => {
    const role = getPrimaryPackTaskRole(task, labels);
    if (!role || !sectionMap.has(role)) return;
    sectionMap.get(role).push(task);
  });

  const lines = buildPackExportHeaderLines(tasks, packTitle);

  PACK_EXPORT_SECTION_ORDER.forEach(({ role, heading }) => {
    const sectionTasks = sectionMap.get(role) || [];
    if (!sectionTasks.length) return;
    lines.push('');
    lines.push(`## ${heading}`);
    lines.push('');
    sectionTasks.forEach((task, index) => {
      lines.push(buildPackExportItemMarkdown(task, labels, role, options));
      if (index < sectionTasks.length - 1) {
        lines.push('');
      }
      lines.push('');
    });
    while (lines[lines.length - 1] === '') {
      if (lines[lines.length - 2]?.startsWith('## ')) break;
      lines.pop();
    }
  });

  return `${lines.join('\n').trim()}\n`;
};

const downloadBlob = (filename, blob) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

const downloadMarkdown = (filename, markdown) => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(filename, blob);
};

const copyTextToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
};

const DesktopGroupFullViewModal = ({
  view,
  appearance,
  labels,
  language,
  onClose,
  onTaskOpen,
  onTaskEdit,
  onDeleteTasks,
  onUpdateGroup,
  onToast,
}) => {
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBackdropVisible, setIsBackdropVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAtSourcePosition, setIsAtSourcePosition] = useState(false);
  const [flipSnapshot, setFlipSnapshot] = useState(null);
  const [hasOriginTransition, setHasOriginTransition] = useState(false);
  const exportMenuRef = useRef(null);
  const shellRef = useRef(null);
  const openContentTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  
  const tasks = view?.tasks || [];
  const open = Boolean(view);

  useEffect(() => {
    if (!open) {
      setItemSearchQuery('');
      setActiveFilter('all');
      setIsSearchVisible(false);
      setIsExportMenuOpen(false);
      setHighlightedTaskId(null);
      setIsSelectMode(false);
      setSelectedItemIds([]);
      setIsDeleteConfirmOpen(false);
      setIsBackdropVisible(false);
      setIsContentVisible(false);
      setIsClosing(false);
      setIsAtSourcePosition(false);
      setFlipSnapshot(null);
      setHasOriginTransition(false);
    }
  }, [open]);

  useEffect(() => () => {
    if (openContentTimerRef.current) window.clearTimeout(openContentTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!open || !view?.groupId || !shellRef.current) return;

    if (openContentTimerRef.current) window.clearTimeout(openContentTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    const finalRect = shellRef.current.getBoundingClientRect();
    const originRect = view.originRect;

    setIsClosing(false);

    if (!originRect || !finalRect.width || !finalRect.height) {
      setFlipSnapshot(null);
      setHasOriginTransition(false);
      setIsAtSourcePosition(false);
      setIsBackdropVisible(true);
      setIsContentVisible(true);
      return;
    }

    const scaleX = Math.max(0.36, originRect.width / finalRect.width);
    const scaleY = Math.max(0.22, originRect.height / finalRect.height);
    const translateX = (originRect.left + (originRect.width / 2)) - (finalRect.left + (finalRect.width / 2));
    const translateY = (originRect.top + (originRect.height / 2)) - (finalRect.top + (finalRect.height / 2));

    setFlipSnapshot({
      translateX,
      translateY,
      scaleX,
      scaleY,
    });
    setHasOriginTransition(true);
    setIsAtSourcePosition(true);
    setIsBackdropVisible(false);
    setIsContentVisible(false);

    window.requestAnimationFrame(() => {
      setIsBackdropVisible(true);
      setIsAtSourcePosition(false);
      openContentTimerRef.current = window.setTimeout(() => {
        setIsContentVisible(true);
      }, 110);
    });
  }, [open, view?.groupId]);

  useEffect(() => {
    const existingIds = new Set(tasks.map((task) => task.id));
    console.debug('[desktop-group-modal] prune selected items effect', {
      open,
      taskCount: tasks.length,
      taskIds: tasks.map((task) => task.id),
    });
    setSelectedItemIds((current) => {
      const next = current.filter((taskId) => existingIds.has(taskId));
      const changed = next.length !== current.length;
      console.debug('[desktop-group-modal] prune selected items setState', {
        previous: current,
        next,
        changed,
      });
      return changed ? next : current;
    });
  }, [tasks]);

  useEffect(() => {
    if (!open || !isExportMenuOpen) return undefined;

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
  }, [isExportMenuOpen, open]);

  useEffect(() => {
    if (!open || !view?.focusTaskId) return undefined;

    const targetId = view.focusTaskId;
    setHighlightedTaskId(targetId);
    const scrollTimer = window.setTimeout(() => {
      const node = document.getElementById(`desktop-pack-page-item-${targetId}`);
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 60);
    const clearTimer = window.setTimeout(() => {
      setHighlightedTaskId((current) => (current === targetId ? null : current));
    }, 2200);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [open, view?.focusTaskId]);
  
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Filter by visible item type tabs: ファイル / リンク / メモ.
    if (activeFilter !== 'all') {
      list = list.filter(task => {
        const categories = getPackTaskFilterCategories(task);
        return categories.includes(activeFilter);
      });
    }

    // Search filter
    if (itemSearchQuery.trim()) {
      const sq = itemSearchQuery.toLowerCase();
      list = list.filter(task => {
        const { displayTitle, displaySub } = getTaskCardPresentation(task, labels);
        const { domain } = getPackItemSourceMeta(task, labels);
        return (
          (displayTitle || '').toLowerCase().includes(sq) ||
          (displaySub || '').toLowerCase().includes(sq) ||
          (task.text || '').toLowerCase().includes(sq) ||
          (domain || '').toLowerCase().includes(sq) ||
          (task.tags || []).some(t => t.toLowerCase().includes(sq))
        );
      });
    }
    
    return list;
  }, [tasks, itemSearchQuery, activeFilter, labels]);

  if (!open || !tasks?.length) return null;

  const filters = ['all', 'file', 'link', 'memo'];
  const isDark = appearance === 'dark';
  const selectedCount = selectedItemIds.length;
  const toggleSelectItem = (taskId) => {
    setSelectedItemIds((current) => (
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    ));
  };
  const enterSelectMode = () => {
    setIsSearchVisible(false);
    setIsExportMenuOpen(false);
    setIsSelectMode(true);
    setSelectedItemIds([]);
    setIsDeleteConfirmOpen(false);
  };
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedItemIds([]);
    setIsDeleteConfirmOpen(false);
  };
  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    setIsDeleteConfirmOpen(true);
  };
  const confirmDeleteSelected = () => {
    if (selectedCount === 0) {
      setIsDeleteConfirmOpen(false);
      return;
    }
    onDeleteTasks?.(selectedItemIds);
    setIsDeleteConfirmOpen(false);
    setSelectedItemIds([]);
    setIsSelectMode(false);
  };
  const handleExportWholePack = () => {
    const markdown = buildWholePackMarkdown(tasks, labels);
    const filename = `${sanitizePackFilename(getDesktopGroupDisplayName(tasks))}.md`;
    downloadMarkdown(filename, markdown);
    setIsExportMenuOpen(false);
  };
  const handleExportPackBundle = async () => {
    try {
      const { assets, assetPathByStorageKey, assetPathByTaskId } = await collectPackAssets(tasks);
      const markdown = buildWholePackMarkdown(tasks, labels, { assetPathByStorageKey, assetPathByTaskId });
      const zip = new JSZip();
      zip.file('context.md', markdown);
      assets.forEach((asset) => {
        zip.file(asset.path, asset.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const packSlug = sanitizePackFilename(getDesktopGroupDisplayName(tasks));
      const filename = packSlug === 'untitled-pack' ? 'untitled-pack.zip' : `${packSlug}-pack.zip`;
      downloadBlob(filename, zipBlob);
    } catch (error) {
      console.error('Failed to export pack bundle:', error);
      onToast?.('Unable to export pack bundle');
    }
    setIsExportMenuOpen(false);
  };
  const handleCopyWholePackForAi = async () => {
    const text = buildCopyForAIText(tasks, labels, 'all');
    if (!text) {
      onToast?.('No pack content to copy');
      setIsExportMenuOpen(false);
      return;
    }
    try {
      await copyTextToClipboard(text);
      onToast?.('Copied whole pack for AI');
    } catch {
      onToast?.('Unable to copy whole pack');
    }
    setIsExportMenuOpen(false);
  };
  const handleCopyRoleForAi = async (role, exportType) => {
    const text = buildCopyForAIText(tasks, labels, exportType);
    const roleHeading = getPackRoleHeading(role);
    if (!text) {
      onToast?.(`No ${roleHeading} items to copy`);
      setIsExportMenuOpen(false);
      return;
    }
    try {
      await copyTextToClipboard(text);
      onToast?.(`Copied ${roleHeading} for AI`);
    } catch {
      onToast?.(`Unable to copy ${roleHeading}`);
    }
    setIsExportMenuOpen(false);
  };
  const handleExportByRole = (role) => {
    const markdown = buildRoleMarkdown(tasks, labels, role);
    const roleHeading = getPackRoleHeading(role);
    const roleSlug = roleHeading.toLowerCase();
    if (!markdown) {
      onToast?.(`No ${roleHeading} items to export`);
      setIsExportMenuOpen(false);
      return;
    }
    const filename = `${sanitizePackFilename(getDesktopGroupDisplayName(tasks))}-${roleSlug}.md`;
    downloadMarkdown(filename, markdown);
    setIsExportMenuOpen(false);
  };
  const handleExportMenuAction = (action) => {
    if (action === 'copy-for-ai') {
      handleCopyWholePackForAi();
      return;
    }
    if (action === 'copy-context') {
      handleCopyRoleForAi('Context', 'context');
      return;
    }
    if (action === 'copy-code') {
      handleCopyRoleForAi('Code', 'code');
      return;
    }
    if (action === 'copy-notes') {
      handleCopyRoleForAi('Notes', 'notes');
      return;
    }
    if (action === 'copy-reference') {
      handleCopyRoleForAi('Reference', 'reference');
      return;
    }
    if (action === 'whole-pack') {
      handleExportWholePack();
      return;
    }
    if (action === 'pack-bundle') {
      void handleExportPackBundle();
      return;
    }
    if (action === 'context') {
      handleExportByRole('Context');
      return;
    }
    if (action === 'code') {
      handleExportByRole('Code');
      return;
    }
    if (action === 'notes') {
      handleExportByRole('Notes');
      return;
    }
    if (action === 'reference') {
      handleExportByRole('Reference');
      return;
    }
    setIsExportMenuOpen(false);
  };
  const exportMenuOptions = [
    { id: 'copy-for-ai', label: 'Copy for Ai' },
    { id: 'whole-pack', label: 'Export as Markdown' },
    { id: 'pack-bundle', label: 'Download ZIP' },
  ];

  const handleRequestClose = () => {
    if (isClosing) return;

    if (openContentTimerRef.current) window.clearTimeout(openContentTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    setIsExportMenuOpen(false);
    setIsDeleteConfirmOpen(false);
    setIsContentVisible(false);
    setIsBackdropVisible(false);
    setIsClosing(true);

    closeTimerRef.current = window.setTimeout(() => {
      onClose?.();
    }, view?.originRect ? 260 : 180);
  };

  const shellMotionStyle = flipSnapshot ? {
    '--desktop-pack-flip-x': `${flipSnapshot.translateX}px`,
    '--desktop-pack-flip-y': `${flipSnapshot.translateY}px`,
    '--desktop-pack-flip-scale-x': `${flipSnapshot.scaleX}`,
    '--desktop-pack-flip-scale-y': `${flipSnapshot.scaleY}`,
  } : undefined;

  return (
    <div
      role="presentation"
      onClick={handleRequestClose}
      className="desktop-pack-page-modal"
    >
      <div className={`desktop-pack-page-backdrop ${isBackdropVisible ? 'is-visible' : ''}`} />
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-group-full-view-title"
        onClick={(event) => event.stopPropagation()}
        className={`desktop-pack-page-shell ${isDark ? 'is-dark' : ''} ${hasOriginTransition ? 'has-origin-transition' : ''} ${isAtSourcePosition ? 'is-from-card' : ''} ${isClosing ? 'is-closing' : ''}`}
        style={shellMotionStyle}
      >
        <div className={`desktop-pack-page-shell-inner ${isContentVisible ? 'is-visible' : ''}`}>
          <div className="desktop-pack-page-topbar">
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label={labels.close}
              className="desktop-pack-page-close"
            >
              <CloseIcon />
            </button>
          </div>

          <DesktopPackPageHeader
            tasks={tasks}
            onUpdateGroup={onUpdateGroup}
            appearance={appearance}
            language={language}
            labels={labels}
            isSelectMode={isSelectMode}
            selectedCount={selectedCount}
            onEnterSelectMode={enterSelectMode}
            onExitSelectMode={exitSelectMode}
            onDeleteSelected={handleDeleteSelected}
          />

          <div className="desktop-pack-page-content">
            <div className="desktop-pack-page-controls">
              <div className="desktop-pack-page-controls-bar">
                <div className="desktop-pack-page-filters" role="tablist" aria-label="Pack filters">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`desktop-pack-page-filter-btn ${activeFilter === filter ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveFilter(filter);
                        setIsSearchVisible(false);
                        setIsExportMenuOpen(false);
                      }}
                    >
                      {getPackFilterLabel(filter, labels)}
                    </button>
                  ))}
                </div>
                <div className={`desktop-pack-page-control-actions ${isSelectMode ? 'is-select-mode' : ''}`}>
                  {isSelectMode ? (
                    <button
                      type="button"
                      className="desktop-pack-page-toolbar-action desktop-pack-page-toolbar-text-action is-active"
                      onClick={exitSelectMode}
                    >
                      <PackSelectIcon />
                      <span>{labels.select || 'Select'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`desktop-pack-page-toolbar-action desktop-pack-page-search-toggle ${isSearchVisible ? 'is-active' : ''}`}
                        onClick={() => {
                          setIsSearchVisible((current) => !current);
                          setIsExportMenuOpen(false);
                        }}
                        aria-label="Search items"
                        aria-expanded={isSearchVisible}
                      >
                        <SearchIcon />
                        <span>{labels.search || 'Search'}</span>
                      </button>
                      <span className="desktop-pack-page-toolbar-divider" aria-hidden="true" />
                      <button
                        type="button"
                        className="desktop-pack-page-toolbar-action desktop-pack-page-toolbar-text-action"
                        onClick={enterSelectMode}
                      >
                        <PackSelectIcon />
                        <span>{labels.select || 'Select'}</span>
                      </button>
                      <div className="desktop-pack-page-toolbar-menu-anchor" ref={exportMenuRef}>
                        <button
                          type="button"
                          className={`desktop-pack-page-toolbar-action desktop-pack-page-toolbar-text-action ${isExportMenuOpen ? 'is-active' : ''}`}
                          aria-haspopup="menu"
                          aria-expanded={isExportMenuOpen}
                          onClick={() => setIsExportMenuOpen((current) => !current)}
                        >
                          <PackExportIcon />
                          <span>{labels.exportPack || 'Export'}</span>
                        </button>
                        {isExportMenuOpen ? (
                          <div className="desktop-pack-page-toolbar-menu" role="menu" aria-label="Export pack">
                            {exportMenuOptions.map(({ id, label }) => (
                              <button
                                key={id}
                                type="button"
                                role="menuitem"
                                className="desktop-pack-page-toolbar-menu-item"
                                onClick={() => handleExportMenuAction(id)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {isSearchVisible && (
                <div className="desktop-pack-page-search-wrapper is-revealed">
                  <SearchIcon />
                  <input
                    type="text"
                    placeholder={labels.searchInPack || 'Search in pack...'}
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className="desktop-pack-page-search-input"
                    autoFocus
                  />
                </div>
              )}
            </div>
            
            <div className="desktop-pack-page-item-list">
              {filteredTasks.length === 0 ? (
                <div className="desktop-pack-page-empty">{labels.noItemsFound || 'No items found'}</div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    id={`desktop-pack-page-item-${task.id}`}
                    className={`desktop-pack-page-item ${highlightedTaskId === task.id ? 'is-highlighted' : ''}`}
                  >
                    {isSelectMode ? (
                      <button
                        type="button"
                        className={`desktop-pack-page-item-checkbox ${selectedItemIds.includes(task.id) ? 'is-selected' : ''}`}
                        aria-pressed={selectedItemIds.includes(task.id)}
                        aria-label={`${selectedItemIds.includes(task.id) ? 'Deselect' : 'Select'} ${task.text || 'item'}`}
                        onClick={() => toggleSelectItem(task.id)}
                      >
                        <span className="desktop-pack-page-item-checkbox-mark" aria-hidden="true">
                          {selectedItemIds.includes(task.id) ? '✓' : ''}
                        </span>
                      </button>
                    ) : null}
                    {(() => {
                      const { label } = getPackItemSourceMeta(task, labels);
                      const { displayTitle } = getTaskCardPresentation(task, labels);
                      return (
                        <>
                          <PackItemSourceIcon task={task} appearance={appearance} labels={labels} />
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelectMode) {
                                toggleSelectItem(task.id);
                                return;
                              }
                              onTaskOpen(task);
                            }}
                            className="desktop-pack-page-item-main"
                          >
                            <div className="desktop-pack-page-item-title">
                              {displayTitle || task.text || 'Untitled item'}
                            </div>
                            <div className="desktop-pack-page-item-subtitle">
                              {label}
                            </div>
                          </button>
                        </>
                      );
                    })()}
                    {!isSelectMode ? (
                      <div className="desktop-pack-page-item-actions">
                        <button
                          type="button"
                          className="desktop-pack-page-item-action"
                          aria-label={`Edit ${task.text || 'item'}`}
                          onClick={() => onTaskEdit?.(task)}
                        >
                          <EditIcon />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <DesktopDeleteConfirmModal
            open={isDeleteConfirmOpen}
            title={selectedCount === 1 
              ? (labels.deleteItemQuestion || 'Delete this item?') 
              : (labels.deleteMultipleItemsQuestion || 'Delete {count} selected items?').replace('{count}', selectedCount)}
            onCancel={() => setIsDeleteConfirmOpen(false)}
            onConfirm={confirmDeleteSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default DesktopGroupFullViewModal;

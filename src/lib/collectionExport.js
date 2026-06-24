import { normalizeCardType, CARD_TYPES } from '../taskCardUtils';
import { deriveTaskDisplayTitle } from './taskDisplayUtils';
import { getUploadedFileRecord } from './uploadedFileStorage';
import JSZip from 'jszip';
import { getCollectionItemPrimaryUrl, getCollectionItemSourceMeta, getCollectionExportBodyText } from './collectionItemUtils';
import { getCollectionMetadataText } from './collectionMetadataUtils';
import { getCollectionDisplayTags, getCollectionDisplayName } from './collectionUtils';

export const COLLECTION_EXPORT_SECTION_ORDER = [
  { role: 'Context', heading: 'Context' },
  { role: 'Code', heading: 'Tech' },
  { role: 'Notes', heading: 'Notes' },
  { role: 'Reference', heading: 'Reference' },
];

export const COLLECTION_FILTER_ORDER = ['All', 'Context', 'Code', 'Notes', 'Reference'];

export const getCollectionRoleHeading = (role) => COLLECTION_EXPORT_SECTION_ORDER.find((entry) => entry.role === role)?.heading || role;

export const getCollectionFilterLabel = (filter) => (filter === 'Code' ? 'Tech' : filter);

export const getCollectionTaskRoles = (task, labels) => {
  const q = (task?.text || '').toLowerCase();
  const title = (deriveTaskDisplayTitle(task) || '').toLowerCase();
  const sourceMeta = getCollectionItemSourceMeta(task, labels);
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

export const getPrimaryCollectionTaskRole = (task, labels) => {
  const roles = getCollectionTaskRoles(task, labels);
  return COLLECTION_EXPORT_SECTION_ORDER.find(({ role }) => roles.includes(role))?.role || null;
};

export const getCollectionTasksByRole = (tasks, labels, role) => (
  tasks.filter((task) => getPrimaryCollectionTaskRole(task, labels) === role)
);

export const sanitizeCollectionFilename = (value) => {
  const normalized = String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return normalized || 'untitled-collection';
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

const shouldIncludeCollectionExportUrl = (value) => /^(https?:\/\/|www\.)/i.test(String(value || '').trim());

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

export const ensureUniqueAssetFilename = (fileName, usedNames) => {
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

export const collectCollectionAssets = async (tasks) => {
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

export const buildCollectionExportItemMarkdown = (task, labels, role, options = {}) => {
  const title = deriveTaskDisplayTitle(task).trim() || task?.text?.trim() || 'Untitled item';
  const sourceMeta = getCollectionItemSourceMeta(task, labels);
  const primaryUrl = getCollectionItemPrimaryUrl(task).trim();
  const bodyText = getCollectionExportBodyText(task);
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

  if (shouldIncludeCollectionExportUrl(primaryUrl)) {
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

export const buildCollectionSectionMarkdown = (tasks, labels, role, heading, options = {}) => {
  const sectionTasks = getCollectionTasksByRole(tasks, labels, role);
  if (!sectionTasks.length) return '';

  const lines = [`## ${heading}`, ''];
  sectionTasks.forEach((task, index) => {
    lines.push(buildCollectionExportItemMarkdown(task, labels, role, options));
    if (index < sectionTasks.length - 1) {
      lines.push('');
    }
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
};

export const buildCollectionExportHeaderLines = (tasks, title) => {
  const updatedLabel = getCollectionMetadataText(tasks);
  const tags = getCollectionDisplayTags(tasks);
  const lines = [`# ${title}`, ''];

  lines.push(`- Updated: ${updatedLabel || 'Not available'}`);
  if (tags.length) {
    lines.push(`- Tags: ${tags.join(', ')}`);
  }

  return lines;
};

export const buildRoleMarkdown = (tasks, labels, role) => {
  const roleConfig = COLLECTION_EXPORT_SECTION_ORDER.find((entry) => entry.role === role);
  if (!roleConfig) return '';

  const sectionTasks = getCollectionTasksByRole(tasks, labels, role);
  if (!sectionTasks.length) return '';

  const collectionTitle = getCollectionDisplayName(tasks) || 'Untitled collection';
  const lines = buildCollectionExportHeaderLines(tasks, `${collectionTitle} — ${roleConfig.heading}`);
  lines.push('');
  lines.push(`## ${roleConfig.heading}`);
  lines.push('');

  sectionTasks.forEach((task, index) => {
    lines.push(buildCollectionExportItemMarkdown(task, labels, role));
    if (index < sectionTasks.length - 1) {
      lines.push('');
    }
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
};

export const buildCopyForAIText = (tasks, labels, exportType) => {
  const collectionTitle = getCollectionDisplayName(tasks) || 'Untitled collection';

  if (exportType === 'all') {
    const sectionBlocks = COLLECTION_EXPORT_SECTION_ORDER
      .map(({ role, heading }) => buildCollectionSectionMarkdown(tasks, labels, role, heading))
      .filter(Boolean);

    if (!sectionBlocks.length) return '';

    return [
      'Here is the context for my current task.',
      '',
      `# ${collectionTitle}`,
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
  const heading = getCollectionRoleHeading(role);
  if (!role || !heading) return '';

  const sectionBlock = buildCollectionSectionMarkdown(tasks, labels, role, heading);
  if (!sectionBlock) return '';

  return [
    `Here is the ${heading.toLowerCase()} for my current task.`,
    '',
    `# ${collectionTitle} — ${heading}`,
    '',
    sectionBlock.trim(),
    '',
    'Please use the information above to help me.',
  ].join('\n').trim();
};

export const buildCollectionMarkdown = (tasks, labels, options = {}) => {
  const collectionTitle = getCollectionDisplayName(tasks) || 'Untitled collection';
  const sectionMap = new Map(COLLECTION_EXPORT_SECTION_ORDER.map(({ role }) => [role, []]));

  tasks.forEach((task) => {
    const role = getPrimaryCollectionTaskRole(task, labels);
    if (!role || !sectionMap.has(role)) return;
    sectionMap.get(role).push(task);
  });

  const lines = buildCollectionExportHeaderLines(tasks, collectionTitle);

  COLLECTION_EXPORT_SECTION_ORDER.forEach(({ role, heading }) => {
    const sectionTasks = sectionMap.get(role) || [];
    if (!sectionTasks.length) return;
    lines.push('');
    lines.push(`## ${heading}`);
    lines.push('');
    sectionTasks.forEach((task, index) => {
      lines.push(buildCollectionExportItemMarkdown(task, labels, role, options));
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

export const downloadBlob = (filename, blob) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

export const downloadMarkdown = (filename, markdown) => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(filename, blob);
};

export const copyTextToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
};

export const exportCollectionAsZipBundle = async (tasks, labels) => {
  const collectionTitle = getCollectionDisplayName(tasks) || 'Untitled collection';
  const safeFilename = sanitizeCollectionFilename(collectionTitle);
  const zip = new JSZip();

  const collected = await collectCollectionAssets(tasks);
  for (const asset of collected.assets) {
    zip.file(asset.path, asset.blob);
  }

  const markdownContent = buildCollectionMarkdown(tasks, labels, {
    assetPathByStorageKey: collected.assetPathByStorageKey,
    assetPathByTaskId: collected.assetPathByTaskId,
  });
  zip.file('collection.md', markdownContent);

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(`${safeFilename}.zip`, content);
};

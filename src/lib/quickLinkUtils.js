import { extractPrimaryUrl } from '../taskCardUtils';

export const QUICK_LINK_PREVIEW_VISUALS = [
  'linear-gradient(135deg, #1f2937 0%, #111827 38%, #d8dbe2 39%, #eceef4 100%)',
  'linear-gradient(135deg, #dfe7ff 0%, #f6f7fb 42%, #d7f3df 43%, #fff5cf 100%)',
  'linear-gradient(135deg, #151515 0%, #2b2b2b 52%, #e6e2da 53%, #f7f3ed 100%)',
];

export const normalizeQuickAddUrl = (value = '') => {
  const extractedUrl = extractPrimaryUrl(String(value || '').trim());
  if (!extractedUrl) return null;

  try {
    const parsed = new URL(extractedUrl.startsWith('http') ? extractedUrl : `https://${extractedUrl}`);
    return parsed.href;
  } catch (_) {
    return null;
  }
};

export const stripQuickAddUrlToken = (value = '') => String(value || '').trim().replace(/[),.;!?]+$/g, '');

export const extractQuickAddUrls = (value = '') => {
  const source = String(value || '');
  const candidates = source.match(/(?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi) || [];
  const urls = [];
  const seen = new Set();

  candidates.forEach((candidate) => {
    const normalized = normalizeQuickAddUrl(stripQuickAddUrlToken(candidate));
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    urls.push(normalized);
  });

  const fallback = normalizeQuickAddUrl(source);
  if (fallback && !seen.has(fallback)) {
    urls.push(fallback);
  }

  return urls;
};

export const formatQuickLinkTitle = (url = '') => {
  try {
    const parsed = new URL(url);
    const hostLabel = parsed.hostname.replace(/^www\./, '').split('.')[0] || 'Link';
    const pathLabel = parsed.pathname.split('/').filter(Boolean).pop();
    const formattedHost = hostLabel
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    const formattedPath = pathLabel
      ? pathLabel
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
      : '';

    if (hostLabel.toLowerCase() === 'linear') {
      return formattedPath ? `${formattedHost} Product Roadmap` : formattedHost;
    }

    if (formattedPath) {
      return `${formattedHost} ${formattedPath}`;
    }

    return formattedHost;
  } catch (_) {
    return 'Untitled Link';
  }
};

export const getQuickLinkDomain = (url = '') => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return 'link';
  }
};

export const createQuickLinkPreview = (rawValue = '') => {
  const url = normalizeQuickAddUrl(rawValue);
  if (!url) return null;

  const domain = getQuickLinkDomain(url);
  const defaultTitle = formatQuickLinkTitle(url);
  const visualIndex = [...domain].reduce((sum, char) => sum + char.charCodeAt(0), 0) % QUICK_LINK_PREVIEW_VISUALS.length;
  return {
    url,
    domain,
    title: defaultTitle,
    customTitle: defaultTitle,
    description: `Saved from ${domain}. Add this reference to your canvas for later review.`,
    visual: QUICK_LINK_PREVIEW_VISUALS[visualIndex],
  };
};

export const createQuickLinkPreviews = (rawValue = '') => (
  extractQuickAddUrls(rawValue)
    .map((url) => createQuickLinkPreview(url))
    .filter(Boolean)
);

export const removeQuickAddUrlFromText = (text = '', urlToRemove = '') => {
  const normalizedTarget = normalizeQuickAddUrl(urlToRemove);
  if (!normalizedTarget) return text;

  return String(text || '')
    .split(/(\s+)/)
    .filter((part) => {
      if (/^\s+$/.test(part)) return true;
      return normalizeQuickAddUrl(stripQuickAddUrlToken(part)) !== normalizedTarget;
    })
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const isYouTubeQuickLink = (url = '') => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be';
  } catch (_) {
    return false;
  }
};

export const fetchYouTubeQuickLinkPreview = async (url) => {
  if (!isYouTubeQuickLink(url)) return null;

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) return null;
    const data = await response.json();
    const title = String(data?.title || '').trim();
    const authorName = String(data?.author_name || '').trim();
    const thumbnailUrl = String(data?.thumbnail_url || '').trim();
    if (!title && !thumbnailUrl) return null;

    return {
      title: title || 'YouTube Video',
      customTitle: title || 'YouTube Video',
      description: authorName ? `YouTube video by ${authorName}.` : 'YouTube video reference.',
      thumbnailUrl: thumbnailUrl || null,
    };
  } catch (_) {
    return null;
  }
};

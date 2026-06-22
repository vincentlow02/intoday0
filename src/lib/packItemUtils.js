import { extractPrimaryUrl, normalizeCardType } from '../taskCardUtils';
import { deriveTaskDisplayTitle, deriveTaskDisplaySubtitle } from './taskDisplayUtils';

export const getPackItemPrimaryUrl = (task) => (
  task?.primaryUrl
  || task?.videoUrl
  || task?.mapUrl
  || task?.redirectUrl
  || extractPrimaryUrl(task?.text || '')
  || ''
);

export const getPackExportBodyText = (task) => {
  const title = deriveTaskDisplayTitle(task).trim();
  const primaryUrl = getPackItemPrimaryUrl(task).trim();
  const candidates = [
    task?.content,
    task?.body,
    task?.previewText,
    task?.preview,
    task?.description,
    task?.summary,
    task?.note,
    task?.text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (title && trimmed === title) continue;
    if (primaryUrl && trimmed === primaryUrl) continue;
    return trimmed;
  }

  return '';
};

export const getPackItemSourceMeta = (task, labels) => {
  const cardType = normalizeCardType(task?.cardType);
  const primaryUrl = getPackItemPrimaryUrl(task);
  const subtitle = deriveTaskDisplaySubtitle(task, labels) || 'Item';

  let host = '';
  let domain = '';
  try {
    if (primaryUrl) {
      const parsed = new URL(primaryUrl.startsWith('http') ? primaryUrl : `https://${primaryUrl}`);
      host = parsed.hostname.toLowerCase();
      domain = host.replace(/^www\./, '');
    }
  } catch {
    host = '';
    domain = '';
  }

  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    return { key: 'youtube', label: 'YouTube', domain: 'youtube.com' };
  }
  if (host.includes('chatgpt.com') || host.includes('openai.com')) {
    return { key: 'gpt', label: 'ChatGPT', domain: 'chatgpt.com' };
  }
  if (host.includes('notion.so') || host.includes('notion.site')) {
    return { key: 'notion', label: 'Notion', domain: 'notion.so' };
  }
  if (host.includes('github.com')) {
    return { key: 'github', label: 'GitHub', domain: 'github.com' };
  }
  if (host.includes('spotify.com') || host.includes('spoti.fi')) {
    return { key: 'spotify', label: 'Spotify', domain: 'spotify.com' };
  }
  if (host.includes('instagram.com')) {
    return { key: 'link', label: 'Instagram', domain: 'instagram.com' };
  }
  if (host.includes('twitter.com') || host.includes('x.com')) {
    return { key: 'link', label: 'X (Twitter)', domain: 'x.com' };
  }
  if (host.includes('tiktok.com')) {
    return { key: 'video', label: 'TikTok', domain: 'tiktok.com' };
  }
  if (host.includes('reddit.com')) {
    return { key: 'link', label: 'Reddit', domain: 'reddit.com' };
  }
  if (domain) {
    // generic website — use favicon
    return { key: 'link', label: domain, domain };
  }

  switch (cardType) {
    case 'photo':
      return { key: 'photo', label: labels?.photo || 'Photo', domain: null };
    case 'video':
      return { key: 'video', label: subtitle, domain: null };
    case 'document':
      return { key: 'document', label: subtitle, domain: null };
    case 'ai_tool':
      return { key: 'gpt', label: subtitle, domain: null };
    case 'text':
      return { key: 'text', label: subtitle, domain: null };
    default:
      return { key: 'link', label: subtitle, domain: null };
  }
};

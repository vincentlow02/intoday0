export const composeDesktopNoteText = (title, body) => {
  const safeTitle = title.trim() || 'Untitled note';
  const normalizedBody = String(body || '').replace(/\r\n/g, '\n');
  return normalizedBody ? `${safeTitle}\n${normalizedBody}` : safeTitle;
};

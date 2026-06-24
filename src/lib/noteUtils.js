export const composeDesktopNoteText = (title, body) => {
  const safeTitle = (title || '').replace(/\n/g, ' '); // Ensure title is strictly one line
  const normalizedBody = String(body || '').replace(/\r\n/g, '\n');
  return `${safeTitle}\n${normalizedBody}`;
};

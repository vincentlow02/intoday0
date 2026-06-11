export const MAX_CONVERT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const convertDocumentFileToMarkdown = async (file) => {
  if (!(file instanceof File)) {
    throw new Error('Please choose a file first.');
  }

  if (file.size > MAX_CONVERT_FILE_SIZE_BYTES) {
    throw new Error('Please choose a file smaller than 10MB.');
  }

  const lowerName = String(file.name || 'document').toLowerCase();
  if (file.type.startsWith('text/') || /\.(md|markdown|txt|csv|json)$/i.test(lowerName)) {
    return file.text();
  }

  return [
    `# ${file.name || 'Uploaded document'}`,
    '',
    'This UI prototype does not run backend document conversion.',
    'The uploaded file is represented here as local mock content for presentation and testing.',
  ].join('\n');
};

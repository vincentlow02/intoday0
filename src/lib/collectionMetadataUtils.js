export const RECENT_COLLECTION_UPDATE_HOURS = 24;
export const UPDATED_RECENTLY_LABEL = 'Updated recently';

const SAME_YEAR_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const normalizeDate = (value) => {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const createUpdatedTimestamp = (date = new Date()) => date.toISOString();

export const getCollectionUpdatedAt = (items = []) => {
  const values = Array.isArray(items) ? items : [items];
  let latestDate = null;

  values.forEach((item) => {
    const candidate = normalizeDate(item?.updatedAt || item?.updated_at);
    if (!candidate) return;
    if (!latestDate || candidate > latestDate) {
      latestDate = candidate;
    }
  });

  return latestDate;
};

export const formatCollectionUpdatedDate = (value, now = new Date()) => {
  const updatedDate = normalizeDate(value);
  if (!updatedDate) return '';

  if (updatedDate.getFullYear() !== now.getFullYear()) {
    return `${updatedDate.getFullYear()}/${updatedDate.getMonth() + 1}/${updatedDate.getDate()}`;
  }

  return SAME_YEAR_DATE_FORMATTER.format(updatedDate);
};

export const getCollectionMetadataTextRaw = (
  updatedAt,
  { now = new Date(), recentUpdateHours = RECENT_COLLECTION_UPDATE_HOURS } = {},
) => {
  const updatedDate = normalizeDate(updatedAt);
  if (!updatedDate) return '';

  const thresholdMs = recentUpdateHours * 60 * 60 * 1000;
  if ((now.getTime() - updatedDate.getTime()) <= thresholdMs) {
    return UPDATED_RECENTLY_LABEL;
  }

  return formatCollectionUpdatedDate(updatedDate, now);
};

export const getCollectionMetadataText = (items, options) =>
  getCollectionMetadataTextRaw(getCollectionUpdatedAt(items), options);

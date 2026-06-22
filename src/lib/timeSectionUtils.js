import { sections } from './desktopConstants';

export const sectionIdToMobileId = (sectionId) => {
  const matched = sections.find((section) => section.id === sectionId);
  return matched?.mobileId || 'Morning';
};

export const mobileIdToSectionId = (mobileId) => {
  const matched = sections.find((section) => section.mobileId === mobileId);
  return matched?.id || 'morning';
};

export const currentSection = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

export const getDesktopSectionPillStyle = (section, appearance) => (
  appearance === 'dark'
    ? {
      background: section.darkPillBg,
      color: section.darkPillColor,
      border: `1px solid ${section.darkPillBorder}`,
      WebkitTextStroke: `0.2px ${section.darkPillBorder}`,
    }
    : {
      background: section.pillBg,
      color: section.pillColor,
      border: 'none',
      WebkitTextStroke: '0',
    }
);

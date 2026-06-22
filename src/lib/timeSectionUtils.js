import { sections } from './desktopConstants';
import { DAY_BOUNDARY_HOUR, getLogicalToday } from './dateHelpers';
import { sameDay } from './dateUtils';

const DESKTOP_TIME_AXIS_LINE_TOP = 26;
const DESKTOP_TIME_AXIS_LINE_BOTTOM = 36;
const DESKTOP_TIME_MARKER_SIZE = 7;

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

export const getSectionBounds = (section, logicalDate) => {
  const baseDate = new Date(logicalDate);
  baseDate.setHours(0, 0, 0, 0);

  const [startHour, startMinute] = section.start.split(':').map(Number);
  const [endHour, endMinute] = section.end.split(':').map(Number);

  const sectionStart = new Date(baseDate);
  sectionStart.setHours(startHour, startMinute, 0, 0);
  if (startHour < DAY_BOUNDARY_HOUR) {
    sectionStart.setDate(sectionStart.getDate() + 1);
  }

  const sectionEnd = new Date(baseDate);
  sectionEnd.setHours(endHour, endMinute, 0, 0);
  if (sectionEnd <= sectionStart) {
    sectionEnd.setDate(sectionEnd.getDate() + 1);
  }

  return { sectionStart, sectionEnd };
};

export const getSectionMarkerStyle = (section, currentTime, selectedDate) => {
  const logicalToday = getLogicalToday(currentTime);
  const logicalSelectedDate = new Date(selectedDate);
  logicalSelectedDate.setHours(0, 0, 0, 0);

  if (!sameDay(logicalSelectedDate, logicalToday)) return null;

  const { sectionStart, sectionEnd } = getSectionBounds(section, logicalSelectedDate);

  if (currentTime < sectionStart || currentTime >= sectionEnd) return null;

  const progress = Math.max(
    0,
    Math.min(1, (currentTime.getTime() - sectionStart.getTime()) / (sectionEnd.getTime() - sectionStart.getTime())),
  );

  return {
    top: `calc(${DESKTOP_TIME_AXIS_LINE_TOP}px + ((100% - ${DESKTOP_TIME_AXIS_LINE_TOP}px - ${DESKTOP_TIME_AXIS_LINE_BOTTOM}px) * ${progress}) - ${(DESKTOP_TIME_MARKER_SIZE / 2)}px)`,
  };
};


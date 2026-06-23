import { useState, useEffect, useCallback } from 'react';
import { getLogicalToday } from '../lib/dateHelpers';
import { getInitialLanguage } from '../lib/language';
import {
  parseSharedSelectedDate,
  dateKey,
} from '../lib/dateUtils';
import {
  SHARED_SELECTED_DATE_KEY,
  DESKTOP_LANGUAGE_KEY,
  DESKTOP_APPEARANCE_KEY,
} from '../lib/desktopConstants';

export const normalizeDesktopAppearancePreference = (value) => (
  ['light', 'dark'].includes(value) ? value : 'dark'
);

export const useDesktopPreferences = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = parseSharedSelectedDate(localStorage.getItem(SHARED_SELECTED_DATE_KEY));
    return savedDate || getLogicalToday();
  });

  const [language, setLanguage] = useState(getInitialLanguage);

  const [appearancePreference, setAppearancePreferenceState] = useState(() => (
    normalizeDesktopAppearancePreference(localStorage.getItem(DESKTOP_APPEARANCE_KEY))
  ));

  const setAppearancePreference = useCallback((value) => {
    setAppearancePreferenceState(normalizeDesktopAppearancePreference(value));
  }, []);

  const appearance = appearancePreference;

  const [profileOpen, setProfileOpenState] = useState(false);
  const setProfileOpen = useCallback((val) => {
    sessionStorage.setItem('shared_profile_open', String(Boolean(val)));
    setProfileOpenState(val);
  }, []);

  const [historyOpen, setHistoryOpenState] = useState(false);
  const setHistoryOpen = useCallback((val) => {
    sessionStorage.setItem('shared_history_open', String(Boolean(val)));
    setHistoryOpenState(val);
  }, []);

  // Sync selectedDate to localStorage
  useEffect(() => {
    localStorage.setItem(SHARED_SELECTED_DATE_KEY, dateKey(selectedDate));
  }, [selectedDate]);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem(DESKTOP_LANGUAGE_KEY, language);
  }, [language]);

  // Sync appearancePreference to localStorage
  useEffect(() => {
    localStorage.setItem(DESKTOP_APPEARANCE_KEY, appearancePreference);
  }, [appearancePreference]);

  // Initial sessionStorage reset for shared profile/history open flags
  useEffect(() => {
    sessionStorage.setItem('shared_profile_open', 'false');
    sessionStorage.setItem('shared_history_open', 'false');
  }, []);

  // Listen for storage changes to sync appearancePreference across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === DESKTOP_APPEARANCE_KEY && e.newValue) {
        setAppearancePreference(normalizeDesktopAppearancePreference(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setAppearancePreference]);

  return {
    selectedDate,
    setSelectedDate,
    language,
    setLanguage,
    appearancePreference,
    setAppearancePreference,
    appearance,
    profileOpen,
    setProfileOpen,
    historyOpen,
    setHistoryOpen,
  };
};

import { dateKey } from '../lib/dateUtils';
import { getLogicalToday } from '../lib/dateHelpers';

const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const createMockTasks = () => {
  const today = getLogicalToday();
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));
  const yesterdayKey = dateKey(addDays(today, -1));
  const workspaceId = 'workspace-untitled-3';
  const groupId = 'mock-pack-resume';

  return [
    {
      id: 1001,
      text: 'Review IntoDay desktop interaction notes',
      completed: false,
      dateString: todayKey,
      timeOfDay: 'Morning',
      desktopWorkspaceId: workspaceId,
      desktopCanvasX: 0,
      desktopCanvasY: 0,
      desktopZ: 10,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 1002,
      text: 'https://github.com/DavidOng122/intoday',
      completed: false,
      dateString: todayKey,
      timeOfDay: 'Afternoon',
      desktopWorkspaceId: workspaceId,
      desktopCanvasX: 380,
      desktopCanvasY: 0,
      desktopZ: 20,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 1003,
      text: 'https://www.behance.net/',
      completed: false,
      dateString: todayKey,
      timeOfDay: 'Evening',
      desktopWorkspaceId: workspaceId,
      desktopCanvasX: 0,
      desktopCanvasY: 170,
      desktopZ: 30,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 1004,
      text: 'Resume inspiration',
      completed: false,
      dateString: todayKey,
      timeOfDay: 'Morning',
      desktopWorkspaceId: workspaceId,
      desktopGroupId: groupId,
      desktopGroupName: 'Resume',
      desktopGroupIcon: '💜',
      desktopGroupTags: ['Content', 'Reference'],
      desktopCollectionLabel: 'School work',
      desktopCanvasX: 380,
      desktopCanvasY: 170,
      desktopZ: 40,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 1005,
      text: 'Portfolio layout references',
      completed: false,
      dateString: todayKey,
      timeOfDay: 'Morning',
      desktopWorkspaceId: workspaceId,
      desktopGroupId: groupId,
      desktopGroupName: 'Resume',
      desktopGroupIcon: '💜',
      desktopGroupTags: ['Content', 'Reference'],
      desktopCollectionLabel: 'School work',
      desktopCanvasX: 380,
      desktopCanvasY: 170,
      desktopZ: 41,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 1006,
      text: 'Prepare prototype walkthrough',
      completed: false,
      dateString: tomorrowKey,
      timeOfDay: 'Afternoon',
      desktopWorkspaceId: workspaceId,
      desktopCanvasX: 0,
      desktopCanvasY: 0,
      desktopZ: 50,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 1007,
      text: 'Yesterday research notes',
      completed: true,
      dateString: yesterdayKey,
      timeOfDay: 'Night',
      desktopWorkspaceId: workspaceId,
      desktopCanvasX: 0,
      desktopCanvasY: 0,
      desktopZ: 60,
      updatedAt: new Date().toISOString(),
    }
  ];
};

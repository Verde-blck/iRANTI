import { TRIAL_DAYS } from '../config/constants';
import type { Priority, RepeatKind } from '../types/task';

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const en = {
  brand: 'iRANTI',
  header: {
    tagline: 'Reminders that wake the screen',
  },
  license: {
    booting: 'Checking',
    trial: (remaining: string) => `Trial ${remaining} left`,
    premium: 'Premium',
    expired: 'Trial ended',
    tampered: 'Licence locked',
  },
  next: {
    label: 'Next reminder in',
    emptyTitle: 'No reminders set',
    emptyBody: 'Add a reminder to any task and iRANTI will wake the screen when it is due.',
  },
  delivery: {
    deep: 'Wakes screen',
    standard: 'Standard',
  },
  readiness: {
    title: 'Some alerts may not get through',
    notifications: 'Notifications are switched off',
    exactAlarms: 'Exact alarms are blocked',
    fullScreen: 'Lock-screen alerts are switched off',
    criticalAlerts: 'Alarm sound is switched off',
    batteryUnrestricted: 'Battery saving may delay alerts',
    fix: 'Fix',
  },
  list: {
    active: 'To do',
    done: 'Done',
    clear: 'Clear done',
  },
  empty: {
    activeTitle: 'Nothing to do',
    activeBody: 'Tap + to add a task.',
    doneTitle: 'Nothing completed yet',
    doneBody: 'Finished tasks will appear here.',
    searchTitle: 'No matching tasks',
    searchBody: 'Try another word, or clear the search.',
    listTitle: 'This list is empty',
    listBody: 'Tap + to add a task to it.',
  },
  lists: {
    inbox: 'Inbox',
    all: 'All',
    newList: 'New list',
    holdHint: 'Hold a list to rename or delete it.',
    editorNewTitle: 'New list',
    editorEditTitle: 'Edit list',
    nameLabel: 'Name',
    namePlaceholder: 'Work, Home, Exams…',
    create: 'Create list',
    save: 'Save',
    delete: 'Delete list',
    deleteNote: 'Its tasks will move to Inbox.',
    inboxNote: 'Inbox can be renamed but not deleted.',
    cancel: 'Cancel',
    errors: {
      name_required: 'Give the list a name.',
      name_taken: 'You already have a list with that name.',
      limit_reached: 'You have reached the limit of 30 lists.',
      generic: 'The list did not save. Try again.',
    },
  },
  backup: {
    open: 'Backup',
    title: 'Backup',
    intro:
      'Save all your tasks and lists to a file, for example in Google Drive, so you can restore them on this phone or a new one.',
    lastSaved: (when: string) => `Last backup: ${when}`,
    never: 'No backup saved yet.',
    save: 'Save a backup',
    restore: 'Restore from a backup',
    restoreNote:
      'Restoring keeps the tasks already on this phone. Any task that is also in the backup is replaced by the backup’s version.',
    close: 'Close',
    saved: 'Backup saved.',
    restored: (tasks: number, lists: number) =>
      `Restored ${count(tasks, 'task')} and ${count(lists, 'list')}.`,
    confirmTitle: 'Restore this backup?',
    confirmBody: (tasks: number, lists: number, when: string | null) =>
      `It contains ${count(tasks, 'task')} and ${count(lists, 'list')}${
        when ? `, saved ${when}` : ''
      }.`,
    confirm: 'Restore',
    cancel: 'Cancel',
    errors: {
      not_json: 'That file isn’t an iRANTI backup.',
      not_iranti: 'That file isn’t an iRANTI backup.',
      newer_format:
        'This backup was made by a newer version of iRANTI. Update the app, then try again.',
      too_large: 'That file is too large to be an iRANTI backup.',
      failed: 'That didn’t work. Try again.',
    },
  },
  search: {
    placeholder: 'Search tasks',
    clear: 'Clear search',
  },
  task: {
    noReminder: 'No reminder',
    missed: 'Missed',
    done: 'Done',
    markComplete: 'Mark complete',
    markIncomplete: 'Mark incomplete',
    steps: (done: number, total: number) => `${done}/${total} steps`,
    repeats: {
      daily: 'Repeats daily',
      weekdays: 'Repeats on weekdays',
      weekly: 'Repeats weekly',
      monthly: 'Repeats monthly',
    } as Record<RepeatKind, string>,
  },
  priority: {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    critical: 'Critical',
  } as Record<Priority, string>,
  composer: {
    newTitle: 'New task',
    editTitle: 'Edit task',
    titleLabel: 'Task',
    titlePlaceholder: 'What needs doing?',
    notesLabel: 'Notes',
    notesPlaceholder: 'Optional detail',
    priorityLabel: 'Priority',
    reminderLabel: 'Reminder',
    listLabel: 'List',
    checklistLabel: 'Checklist',
    checklistPlaceholder: 'Add a step',
    addStep: 'Add step',
    removeStep: (title: string) => `Remove step: ${title}`,
    stepDone: (title: string) => `Step done: ${title}`,
    stepNotDone: (title: string) => `Step not done: ${title}`,
    create: 'Add task',
    save: 'Save changes',
    delete: 'Delete task',
    cancel: 'Cancel',
    errors: {
      title_required: 'Give the task a title.',
      reminder_in_past: 'Pick a reminder time in the future.',
      generic: 'The task did not save. Try again.',
    },
  },
  repeat: {
    label: 'Repeat',
    never: 'Never',
    options: {
      daily: 'Every day',
      weekdays: 'Weekdays',
      weekly: 'Every week',
      monthly: 'Every month',
    } as Record<RepeatKind, string>,
    hint: 'Marking a repeating task complete moves it to the next time.',
  },
  reminder: {
    none: 'None',
    plus15: 'In 15 min',
    plus60: 'In 1 hour',
    tonight: 'Tonight 21:00',
    morning: 'Tomorrow 08:00',
    custom: 'Pick a time',
    off: 'No reminder',
  },
  time: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
  },
  paywall: {
    title: 'Keep deep alerts on',
    expiredMessage: `Your ${TRIAL_DAYS}-day screen-off notification trial has concluded. Activate Premium to maintain deep hardware alerts.`,
    trialMessage: (remaining: string) =>
      `Your screen-off trial has ${remaining} left. Premium keeps deep hardware alerts running after it ends.`,
    activeMessage: 'Premium is active. Every reminder will wake the screen.',
    configuredNote: 'This reminder will still arrive as a standard notification.',
    executedNote: 'Your last reminder arrived as a standard notification.',
    perks: [
      'The screen wakes for every reminder',
      'Full-screen alerts over the lock screen',
      'Alarm sound that plays through silent mode',
    ],
    activate: 'Activate Premium',
    activateWithPrice: (price: string) => `Activate Premium for ${price}`,
    restore: 'Restore purchase',
    dismiss: 'Not now',
    close: 'Close',
    restoreNone: 'No earlier Premium purchase was found on this account.',
    unavailable: 'The store is unavailable. Check your connection and try again.',
  },
  alarm: {
    scheduled: (clock: string) => `Set for ${clock}`,
    complete: 'Mark complete',
    snooze: (minutes: number) => `Snooze ${minutes} min`,
    dismiss: 'Dismiss',
    fallbackBody: {
      low: 'Low priority task due',
      normal: 'Task due now',
      high: 'High priority task due',
      critical: 'Critical task due now',
    } as Record<Priority, string>,
  },
  boot: {
    failed: 'Secure storage could not be opened. Restart the app, or try again.',
    retry: 'Try again',
  },
};

export type Strings = typeof en;

const catalogue: Record<string, Strings> = { en };

function resolveLanguage(): string {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0] ?? 'en';
  } catch {
    return 'en';
  }
}

export const strings: Strings = catalogue[resolveLanguage()] ?? en;

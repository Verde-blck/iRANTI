import { strings } from '../i18n/strings';

const DAY_MS = 86_400_000;
const clockFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const pad = (value: number) => value.toString().padStart(2, '0');

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function formatClock(timestamp: number): string {
  return clockFormat.format(new Date(timestamp));
}

export function formatDay(timestamp: number, now = Date.now()): string {
  const offset = Math.round((startOfDay(timestamp) - startOfDay(now)) / DAY_MS);
  if (offset === 0) {
    return strings.time.today;
  }
  if (offset === 1) {
    return strings.time.tomorrow;
  }
  if (offset === -1) {
    return strings.time.yesterday;
  }
  return dayFormat.format(new Date(timestamp));
}

export function formatWhen(timestamp: number, now = Date.now()): string {
  return `${formatDay(timestamp, now)} ${formatClock(timestamp)}`;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function ceilToMinute(timestamp: number): number {
  return Math.ceil(timestamp / 60000) * 60000;
}

export function nextOccurrence(hour: number, minute: number, now = Date.now()): number {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= now) {
    date.setDate(date.getDate() + 1);
  }
  return date.getTime();
}

export function tomorrowAt(hour: number, minute: number, now = Date.now()): number {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

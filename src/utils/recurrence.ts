import type { Repeat } from '../types/task';

function at(year: number, month: number, day: number, anchor: Date): Date {
  return new Date(year, month, day, anchor.getHours(), anchor.getMinutes(), 0, 0);
}

function matchesDay(kind: Repeat['kind'], date: Date, anchor: Date): boolean {
  if (kind === 'weekdays') {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }
  if (kind === 'weekly') {
    return date.getDay() === anchor.getDay();
  }
  return true;
}

export function nextOccurrence(repeat: Repeat, after: number): number {
  if (repeat.anchor > after) {
    return repeat.anchor;
  }
  const anchor = new Date(repeat.anchor);
  const base = new Date(after);
  if (repeat.kind === 'monthly') {
    const wanted = anchor.getDate();
    for (let offset = 0; offset <= 13; offset += 1) {
      const year = base.getFullYear();
      const month = base.getMonth() + offset;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const candidate = at(year, month, Math.min(wanted, lastDay), anchor);
      if (candidate.getTime() > after) {
        return candidate.getTime();
      }
    }
  } else {
    for (let offset = 0; offset <= 8; offset += 1) {
      const candidate = at(base.getFullYear(), base.getMonth(), base.getDate() + offset, anchor);
      if (candidate.getTime() > after && matchesDay(repeat.kind, candidate, anchor)) {
        return candidate.getTime();
      }
    }
  }
  return after + 86_400_000;
}

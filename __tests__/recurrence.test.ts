import type { Repeat } from '../src/types/task';
import { nextOccurrence } from '../src/utils/recurrence';

const local = (y: number, m: number, d: number, h = 8, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const repeat = (kind: Repeat['kind'], anchor: number): Repeat => ({ kind, anchor });

describe('nextOccurrence', () => {
  it('returns the anchor while it is still ahead', () => {
    expect(nextOccurrence(repeat('daily', local(2026, 12, 1)), local(2026, 11, 30))).toBe(
      local(2026, 12, 1),
    );
  });

  it('repeats daily at the same time', () => {
    const anchor = local(2026, 11, 2, 8, 30);
    expect(nextOccurrence(repeat('daily', anchor), local(2026, 11, 5, 9))).toBe(
      local(2026, 11, 6, 8, 30),
    );
    expect(nextOccurrence(repeat('daily', anchor), local(2026, 11, 5, 7))).toBe(
      local(2026, 11, 5, 8, 30),
    );
  });

  it('skips Saturday and Sunday for weekdays', () => {
    const anchor = local(2026, 11, 2);
    expect(new Date(local(2026, 11, 6)).getDay()).toBe(5);
    expect(nextOccurrence(repeat('weekdays', anchor), local(2026, 11, 6, 9))).toBe(
      local(2026, 11, 9),
    );
  });

  it('repeats weekly on the anchor weekday', () => {
    const anchor = local(2026, 11, 4);
    expect(nextOccurrence(repeat('weekly', anchor), local(2026, 11, 4, 9))).toBe(
      local(2026, 11, 11),
    );
    expect(nextOccurrence(repeat('weekly', anchor), local(2026, 11, 9))).toBe(local(2026, 11, 11));
  });

  it('falls back to the last day in shorter months, then returns to the anchor day', () => {
    const anchor = local(2027, 1, 31);
    expect(nextOccurrence(repeat('monthly', anchor), local(2027, 1, 31, 9))).toBe(
      local(2027, 2, 28),
    );
    expect(nextOccurrence(repeat('monthly', anchor), local(2027, 2, 28, 9))).toBe(
      local(2027, 3, 31),
    );
  });

  it('always moves strictly past the given time', () => {
    const anchor = local(2026, 11, 2);
    expect(nextOccurrence(repeat('daily', anchor), local(2026, 11, 10))).toBe(local(2026, 11, 11));
  });
});

import { TRIAL_DAYS, TRIAL_WINDOW_SECONDS } from '../src/config/constants';
import { canDeepWakeAt, computeLicense, wakeDeadline } from '../src/services/licenseMath';

const FIRST = Date.UTC(2026, 10, 1, 9, 0, 0);
const at = (seconds: number) => FIRST + seconds * 1000;

const base = { firstLaunchAt: FIRST, anchorValid: true, premiumActive: false };

describe('trial length', () => {
  it('runs for 22 days, which is 1900800 seconds', () => {
    expect(TRIAL_DAYS).toBe(22);
    expect(TRIAL_WINDOW_SECONDS).toBe(1900800);
  });
});

describe('computeLicense', () => {
  it('reports an active trial inside the window', () => {
    const snapshot = computeLicense({ ...base, now: at(3600), lastSeenAt: at(3500) });
    expect(snapshot.status).toBe('trial');
    expect(snapshot.deepWakeAllowed).toBe(true);
    expect(snapshot.remainingMs).toBe((TRIAL_WINDOW_SECONDS - 3600) * 1000);
  });

  it('keeps the trial at exactly 1900800 seconds', () => {
    expect(computeLicense({ ...base, now: at(TRIAL_WINDOW_SECONDS), lastSeenAt: 0 }).status).toBe(
      'trial',
    );
  });

  it('expires once the delta exceeds 1900800 seconds', () => {
    const snapshot = computeLicense({ ...base, now: at(TRIAL_WINDOW_SECONDS + 1), lastSeenAt: 0 });
    expect(snapshot.status).toBe('expired');
    expect(snapshot.deepWakeAllowed).toBe(false);
  });

  it('lets premium override an expired window', () => {
    const snapshot = computeLicense({
      ...base,
      premiumActive: true,
      now: at(TRIAL_WINDOW_SECONDS * 3),
      lastSeenAt: 0,
    });
    expect(snapshot.status).toBe('premium');
    expect(wakeDeadline(snapshot)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('flags a clock rolled back beyond tolerance', () => {
    const snapshot = computeLicense({ ...base, now: at(1000), lastSeenAt: at(1000 + 3600) });
    expect(snapshot.status).toBe('tampered');
  });

  it('flags an anchor whose signature failed', () => {
    expect(computeLicense({ ...base, anchorValid: false, now: at(10), lastSeenAt: 0 }).status).toBe(
      'tampered',
    );
  });
});

describe('canDeepWakeAt', () => {
  const trial = computeLicense({ ...base, now: at(60), lastSeenAt: 0 });

  it('allows reminders that fire inside the window', () => {
    expect(canDeepWakeAt(trial, at(TRIAL_WINDOW_SECONDS - 1))).toBe(true);
  });

  it('gates reminders that fire after the window', () => {
    expect(canDeepWakeAt(trial, at(TRIAL_WINDOW_SECONDS + 60))).toBe(false);
  });

  it('seals the trial end as the native wake deadline', () => {
    expect(wakeDeadline(trial)).toBe(at(TRIAL_WINDOW_SECONDS));
  });
});

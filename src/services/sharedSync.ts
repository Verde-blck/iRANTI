import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { accountStore } from './accountService';
import { firestore } from './firebase';
import { resyncAll } from './reminderEngine';
import {
  clearShared,
  setSharedUser,
  setSpaces,
  setSpaceTasks,
  sharedStore,
  toSpace,
  type SharedSpace,
} from './sharedStore';

let started = false;
let activeUid: string | null = null;
let spacesUnsubscribe: Unsubscribe | null = null;
const taskUnsubscribes = new Map<string, Unsubscribe>();
let resyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleResync(): void {
  if (resyncTimer) {
    clearTimeout(resyncTimer);
  }
  resyncTimer = setTimeout(() => {
    resyncTimer = null;
    resyncAll().catch(() => undefined);
  }, 400);
}

function syncTaskSubscriptions(spaces: SharedSpace[]): void {
  const ids = new Set(spaces.map(space => space.id));
  taskUnsubscribes.forEach((unsubscribe, id) => {
    if (!ids.has(id)) {
      unsubscribe();
      taskUnsubscribes.delete(id);
    }
  });
  spaces.forEach(space => {
    if (taskUnsubscribes.has(space.id)) {
      return;
    }
    taskUnsubscribes.set(
      space.id,
      onSnapshot(
        collection(firestore(), 'spaces', space.id, 'tasks'),
        snapshot =>
          setSpaceTasks(
            space.id,
            snapshot.docs.map(item => ({ id: item.id, ...item.data() })),
          ),
        () => undefined,
      ),
    );
  });
}

function detach(): void {
  spacesUnsubscribe?.();
  spacesUnsubscribe = null;
  taskUnsubscribes.forEach(unsubscribe => unsubscribe());
  taskUnsubscribes.clear();
  activeUid = null;
}

function attach(uid: string): void {
  if (activeUid === uid) {
    return;
  }
  detach();
  activeUid = uid;
  setSharedUser(uid);
  spacesUnsubscribe = onSnapshot(
    query(collection(firestore(), 'spaces'), where('members', 'array-contains', uid)),
    snapshot => {
      const spaces = snapshot.docs.map(item => toSpace(item.id, item.data()));
      setSpaces(spaces);
      syncTaskSubscriptions(spaces);
    },
    () => undefined,
  );
}

function handleAccount(): void {
  const { status, user } = accountStore.get();
  if (status === 'signedIn' && user) {
    attach(user.uid);
  } else if (status === 'signedOut') {
    detach();
    clearShared();
  }
}

export function startSharedSync(): void {
  if (started) {
    return;
  }
  started = true;
  sharedStore.subscribe(scheduleResync);
  accountStore.subscribe(handleAccount);
  handleAccount();
}

import type { User } from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  type FieldValue,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { INBOX_LIST_ID, LIST_NAME_LIMIT } from '../config/constants';
import type { Task, TaskDraft, TaskPatch } from '../types/task';
import { createId } from '../utils/id';
import { nextOccurrence } from '../utils/recurrence';
import { firebaseAuth, firestore } from './firebase';
import { deleteList, findList } from './listRepository';
import { findSharedTask, findSpace, sharedStore, type SpaceKind } from './sharedStore';
import { applyTaskPatch, buildTask, findTask, removeTaskRecord, taskStore } from './taskRepository';

export type SharingErrorCode =
  | 'signed_out'
  | 'invalid_code'
  | 'already_member'
  | 'not_found'
  | 'network'
  | 'failed';

export class SharingError extends Error {
  readonly code: SharingErrorCode;

  constructor(code: SharingErrorCode) {
    super(code);
    this.name = 'SharingError';
    this.code = code;
  }
}

export interface ShareResult {
  spaceId: string;
  code: string;
  name: string;
  kind: SpaceKind;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function currentUser(): User {
  const user = firebaseAuth().currentUser;
  if (!user) {
    throw new SharingError('signed_out');
  }
  return user;
}

function displayName(user: User): string {
  return user.displayName || user.email || 'Someone';
}

export function toSharingError(error: unknown): SharingError {
  if (error instanceof SharingError) {
    return error;
  }
  const code = (error as { code?: unknown })?.code;
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return new SharingError('network');
  }
  if (code === 'not-found') {
    return new SharingError('not_found');
  }
  return new SharingError('failed');
}

function taskDoc(task: Task, uid: string) {
  return {
    title: task.title,
    notes: task.notes,
    priority: task.priority,
    remindAt: task.remindAt,
    completed: task.completed,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    subtasks: task.subtasks,
    repeat: task.repeat,
    updatedBy: uid,
  };
}

function randomCode(): string {
  let code = '';
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function normaliseCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function createInvite(spaceId: string, uid: string): Promise<string> {
  const db = firestore();
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode();
    try {
      await setDoc(doc(db, 'invites', code), { spaceId, createdBy: uid, createdAt: Date.now() });
      await updateDoc(doc(db, 'spaces', spaceId), { inviteCode: code, updatedAt: Date.now() });
      return code;
    } catch (error) {
      lastError = error;
    }
  }
  throw toSharingError(lastError);
}

async function createSpace(kind: SpaceKind, name: string, tasks: Task[]): Promise<ShareResult> {
  const user = currentUser();
  const db = firestore();
  const spaceId = createId();
  const now = Date.now();
  const cleanName = name.trim().slice(0, LIST_NAME_LIMIT) || 'Shared';
  await setDoc(doc(db, 'spaces', spaceId), {
    kind,
    name: cleanName,
    ownerId: user.uid,
    members: [user.uid],
    memberNames: { [user.uid]: displayName(user) },
    inviteCode: null,
    createdAt: now,
    updatedAt: now,
  });
  if (tasks.length > 0) {
    const batch = writeBatch(db);
    tasks.forEach(task =>
      batch.set(doc(db, 'spaces', spaceId, 'tasks', task.id), taskDoc(task, user.uid)),
    );
    await batch.commit();
  }
  const code = await createInvite(spaceId, user.uid);
  return { spaceId, code, name: cleanName, kind };
}

export async function shareList(listId: string): Promise<ShareResult> {
  const list = findList(listId);
  if (!list || list.id === INBOX_LIST_ID) {
    throw new SharingError('not_found');
  }
  try {
    const tasks = taskStore.get().filter(task => task.listId === listId);
    const result = await createSpace('list', list.name, tasks);
    tasks.forEach(task => removeTaskRecord(task.id));
    deleteList(listId);
    return result;
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function shareTask(taskId: string): Promise<ShareResult> {
  const task = findTask(taskId);
  if (!task) {
    throw new SharingError('not_found');
  }
  try {
    const result = await createSpace('task', task.title, [task]);
    removeTaskRecord(task.id);
    return result;
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function joinWithCode(raw: string): Promise<string> {
  const user = currentUser();
  const code = normaliseCode(raw);
  if (code.length !== CODE_LENGTH) {
    throw new SharingError('invalid_code');
  }
  const db = firestore();
  try {
    const invite = await getDoc(doc(db, 'invites', code));
    const spaceId = invite.exists() ? (invite.data() as { spaceId?: unknown }).spaceId : null;
    if (typeof spaceId !== 'string') {
      throw new SharingError('invalid_code');
    }
    if (findSpace(spaceId)) {
      throw new SharingError('already_member');
    }
    await updateDoc(doc(db, 'spaces', spaceId), {
      members: arrayUnion(user.uid),
      [`memberNames.${user.uid}`]: displayName(user),
      joinCode: code,
      updatedAt: Date.now(),
    });
    const space = await getDoc(doc(db, 'spaces', spaceId));
    const name = (space.data() as { name?: unknown } | undefined)?.name;
    return typeof name === 'string' ? name : '';
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function newInviteCode(spaceId: string): Promise<string> {
  const user = currentUser();
  const old = findSpace(spaceId)?.inviteCode ?? null;
  const code = await createInvite(spaceId, user.uid);
  if (old) {
    await deleteDoc(doc(firestore(), 'invites', old)).catch(() => undefined);
  }
  return code;
}

export async function ensureInviteCode(spaceId: string): Promise<string> {
  return findSpace(spaceId)?.inviteCode ?? newInviteCode(spaceId);
}

export async function renameSpace(spaceId: string, name: string): Promise<void> {
  const clean = name.trim().slice(0, LIST_NAME_LIMIT);
  if (!clean) {
    return;
  }
  try {
    await updateDoc(doc(firestore(), 'spaces', spaceId), { name: clean, updatedAt: Date.now() });
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function deleteSpace(spaceId: string): Promise<void> {
  const db = firestore();
  try {
    const space = findSpace(spaceId);
    const tasks = await getDocs(collection(db, 'spaces', spaceId, 'tasks'));
    const batch = writeBatch(db);
    tasks.forEach(task => batch.delete(task.ref));
    if (space?.inviteCode) {
      batch.delete(doc(db, 'invites', space.inviteCode));
    }
    batch.delete(doc(db, 'spaces', spaceId));
    await batch.commit();
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function leaveSpace(spaceId: string): Promise<void> {
  const user = currentUser();
  const space = findSpace(spaceId);
  if (!space) {
    return;
  }
  const others = space.members.filter(member => member !== user.uid);
  if (others.length === 0) {
    await deleteSpace(spaceId);
    return;
  }
  const update: Record<string, FieldValue | string | number> = {
    members: arrayRemove(user.uid),
    [`memberNames.${user.uid}`]: deleteField(),
    updatedAt: Date.now(),
  };
  if (space.ownerId === user.uid) {
    update.ownerId = others[0];
  }
  try {
    await updateDoc(doc(firestore(), 'spaces', spaceId), update);
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function leaveAllSpaces(): Promise<void> {
  for (const space of sharedStore.get().spaces) {
    await leaveSpace(space.id);
  }
}

async function writeSharedTask(spaceId: string, task: Task): Promise<void> {
  const user = currentUser();
  try {
    await setDoc(doc(firestore(), 'spaces', spaceId, 'tasks', task.id), taskDoc(task, user.uid));
  } catch (error) {
    throw toSharingError(error);
  }
}

function requireSharedTask(spaceId: string, taskId: string): Task {
  const task = findSharedTask(spaceId, taskId);
  if (!task) {
    throw new SharingError('not_found');
  }
  return task;
}

export async function createSharedTask(spaceId: string, draft: TaskDraft): Promise<void> {
  await writeSharedTask(spaceId, buildTask({ ...draft, listId: INBOX_LIST_ID }, createId()));
}

export async function updateSharedTask(
  spaceId: string,
  taskId: string,
  patch: TaskPatch,
): Promise<void> {
  const current = requireSharedTask(spaceId, taskId);
  await writeSharedTask(spaceId, applyTaskPatch(current, { ...patch, listId: undefined }));
}

export async function setSharedCompleted(
  spaceId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  const current = requireSharedTask(spaceId, taskId);
  const now = Date.now();
  if (completed && current.repeat && current.remindAt !== null) {
    await writeSharedTask(spaceId, {
      ...current,
      remindAt: nextOccurrence(current.repeat, Math.max(now, current.remindAt)),
      completed: false,
      completedAt: null,
      subtasks: current.subtasks.map(step => ({ ...step, done: false })),
      updatedAt: now,
    });
    return;
  }
  await writeSharedTask(spaceId, {
    ...current,
    completed,
    completedAt: completed ? now : null,
    updatedAt: now,
  });
}

export async function toggleSharedSubtask(
  spaceId: string,
  taskId: string,
  subtaskId: string,
): Promise<void> {
  const current = requireSharedTask(spaceId, taskId);
  await writeSharedTask(spaceId, {
    ...current,
    subtasks: current.subtasks.map(step =>
      step.id === subtaskId ? { ...step, done: !step.done } : step,
    ),
    updatedAt: Date.now(),
  });
}

export async function removeSharedTask(spaceId: string, taskId: string): Promise<void> {
  const space = findSpace(spaceId);
  if (space?.kind === 'task') {
    const user = currentUser();
    if (space.ownerId === user.uid) {
      await deleteSpace(spaceId);
    } else {
      await leaveSpace(spaceId);
    }
    return;
  }
  try {
    await deleteDoc(doc(firestore(), 'spaces', spaceId, 'tasks', taskId));
  } catch (error) {
    throw toSharingError(error);
  }
}

export async function advanceSharedRepeat(
  spaceId: string,
  taskId: string,
  now: number,
): Promise<void> {
  const current = findSharedTask(spaceId, taskId);
  if (
    !current?.repeat ||
    current.completed ||
    current.remindAt === null ||
    current.remindAt > now
  ) {
    return;
  }
  await writeSharedTask(spaceId, {
    ...current,
    remindAt: nextOccurrence(current.repeat, now),
    updatedAt: now,
  });
}

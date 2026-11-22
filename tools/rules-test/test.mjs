import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, getDocs, collection, query, where, arrayUnion, arrayRemove, deleteField, writeBatch } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'iranti-rules-test',
  firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
});
const db = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());
const owner = db('owner'), friend = db('friend'), stranger = db('stranger'), anon = db(null);
let passed = 0, failed = 0;
async function check(label, promise, expectOk) {
  try { await (expectOk ? assertSucceeds(promise) : assertFails(promise)); passed++; console.log(`  ok   ${label}`); }
  catch (e) { failed++; console.log(`  FAIL ${label}: ${e.message.split('\n')[0]}`); }
}
const space = { kind: 'list', name: 'Shopping', ownerId: 'owner', members: ['owner'], memberNames: { owner: 'Owner' }, inviteCode: null, createdAt: 1, updatedAt: 1 };

await check('profile: owner writes own profile', setDoc(doc(owner, 'users/owner'), { name: 'O' }), true);
await check('profile: stranger reads owner profile', getDoc(doc(stranger, 'users/owner')), false);
await check('space: owner creates a space', setDoc(doc(owner, 'spaces/S1'), space), true);
await check('space: cannot create with someone else as member', setDoc(doc(owner, 'spaces/S2'), { ...space, members: ['owner', 'friend'] }), false);
await check('space: cannot create owned by someone else', setDoc(doc(stranger, 'spaces/S3'), { ...space, ownerId: 'owner', members: ['stranger'] }), false);
await check('space: stranger cannot read', getDoc(doc(stranger, 'spaces/S1')), false);
await check('space: signed-out cannot read', getDoc(doc(anon, 'spaces/S1')), false);
await check('task: owner adds a task', setDoc(doc(owner, 'spaces/S1/tasks/t1'), { title: 'Milk' }), true);
await check('task: stranger cannot read tasks', getDocs(collection(stranger, 'spaces/S1/tasks')), false);
await check('task: stranger cannot write a task', setDoc(doc(stranger, 'spaces/S1/tasks/t2'), { title: 'Spam' }), false);
await check('invite: owner creates code', setDoc(doc(owner, 'invites/ABC234'), { spaceId: 'S1', createdBy: 'owner', createdAt: 1 }), true);
await check('invite: stranger cannot create code for space', setDoc(doc(stranger, 'invites/ZZZ999'), { spaceId: 'S1', createdBy: 'stranger', createdAt: 1 }), false);
await check('invite: existing code cannot be overwritten', setDoc(doc(owner, 'invites/ABC234'), { spaceId: 'S1', createdBy: 'owner', createdAt: 2 }), false);
await check('invite: owner records code on space', updateDoc(doc(owner, 'spaces/S1'), { inviteCode: 'ABC234', updatedAt: 2 }), true);
await check('invite: signed-in user can look up a code', getDoc(doc(friend, 'invites/ABC234')), true);
await check('invite: nobody can list all codes', getDocs(collection(friend, 'invites')), false);
await check('invite: signed-out cannot look up a code', getDoc(doc(anon, 'invites/ABC234')), false);
await check('join: wrong code is refused', updateDoc(doc(friend, 'spaces/S1'), { members: arrayUnion('friend'), 'memberNames.friend': 'F', joinCode: 'WRONG1', updatedAt: 3 }), false);
await check('join: cannot add somebody else', updateDoc(doc(stranger, 'spaces/S1'), { members: arrayUnion('other'), joinCode: 'ABC234', updatedAt: 3 }), false);
await check('join: cannot rename while joining', updateDoc(doc(stranger, 'spaces/S1'), { members: arrayUnion('stranger'), joinCode: 'ABC234', name: 'Hacked', updatedAt: 3 }), false);
await check('join: right code adds yourself', updateDoc(doc(friend, 'spaces/S1'), { members: arrayUnion('friend'), 'memberNames.friend': 'F', joinCode: 'ABC234', updatedAt: 3 }), true);
await check('member: friend reads the space', getDoc(doc(friend, 'spaces/S1')), true);
await check('member: friend reads tasks', getDocs(collection(friend, 'spaces/S1/tasks')), true);
await check('member: friend query by membership', getDocs(query(collection(friend, 'spaces'), where('members', 'array-contains', 'friend'))), true);
await check('member: stranger query by membership of someone else', getDocs(query(collection(stranger, 'spaces'), where('members', 'array-contains', 'friend'))), false);
await check('member: friend edits a task', updateDoc(doc(friend, 'spaces/S1/tasks/t1'), { title: 'Oat milk' }), true);
await check('member: friend cannot take ownership', updateDoc(doc(friend, 'spaces/S1'), { ownerId: 'friend' }), false);
await check('member: friend cannot delete for everyone', writeBatch(friend).delete(doc(friend, 'spaces/S1')).commit(), false);
await check('leave: owner leaves and hands over', updateDoc(doc(owner, 'spaces/S1'), { members: arrayRemove('owner'), 'memberNames.owner': deleteField(), ownerId: 'friend', updatedAt: 4 }), true);
await check('leave: old owner can no longer read', getDoc(doc(owner, 'spaces/S1')), false);
const batch = writeBatch(friend);
batch.delete(doc(friend, 'spaces/S1/tasks/t1')); batch.delete(doc(friend, 'invites/ABC234')); batch.delete(doc(friend, 'spaces/S1'));
await check('delete: new owner deletes everything in one go', batch.commit(), true);
console.log(`\n${passed} passed, ${failed} failed`);
await env.cleanup();
process.exit(failed ? 1 : 0);

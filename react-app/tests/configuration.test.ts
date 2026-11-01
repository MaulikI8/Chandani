import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfiguration, restoreConfiguration, selectVariant } from '../src/state/configuration.ts';
import { roomSlots } from '../src/data/configuration.ts';
import { getRoomRenderPlan } from '../src/data/rendering.ts';

test('changing carpet colour preserves sofa, side table and every other room', () => {
  const original = defaultConfiguration();
  const changed = selectVariant(original, 'living', 'carpet', 'ink');
  assert.equal(changed.rooms.living.carpet, 'ink');
  assert.equal(changed.rooms.living.sofa, original.rooms.living.sofa);
  assert.equal(changed.rooms.living['side-table'], original.rooms.living['side-table']);
  assert.deepEqual(changed.rooms.bedroom, original.rooms.bedroom);
  assert.deepEqual(changed.rooms.dining, original.rooms.dining);
  assert.deepEqual(changed.rooms.kitchen, original.rooms.kitchen);
  assert.equal(original.rooms.living.carpet, 'chalk', 'input state must not be mutated');
});
test('bare-floor selection preserves furniture; restoring a saved snapshot is independent of later edits', () => {
  const ink = selectVariant(defaultConfiguration(), 'living', 'carpet', 'ink');
  const saved = JSON.stringify(ink);
  const bare = selectVariant(ink, 'living', 'carpet', 'bare');
  assert.equal(getRoomRenderPlan(bare, 'living').image, 'room-empty.webp');
  assert.equal(bare.rooms.living.sofa, 'sofa');
  assert.deepEqual(restoreConfiguration(JSON.parse(saved)), ink);
  assert.equal(restoreConfiguration(JSON.parse(saved)).rooms.living.carpet, 'ink');
});
test('invalid variants and slots cannot overwrite legitimate room selections', () => {
  const original = defaultConfiguration();
  assert.equal(selectVariant(original, 'living', 'sofa', 'invented-sofa'), original);
  assert.equal(selectVariant(original, 'bedroom', 'carpet', 'ink'), original);
  assert.equal(selectVariant(original, 'living', 'carpet', 'chalk'), original);
});
test('storage migration discards unknown values and preserves valid per-slot selections', () => {
  const value = { version: 1, rooms: { living: { sofa: 'unknown', carpet: 'clay', invalid: 'x' }, bedroom: null, dining: [] } };
  const restored = restoreConfiguration(value);
  assert.equal(restored.rooms.living.carpet, 'clay');
  assert.equal(restored.rooms.living.sofa, 'sofa');
  assert.deepEqual(restored.rooms.bedroom, defaultConfiguration().rooms.bedroom);
  for (const bad of [null, 'bad', [], { version: 2 }, { version: 1, rooms: false }]) assert.deepEqual(restoreConfiguration(bad), defaultConfiguration());
});
test('every exposed variant has a valid default; renderer explicitly identifies flattened studies', () => {
  for (const slots of Object.values(roomSlots)) for (const slot of slots) assert.ok(slot.variants.some(v => v.id === slot.defaultVariant));
  for (const carpet of ['clay', 'chalk', 'ink', 'bare']) {
    const state = selectVariant(defaultConfiguration(), 'living', 'carpet', carpet);
    const plan = getRoomRenderPlan(state, 'living');
    assert.equal(plan.kind, 'flat-study');
    assert.equal(plan.view, 'carpet-study');
    assert.ok(plan.image.endsWith('.webp'));
  }
});

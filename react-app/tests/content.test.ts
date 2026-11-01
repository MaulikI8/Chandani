import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { sampleProducts, sampleRooms, sampleComparisons } from '../src/data/sample.ts';
import { searchCatalogue, localCatalogueService } from '../src/data/service.ts';
import { validShortlist } from '../src/state/storage.ts';
import { newEnquiry, buildDraft } from '../src/state/enquiry.ts';

test('original styles, imagery, font and licence are retained byte for byte', () => {
  const files = ['style.css', 'try-room.css', ...readdirSync('../source/assets').map(x => `assets/${x}`), ...readdirSync('../source/fonts').map(x => `fonts/${x}`)];
  for (const file of files) assert.deepEqual(readFileSync(`public/${file}`), readFileSync(`../source/${file}`), file);
});
test('all ten products have the correct comparison entry and all referenced assets exist', () => {
  assert.equal(sampleProducts.length, 10);
  for (const product of sampleProducts) {
    assert.ok(existsSync(`public/assets/${product.image}`));
    assert.ok(sampleComparisons[product.scene].items.some(i => i.product === product.id || (product.category === 'carpets' && i.colours)), product.id);
  }
  for (const room of Object.values(sampleRooms)) {
    assert.ok(existsSync(`public/assets/${room.image}`));
    for (const item of room.items) {
      assert.ok(item.x >= 0 && item.x <= 100 && item.y >= 0 && item.y <= 100);
      if (item.product) assert.ok(sampleProducts.some(p => p.id === item.product));
    }
  }
  for (const room of Object.values(sampleComparisons)) for (const item of room.items) {
    assert.ok(existsSync(`public/assets/${item.before}`), item.before);
    assert.ok(existsSync(`public/assets/${item.after}`), item.after);
  }
});
test('search supports product, palette, category, kitchen and empty results', () => {
  assert.deepEqual(searchCatalogue(sampleProducts, '  SOFA ').products.map(p => p.id), ['sofa']);
  assert.ok(searchCatalogue(sampleProducts, 'walnut').products.some(p => p.id === 'wardrobe'));
  assert.equal(searchCatalogue(sampleProducts, 'carpets').products.length, 3);
  assert.equal(searchCatalogue(sampleProducts, 'kitchen').kitchen, true);
  assert.deepEqual(searchCatalogue(sampleProducts, 'no-such-product'), { products: [], kitchen: false });
});
test('shortlist storage validates, deduplicates and preserves product types', () => {
  const ids = sampleProducts.map(p => p.id);
  assert.deepEqual(validShortlist(['sofa', 'ink', 'bed', 'sofa', false, 'missing', '__proto__'], ids), ['sofa', 'ink', 'bed']);
  assert.deepEqual(validShortlist({ sofa: true }, ids), []);
});
test('enquiry snapshots keep products, palettes, dimensions and kitchen layout in drafts', () => {
  const selected = [sampleProducts[0], sampleProducts.find(p => p.id === 'ink')!];
  const enquiry = newEnquiry('My shortlist', selected);
  selected.pop();
  enquiry.fields.dimensions = '4 m × 3 m'; enquiry.fields.notes = 'Window on the left';
  const message = buildDraft(enquiry);
  assert.match(message, /Haven \/ Sofa \(Oatmeal\)/);
  assert.match(message, /Frame \/ Ink \(Charcoal \/ warm ivory\)/);
  assert.match(message, /4 m × 3 m/); assert.match(message, /Window on the left/);
  const kitchen = newEnquiry('Kitchen design — Layout', []);
  kitchen.fields.layout = 'Kitchen with an island'; kitchen.fields.name = 'Asha';
  assert.match(buildDraft(kitchen), /Preferred layout: Kitchen with an island/);
  assert.match(buildDraft(kitchen), /Name: Asha/);
});
test('service returns isolated content and honors cancellation', async () => {
  const content = await localCatalogueService.loadContent();
  content.products.pop();
  assert.equal((await localCatalogueService.loadContent()).products.length, 10);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(localCatalogueService.loadContent(controller.signal));
});

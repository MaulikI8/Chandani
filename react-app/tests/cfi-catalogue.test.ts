import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cfiProducts, filterCfiProducts, rangeLabels } from '../src/data/cfiCatalogue.ts';

test('the published catalogue has unique products, valid ranges and available images', () => {
  assert.equal(cfiProducts.length, 14);
  assert.equal(new Set(cfiProducts.map(p => p.id)).size, cfiProducts.length);
  for (const product of cfiProducts) {
    assert.ok(product.ranges.length > 0, product.name);
    for (const range of product.ranges) assert.ok(rangeLabels[range], `${product.name}: ${range}`);
    if (product.image) assert.ok(existsSync(`public/assets/cfi/${product.image}`), product.image);
  }
});

test('catalogue filtering includes overlapping mattress series and combines with search', () => {
  assert.ok(filterCfiProducts('premium').some(p => p.id === 'memory-mattress'));
  assert.ok(filterCfiProducts('spring').some(p => p.id === 'memory-mattress'));
  assert.deepEqual(filterCfiProducts('epe-sheet', '  SHEET  ').map(p => p.name), ['EPE Sheet']);
  assert.deepEqual(filterCfiProducts('pu', 'mattress'), []);
});

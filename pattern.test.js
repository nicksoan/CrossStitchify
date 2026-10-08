import test from 'node:test';
import assert from 'node:assert/strict';
import { createPattern, patternInstructions } from './pattern.js';

test('solid images use one color and account for every stitch', () => {
  const pattern = createPattern([255, 0, 0, 255, 255, 0, 0, 255], 2, 1, 12);
  assert.equal(pattern.colors.length, 1);
  assert.equal(pattern.colors[0].hex, '#ff0000');
  assert.equal(pattern.colors[0].count, 2);
  assert.deepEqual(pattern.cells, [0, 0]);
});

test('transparent pixels are composited onto white', () => {
  const pattern = createPattern([0, 0, 0, 0, 255, 0, 0, 128], 2, 1, 2);
  assert.deepEqual(new Set(pattern.colors.map(c => c.hex)), new Set(['#ffffff', '#ff7f7f']));
});

test('color reduction is bounded and deterministic with valid symbols and counts', () => {
  const pixels = Array.from({ length: 100 }, (_, i) => [i * 2, 255 - i * 2, i, 255]).flat();
  const pattern = createPattern(pixels, 10, 10, 4);
  assert.ok(pattern.colors.length <= 4);
  assert.equal(pattern.colors.reduce((sum, c) => sum + c.count, 0), 100);
  assert.equal(new Set(pattern.colors.map(c => c.symbol)).size, pattern.colors.length);
  assert.ok(pattern.cells.every(i => i >= 0 && i < pattern.colors.length));
  assert.deepEqual(createPattern(pixels, 10, 10, 4), pattern);
});

test('instructions group column runs without crossing row boundaries', () => {
  const pattern = {
    width: 3, height: 2, cells: [0, 0, 1, 1, 1, 1],
    colors: [{ symbol: 'A', hex: '#ff0000', count: 2 }, { symbol: 'B', hex: '#000000', count: 4 }]
  };
  const text = patternInstructions(pattern);
  assert.match(text, /Row 1: columns 1–2: A \(2 stitches\); column 3: B \(1 stitch\)\./);
  assert.match(text, /Row 2: columns 1–3: B \(3 stitches\)\./);
  assert.match(text, /6 full cross stitches/);
});

test('invalid grid sizes, color limits, and incomplete pixels are rejected', () => {
  for (const args of [
    [[], 0, 1, 2], [[], 121, 1, 2], [[], 1.5, 1, 2],
    [[0, 0, 0, 255], 1, 1, 25], [[0, 0, 0, 255], 1, 1, 1], [[], 1, 1, 2]
  ]) assert.throws(() => createPattern(...args), /Invalid/);
});

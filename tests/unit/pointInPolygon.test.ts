import { describe, it, expect } from 'vitest';
import { pointInPolygon } from '../../src/math/geometry.js';

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

// L-shape
const lShape = [
  { x: 0, y: 0 },
  { x: 6, y: 0 },
  { x: 6, y: 4 },
  { x: 4, y: 4 },
  { x: 4, y: 10 },
  { x: 0, y: 10 },
];

describe('pointInPolygon', () => {
  it('returns true for center of a square', () => {
    expect(pointInPolygon(5, 5, square)).toBe(true);
  });

  it('returns false for point outside the square', () => {
    expect(pointInPolygon(15, 5, square)).toBe(false);
    expect(pointInPolygon(-1, 5, square)).toBe(false);
    expect(pointInPolygon(5, -1, square)).toBe(false);
  });

  it('returns true inside the L-shape stem', () => {
    expect(pointInPolygon(2, 7, lShape)).toBe(true);
  });

  it('returns false inside the L-shape notch', () => {
    // The notch area (upper right of the L)
    expect(pointInPolygon(5, 7, lShape)).toBe(false);
  });
});

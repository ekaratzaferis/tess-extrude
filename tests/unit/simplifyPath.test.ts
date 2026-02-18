import { describe, it, expect } from 'vitest';
import { simplifyPath } from '../../src/polygon/simplify.js';

describe('simplifyPath', () => {
  it('collapses a straight 10-point line to 2 endpoints', () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ x: i * 10, y: 0 }));
    const result = simplifyPath(pts, 1);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[result.length - 1]).toEqual({ x: 90, y: 0 });
  });

  it('keeps the peak of a Z-shape', () => {
    // Three points: start, a peak well off the line, end
    const pts = [
      { x: 0, y: 0 },
      { x: 50, y: 100 }, // large deviation
      { x: 100, y: 0 },
    ];
    const result = simplifyPath(pts, 1);
    expect(result.length).toBe(3);
    expect(result[1]).toEqual({ x: 50, y: 100 });
  });

  it('returns a copy for <= 2 points', () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const result = simplifyPath(pts, 1);
    expect(result).toEqual(pts);
    expect(result).not.toBe(pts);
  });

  it('preserves all points when all deviations exceed tolerance', () => {
    // Zig-zag where every intermediate point is far from the baseline
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 100 },
      { x: 2, y: 0 },
      { x: 3, y: 100 },
      { x: 4, y: 0 },
    ];
    const result = simplifyPath(pts, 1);
    expect(result.length).toBe(5);
  });
});

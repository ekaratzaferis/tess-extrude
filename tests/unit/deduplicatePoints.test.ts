import { describe, it, expect } from 'vitest';
import { deduplicatePoints } from '../../src/polygon/prepare.js';

describe('deduplicatePoints', () => {
  it('removes consecutive near-duplicate points', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0.1 }, // too close to first (eps=0.5)
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const result = deduplicatePoints(pts, 0.5);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[1]).toEqual({ x: 10, y: 0 });
  });

  it('removes last point when it is too close to the first', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0.1, y: 0.1 }, // near-duplicate of first
    ];
    const result = deduplicatePoints(pts, 0.5);
    expect(result.length).toBe(3);
    expect(result[result.length - 1]).toEqual({ x: 10, y: 10 });
  });

  it('returns empty array for empty input', () => {
    expect(deduplicatePoints([])).toEqual([]);
  });

  it('returns a single point when all are coincident', () => {
    const pts = [
      { x: 5, y: 5 },
      { x: 5.1, y: 5.1 },
      { x: 5.2, y: 5.2 },
    ];
    const result = deduplicatePoints(pts, 0.5);
    expect(result.length).toBe(1);
  });

  it('preserves well-separated points', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(deduplicatePoints(pts)).toEqual(pts);
  });
});

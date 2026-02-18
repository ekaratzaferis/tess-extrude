import { describe, it, expect } from 'vitest';
import { subdivideBoundary } from '../../src/polygon/subdivide.js';

describe('subdivideBoundary', () => {
  it('returns a copy when subdivisions=1', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const result = subdivideBoundary(pts, 1);
    expect(result).toEqual(pts);
    // Must be a new array
    expect(result).not.toBe(pts);
  });

  it('produces n×subdivisions points for a square with subdivisions=3', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const result = subdivideBoundary(pts, 3);
    expect(result.length).toBe(12); // 4 × 3
  });

  it('places intermediate points at correct positions', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 3 },
    ];
    const result = subdivideBoundary(pts, 3);
    // First point of first edge: (0,0)
    expect(result[0]).toEqual({ x: 0, y: 0 });
    // Second point: 1/3 along first edge → (1, 0)
    expect(result[1]).toMatchObject({ x: expect.closeTo(1, 5), y: expect.closeTo(0, 5) });
    // Third point: 2/3 along first edge → (2, 0)
    expect(result[2]).toMatchObject({ x: expect.closeTo(2, 5), y: expect.closeTo(0, 5) });
    // Fourth point: start of second edge → (3, 0)
    expect(result[3]).toMatchObject({ x: expect.closeTo(3, 5), y: expect.closeTo(0, 5) });
  });
});

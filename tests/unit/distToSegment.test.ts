import { describe, it, expect } from 'vitest';
import { distToSegment } from '../../src/math/geometry.js';

describe('distToSegment', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };

  it('returns perpendicular distance when foot is within segment', () => {
    // Point (5, 3) projects onto (5, 0) — foot is at middle of segment
    expect(distToSegment(5, 3, a, b)).toBeCloseTo(3);
  });

  it('returns distance to nearest endpoint when foot is past the end', () => {
    // Point (15, 0) — nearest is endpoint b (10, 0)
    expect(distToSegment(15, 0, a, b)).toBeCloseTo(5);
  });

  it('returns distance to start endpoint when foot is before start', () => {
    // Point (-3, 0) — nearest is endpoint a (0, 0)
    expect(distToSegment(-3, 0, a, b)).toBeCloseTo(3);
  });

  it('handles degenerate segment (a === b)', () => {
    const p = { x: 3, y: 4 };
    expect(distToSegment(p.x, p.y, a, a)).toBeCloseTo(5);
  });
});

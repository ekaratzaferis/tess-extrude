import { describe, it, expect } from 'vitest';
import { ensureCCW } from '../../src/polygon/prepare.js';

describe('ensureCCW', () => {
  it('leaves a CCW polygon unchanged', () => {
    // Simple CCW square (positive shoelace area)
    const ccw = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const result = ensureCCW(ccw);
    expect(result).toEqual(ccw);
  });

  it('reverses a CW polygon to make it CCW', () => {
    // CW square (negative shoelace area)
    const cw = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ];
    const result = ensureCCW(cw);
    // Should be reversed
    expect(result).toEqual([...cw].reverse());
  });

  it('does not mutate the original array', () => {
    const cw = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    const original = [...cw];
    ensureCCW(cw);
    expect(cw).toEqual(original);
  });
});

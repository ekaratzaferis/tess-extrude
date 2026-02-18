import type { Point2D } from '../types.js';

/**
 * Validate that the input is a finite, usable point array.
 * Returns the array as-is on success, or null if validation fails.
 */
export function validatePoints(points: Point2D[]): Point2D[] | null {
  if (!Array.isArray(points) || points.length < 3) return null;
  for (const p of points) {
    if (
      typeof p.x !== 'number' ||
      typeof p.y !== 'number' ||
      !isFinite(p.x) ||
      !isFinite(p.y)
    ) {
      return null;
    }
  }
  return points;
}

import type { Point2D } from '../types.js';

/**
 * Subdivide each boundary edge into `subdivisions` equal segments.
 * Returns a pre-allocated flat array of the new boundary points.
 */
export function subdivideBoundary(points: Point2D[], subdivisions: number): Point2D[] {
  if (subdivisions <= 1) return [...points];

  const n = points.length;
  const result = new Array<Point2D>(n * subdivisions);

  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      result[i * subdivisions + s] = {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    }
  }

  return result;
}

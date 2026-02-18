import type { Point2D, Bounds } from '../types.js';
import { pointInPolygon, distToSegment } from '../math/geometry.js';

/**
 * Generate interior Steiner points on a regular grid to improve cap
 * triangulation quality. Uses a seeded PRNG to add tiny jitter, keeping
 * output deterministic for the same input polygon.
 */
export function generateSteinerPoints(
  polygon: Point2D[],
  density: number,
  bounds: Bounds,
  rand: () => number,
): Point2D[] {
  const { minX, minY, maxX, maxY } = bounds;
  const maxDim = Math.max(maxX - minX, maxY - minY);
  const spacing = maxDim / (density + 1);
  const margin = spacing * 0.5;
  const steiners: Point2D[] = [];

  for (let x = minX + margin; x < maxX - margin * 0.5; x += spacing) {
    for (let y = minY + margin; y < maxY - margin * 0.5; y += spacing) {
      if (!pointInPolygon(x, y, polygon)) continue;

      let tooClose = false;
      for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        if (distToSegment(x, y, polygon[i]!, polygon[j]!) < spacing * 0.15) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        const jx = (rand() - 0.5) * spacing * 0.05;
        const jy = (rand() - 0.5) * spacing * 0.05;
        steiners.push({ x: x + jx, y: y + jy });
      }
    }
  }

  return steiners;
}

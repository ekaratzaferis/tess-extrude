import type { Point2D } from '../types.js';

/** Remove consecutive near-duplicate points (including last≈first wrap). */
export function deduplicatePoints(points: Point2D[], eps = 0.5): Point2D[] {
  if (points.length === 0) return [];
  const epsSq = eps * eps;
  const result: Point2D[] = [points[0]!];

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1]!;
    const cur = points[i]!;
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (dx * dx + dy * dy > epsSq) {
      result.push(cur);
    }
  }

  // Remove last point if it is too close to the first
  if (result.length > 1) {
    const first = result[0]!;
    const last = result[result.length - 1]!;
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    if (dx * dx + dy * dy <= epsSq) {
      result.pop();
    }
  }

  return result;
}

/**
 * Ensure the polygon winding is counter-clockwise (positive signed area via
 * the shoelace formula). triangulation requires CCW contours.
 */
export function ensureCCW(points: Point2D[]): Point2D[] {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i]!.x * points[j]!.y;
    area -= points[j]!.x * points[i]!.y;
  }
  // area/2 < 0 means CW → reverse
  if (area < 0) {
    return [...points].reverse();
  }
  return points;
}

/** Translate points so their centroid is at the origin. */
export function centerPoints(points: Point2D[]): Point2D[] {
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= points.length;
  cy /= points.length;
  return points.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

import type { Point2D } from '../types.js';

function perpendicularDist(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Iterative Douglas-Peucker simplification.
 * Avoids recursion and array slicing for better performance on large inputs.
 */
export function simplifyPath(points: Point2D[], tolerance: number): Point2D[] {
  if (points.length <= 2) return points.slice();

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack: Array<[number, number]> = [[0, points.length - 1]];

  while (stack.length > 0) {
    const range = stack.pop()!;
    const start = range[0];
    const end = range[1];

    if (end - start <= 1) continue;

    const first = points[start]!;
    const last = points[end]!;
    let maxDist = 0;
    let maxIdx = start;

    for (let i = start + 1; i < end; i++) {
      const d = perpendicularDist(points[i]!, first, last);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }

    if (maxDist > tolerance) {
      keep[maxIdx] = 1;
      stack.push([start, maxIdx]);
      stack.push([maxIdx, end]);
    }
  }

  const result: Point2D[] = [];
  for (let i = 0; i < points.length; i++) {
    if (keep[i]) result.push(points[i]!);
  }
  return result;
}

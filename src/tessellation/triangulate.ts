import * as poly2tri from 'poly2tri';
import type { Point2D, Bounds } from '../types.js';
import { generateSteinerPoints } from './steiner.js';
import { mulberry32 } from '../math/prng.js';

/**
 * Triangulate a CCW boundary polygon into cap triangles using poly2tri.
 * Optionally adds interior Steiner points to improve mesh quality.
 *
 * Falls back to no Steiner points on failure, returns null on total failure.
 */
export function triangulateCap(
  boundaryPoints: Point2D[],
  density: number,
  bounds: Bounds,
): poly2tri.Triangle[] | null {
  // Seed derived from polygon dimensions for deterministic jitter
  const seed = Math.round(
    Math.abs(bounds.maxX - bounds.minX) * 1000 + Math.abs(bounds.maxY - bounds.minY) * 1000,
  );
  const rand = mulberry32(seed);

  const attempt = (withSteiners: boolean): poly2tri.Triangle[] | null => {
    try {
      // Fresh Point objects per attempt so poly2tri state is clean
      const contour = boundaryPoints.map((p) => new poly2tri.Point(p.x, p.y));
      const swctx = new poly2tri.SweepContext(contour);

      if (withSteiners && density > 1) {
        const steiners = generateSteinerPoints(boundaryPoints, density, bounds, rand);
        for (const s of steiners) {
          swctx.addPoint(new poly2tri.Point(s.x, s.y));
        }
      }

      swctx.triangulate();
      const tris = swctx.getTriangles();
      // Drop reference so SweepContext can be GC'd
      return tris;
    } catch {
      return null;
    }
  };

  let tris = attempt(true);
  if (tris === null) {
    console.warn('poly2tri: triangulation failed, retrying without Steiner points');
    tris = attempt(false);
    if (tris === null) {
      console.error('poly2tri: triangulation failed completely');
    }
  }
  return tris;
}

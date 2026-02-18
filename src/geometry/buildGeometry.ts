import * as THREE from 'three';
import type * as poly2tri from 'poly2tri';
import type { Point2D, Bounds } from '../types.js';
import { writeCap } from './caps.js';
import { writeSides } from './sides.js';

/** Compute axis-aligned bounding box for a set of points. */
export function computeBounds(points: Point2D[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Assemble a THREE.BufferGeometry from pre-computed tessellation data.
 *
 * Sizes all typed arrays upfront using exact counts:
 *   - Unique cap verts counted via object-identity Set before first write
 *   - Side verts: nBoundary × depthSegs × 4 (4 verts per quad)
 *   - Uses Uint16Array for indices when totalVerts ≤ 65535, Uint32Array otherwise
 */
export function buildGeometry(
  subdividedPts: Point2D[],
  capTriangles: poly2tri.Triangle[],
  depth: number,
  depthSegs: number,
): THREE.BufferGeometry {
  const nCapTris = capTriangles.length;
  const nBoundary = subdividedPts.length;

  // Count unique cap vertices using object-identity (no string allocations)
  const uniqueCapPoints = new Set<poly2tri.Point>();
  for (const tri of capTriangles) {
    const pts = tri.getPoints();
    uniqueCapPoints.add(pts[0]);
    uniqueCapPoints.add(pts[1]);
    uniqueCapPoints.add(pts[2]);
  }
  const nUniqueCapVerts = uniqueCapPoints.size;
  uniqueCapPoints.clear(); // release for GC

  const nSideVerts = nBoundary * depthSegs * 4;
  const totalVerts = nUniqueCapVerts * 2 + nSideVerts;
  const totalIndices = nCapTris * 6 + nBoundary * depthSegs * 6;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices =
    totalVerts <= 65535
      ? new Uint16Array(totalIndices)
      : new Uint32Array(totalIndices);

  const frontZ = -depth / 2;
  const backZ = depth / 2;

  // Front cap — reversed winding so normal faces −Z
  const frontVertsWritten = writeCap(
    positions,
    normals,
    indices,
    0,
    0,
    capTriangles,
    frontZ,
    -1,
    true,
  );

  // Back cap — normal winding, normal faces +Z
  writeCap(
    positions,
    normals,
    indices,
    frontVertsWritten,
    nCapTris * 3,
    capTriangles,
    backZ,
    1,
    false,
  );

  // Side walls
  writeSides(
    positions,
    normals,
    indices,
    nUniqueCapVerts * 2,
    nCapTris * 6,
    subdividedPts,
    frontZ,
    backZ,
    depthSegs,
  );

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));

  return geo;
}

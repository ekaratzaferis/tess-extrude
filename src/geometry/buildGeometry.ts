import * as THREE from 'three';
import type { Point2D, Bounds, TriangulationResult } from '../types.js';
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
 *   - Cap verts: vertices.length / 2 (flat x,y pairs from triangle-wasm output)
 *   - Side verts: nBoundary × depthSegs × 4 (4 verts per quad)
 *   - Uses Uint16Array for indices when totalVerts ≤ 65535, Uint32Array otherwise
 */
export function buildGeometry(
  subdividedPts: Point2D[],
  capResult: TriangulationResult,
  depth: number,
  depthSegs: number,
): THREE.BufferGeometry {
  const nUniqueCapVerts = capResult.vertices.length / 2;
  const nCapTris = capResult.indices.length / 3;
  const nBoundary = subdividedPts.length;

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
    capResult,
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
    capResult,
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

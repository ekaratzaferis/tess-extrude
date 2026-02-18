import type { Point2D } from '../types.js';

/**
 * Write side-wall quads directly into pre-allocated typed arrays.
 * Each boundary edge gets one quad per depth segment with flat per-face normals.
 */
export function writeSides(
  positions: Float32Array,
  normals: Float32Array,
  indices: Uint16Array | Uint32Array,
  vertOffset: number,
  idxOffset: number,
  boundaryPoints: Point2D[],
  frontZ: number,
  backZ: number,
  depthSegs: number,
): void {
  const n = boundaryPoints.length;
  let vi = vertOffset;
  let ii = idxOffset;

  for (let i = 0; i < n; i++) {
    const a = boundaryPoints[i]!;
    const b = boundaryPoints[(i + 1) % n]!;

    const edgeDx = b.x - a.x;
    const edgeDy = b.y - a.y;
    const edgeLen = Math.hypot(edgeDx, edgeDy);
    const nx = edgeLen > 0 ? edgeDy / edgeLen : 0;
    const ny = edgeLen > 0 ? -edgeDx / edgeLen : 0;

    for (let j = 0; j < depthSegs; j++) {
      const z0 = frontZ + (backZ - frontZ) * (j / depthSegs);
      const z1 = frontZ + (backZ - frontZ) * ((j + 1) / depthSegs);

      // Quad vertices: (a,z0) (b,z0) (b,z1) (a,z1)
      const v0 = vi++;
      positions[v0 * 3] = a.x;
      positions[v0 * 3 + 1] = a.y;
      positions[v0 * 3 + 2] = z0;
      normals[v0 * 3] = nx;
      normals[v0 * 3 + 1] = ny;
      normals[v0 * 3 + 2] = 0;

      const v1 = vi++;
      positions[v1 * 3] = b.x;
      positions[v1 * 3 + 1] = b.y;
      positions[v1 * 3 + 2] = z0;
      normals[v1 * 3] = nx;
      normals[v1 * 3 + 1] = ny;
      normals[v1 * 3 + 2] = 0;

      const v2 = vi++;
      positions[v2 * 3] = b.x;
      positions[v2 * 3 + 1] = b.y;
      positions[v2 * 3 + 2] = z1;
      normals[v2 * 3] = nx;
      normals[v2 * 3 + 1] = ny;
      normals[v2 * 3 + 2] = 0;

      const v3 = vi++;
      positions[v3 * 3] = a.x;
      positions[v3 * 3 + 1] = a.y;
      positions[v3 * 3 + 2] = z1;
      normals[v3 * 3] = nx;
      normals[v3 * 3 + 1] = ny;
      normals[v3 * 3 + 2] = 0;

      indices[ii++] = v0;
      indices[ii++] = v1;
      indices[ii++] = v2;
      indices[ii++] = v0;
      indices[ii++] = v2;
      indices[ii++] = v3;
    }
  }
}

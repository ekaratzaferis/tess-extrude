import type { TriangulationResult } from '../types.js';

/**
 * Write one cap face (front or back) directly into pre-allocated typed arrays.
 *
 * @returns Number of vertices written.
 */
export function writeCap(
  positions: Float32Array,
  normals: Float32Array,
  indices: Uint16Array | Uint32Array,
  vertOffset: number,
  idxOffset: number,
  result: TriangulationResult,
  z: number,
  normalZ: number,
  reverseWinding: boolean,
): number {
  const { vertices, indices: triIndices } = result;
  const nVerts = vertices.length / 2;
  const nTris  = triIndices.length / 3;

  for (let i = 0; i < nVerts; i++) {
    const base = (vertOffset + i) * 3;
    positions[base]     = vertices[i * 2]!;
    positions[base + 1] = vertices[i * 2 + 1]!;
    positions[base + 2] = z;
    normals[base]       = 0;
    normals[base + 1]   = 0;
    normals[base + 2]   = normalZ;
  }

  let ii = idxOffset;
  for (let t = 0; t < nTris; t++) {
    const i0 = vertOffset + triIndices[t * 3]!;
    const i1 = vertOffset + triIndices[t * 3 + 1]!;
    const i2 = vertOffset + triIndices[t * 3 + 2]!;
    if (reverseWinding) {
      indices[ii++] = i0; indices[ii++] = i2; indices[ii++] = i1;
    } else {
      indices[ii++] = i0; indices[ii++] = i1; indices[ii++] = i2;
    }
  }

  return nVerts;
}

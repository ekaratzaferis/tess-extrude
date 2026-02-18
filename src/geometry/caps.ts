import type * as poly2tri from 'poly2tri';

/**
 * Write one cap face (front or back) directly into pre-allocated typed arrays.
 *
 * Uses object-identity Map keyed on poly2tri.Point references to avoid string
 * allocations. The same Point objects are shared across adjacent triangles, so
 * identity-based deduplication is exact and allocation-free.
 *
 * @returns Number of unique vertices written (always equals cap unique-point count).
 */
export function writeCap(
  positions: Float32Array,
  normals: Float32Array,
  indices: Uint16Array | Uint32Array,
  vertOffset: number,
  idxOffset: number,
  capTriangles: poly2tri.Triangle[],
  z: number,
  normalZ: number,
  reverseWinding: boolean,
): number {
  const vertMap = new Map<poly2tri.Point, number>();
  let localVert = 0;
  let ii = idxOffset;

  for (const tri of capTriangles) {
    const pts = tri.getPoints();
    const vi0 = getOrAdd(pts[0], z, normalZ, positions, normals, vertOffset, vertMap, () => localVert++);
    const vi1 = getOrAdd(pts[1], z, normalZ, positions, normals, vertOffset, vertMap, () => localVert++);
    const vi2 = getOrAdd(pts[2], z, normalZ, positions, normals, vertOffset, vertMap, () => localVert++);

    if (reverseWinding) {
      indices[ii++] = vi0;
      indices[ii++] = vi2;
      indices[ii++] = vi1;
    } else {
      indices[ii++] = vi0;
      indices[ii++] = vi1;
      indices[ii++] = vi2;
    }
  }

  return localVert;
}

function getOrAdd(
  pt: poly2tri.Point,
  z: number,
  normalZ: number,
  positions: Float32Array,
  normals: Float32Array,
  vertOffset: number,
  map: Map<poly2tri.Point, number>,
  nextIdx: () => number,
): number {
  let idx = map.get(pt);
  if (idx !== undefined) return idx;

  idx = vertOffset + nextIdx();
  const base = idx * 3;
  positions[base] = pt.x;
  positions[base + 1] = pt.y;
  positions[base + 2] = z;
  normals[base] = 0;
  normals[base + 1] = 0;
  normals[base + 2] = normalZ;
  map.set(pt, idx);
  return idx;
}

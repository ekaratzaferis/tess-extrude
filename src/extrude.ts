import * as THREE from 'three';
import type { ExtrudeInput, ExtrudeOptions, Point2D } from './types.js';
import { validatePoints } from './input/fromPoints.js';
import { fromSVG } from './input/fromSVG.js';
import { deduplicatePoints, ensureCCW, centerPoints } from './polygon/prepare.js';
import { subdivideBoundary } from './polygon/subdivide.js';
import { triangulateCap } from './tessellation/triangulate.js';
import { computeBounds, buildGeometry } from './geometry/buildGeometry.js';

const DEFAULTS: ExtrudeOptions = {
  depth: 20,
  depthSegments: 4,
  capDensity: 5,
  edgeSubdivisions: 2,
};

/**
 * Build a THREE.BufferGeometry from a prepared point array.
 * Returns null for degenerate input or triangulation failure.
 */
function buildExtrudedGeometry(
  rawPoints: Point2D[],
  opts: ExtrudeOptions,
): THREE.BufferGeometry | null {
  const { depth, depthSegments, capDensity, edgeSubdivisions } = opts;

  let pts = deduplicatePoints(rawPoints, 0.5);
  if (pts.length < 3) return null;

  pts = ensureCCW(pts);
  pts = centerPoints(pts);

  const subdividedPts = subdivideBoundary(pts, edgeSubdivisions);
  const bounds = computeBounds(subdividedPts);

  const capResult = triangulateCap(subdividedPts, capDensity, bounds);
  if (!capResult || capResult.indices.length === 0) return null;

  return buildGeometry(subdividedPts, capResult, depth, depthSegments);
}

/**
 * Extrude a 2D shape into a THREE.BufferGeometry.
 *
 * Accepts raw polygon points or a base64-encoded SVG.
 * Returns `null` (never throws) on degenerate input or triangulation failure.
 */
export function extrude(
  input: ExtrudeInput,
  options?: Partial<ExtrudeOptions>,
): THREE.BufferGeometry | null {
  const opts: ExtrudeOptions = { ...DEFAULTS, ...options };

  if (input.type === 'points') {
    const pts = validatePoints(input.points);
    if (!pts) return null;
    return buildExtrudedGeometry(pts, opts);
  }

  // SVG path — requires browser environment
  let contours: Point2D[][];
  try {
    contours = fromSVG(input.data);
  } catch (e) {
    console.error('tess-extrude: SVG parsing failed', e);
    return null;
  }

  if (contours.length === 0) return null;

  const geometries: THREE.BufferGeometry[] = [];
  for (const contour of contours) {
    const geo = buildExtrudedGeometry(contour, opts);
    if (geo) geometries.push(geo);
  }

  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0]!;

  // Merge multiple SVG paths into one geometry
  return mergeGeometries(geometries);
}

/** Minimal geometry merge — concatenates position/normal/index buffers. */
function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;

  for (const g of geos) {
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    totalVerts += pos.count;
    const idx = g.index;
    if (idx) totalIndices += idx.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices =
    totalVerts <= 65535 ? new Uint16Array(totalIndices) : new Uint32Array(totalIndices);

  let vOff = 0;
  let iOff = 0;

  for (const g of geos) {
    const pos = (g.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const nor = (g.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array;
    const idx = g.index;

    positions.set(pos, vOff * 3);
    normals.set(nor, vOff * 3);

    if (idx) {
      const idxArr = idx.array;
      for (let i = 0; i < idxArr.length; i++) {
        indices[iOff + i] = (idxArr[i] as number) + vOff;
      }
      iOff += idxArr.length;
    }

    vOff += pos.length / 3;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

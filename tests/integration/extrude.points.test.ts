import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('triangle-wasm', () => ({
  default: {
    init: vi.fn(() => Promise.resolve()),
    makeIO: vi.fn((data?: { pointlist?: Float64Array; segmentlist?: Int32Array }) => ({
      pointlist:    data?.pointlist    ?? new Float64Array(0),
      segmentlist:  data?.segmentlist  ?? new Int32Array(0),
      trianglelist: new Uint32Array(0),
    })),
    freeIO: vi.fn(),
    triangulate: vi.fn((_sw: unknown, input: { pointlist: Float64Array }, output: { pointlist: Float64Array; trianglelist: Uint32Array }) => {
      output.pointlist    = new Float64Array(input.pointlist);
      output.trianglelist = new Uint32Array([0, 1, 2,  0, 2, 3]);
    }),
  },
}));

vi.mock('triangle-wasm/triangle.out.wasm?url', () => ({ default: '/triangle.out.wasm' }));

const { extrude } = await import('../../src/extrude.js');

// Square in canvas coordinates (100×100, centered at 150,150)
const squarePoints = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 200 },
  { x: 100, y: 200 },
];

describe('extrude() — points input', () => {
  it('returns a THREE.BufferGeometry for a valid square', () => {
    const geo = extrude({ type: 'points', points: squarePoints });
    expect(geo).not.toBeNull();
    expect(geo).toBeInstanceOf(THREE.BufferGeometry);
  });

  it('geometry has position, normal, and index attributes', () => {
    const geo = extrude({ type: 'points', points: squarePoints })!;
    expect(geo.getAttribute('position')).toBeDefined();
    expect(geo.getAttribute('normal')).toBeDefined();
    expect(geo.index).not.toBeNull();
  });

  it('returns null for fewer than 3 points', () => {
    expect(extrude({ type: 'points', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] })).toBeNull();
    expect(extrude({ type: 'points', points: [] })).toBeNull();
  });

  it('returns null when all points are coincident', () => {
    const pts = Array.from({ length: 5 }, () => ({ x: 10, y: 10 }));
    const result = extrude({ type: 'points', points: pts });
    expect(result).toBeNull();
  });

  it('is deterministic — identical input produces identical position arrays', () => {
    const opts = { depth: 20, depthSegments: 4, capDensity: 5, edgeSubdivisions: 2 };
    const g1 = extrude({ type: 'points', points: squarePoints }, opts)!;
    const g2 = extrude({ type: 'points', points: squarePoints }, opts)!;

    const pos1 = (g1.getAttribute('position') as THREE.BufferAttribute).array;
    const pos2 = (g2.getAttribute('position') as THREE.BufferAttribute).array;

    expect(pos1.length).toBe(pos2.length);
    for (let i = 0; i < pos1.length; i++) {
      expect(pos1[i]).toBeCloseTo(pos2[i] as number, 5);
    }
  });

  it('vertex count matches expected formula', () => {
    // With edgeSubdivisions=2, nBoundary = 4*2 = 8
    // sideVerts = 8 * 4 * 4 = 128 (nBoundary * depthSegs * 4)
    const opts = { depth: 20, depthSegments: 4, capDensity: 5, edgeSubdivisions: 2 };
    const geo = extrude({ type: 'points', points: squarePoints }, opts)!;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const nBoundary = squarePoints.length * opts.edgeSubdivisions;
    const sideVerts = nBoundary * opts.depthSegments * 4;
    const totalVerts = posAttr.count;
    // sideVerts + 2 * nUniqueCapVerts = totalVerts
    // so nUniqueCapVerts = (totalVerts - sideVerts) / 2
    const nUniqueCapVerts = (totalVerts - sideVerts) / 2;
    expect(nUniqueCapVerts).toBeGreaterThan(0);
    expect(Number.isInteger(nUniqueCapVerts)).toBe(true);
  });

  it('respects the depth option', () => {
    const g1 = extrude({ type: 'points', points: squarePoints }, { depth: 10 })!;
    const g2 = extrude({ type: 'points', points: squarePoints }, { depth: 50 })!;

    // Bounding boxes should differ in Z extent
    g1.computeBoundingBox();
    g2.computeBoundingBox();
    const z1 = g1.boundingBox!.max.z - g1.boundingBox!.min.z;
    const z2 = g2.boundingBox!.max.z - g2.boundingBox!.min.z;
    expect(z1).toBeCloseTo(10, 4);
    expect(z2).toBeCloseTo(50, 4);
  });
});

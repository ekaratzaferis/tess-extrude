import Triangle from 'triangle-wasm';
import wasmUrl from 'triangle-wasm/triangle.out.wasm?url';
import type { Point2D, Bounds, TriangulationResult } from '../types.js';

// Top-level await — WASM init completes before any export is used.
// wasmUrl is resolved by Vite at build/dev time to the correct served URL,
// bypassing the Emscripten locateFile heuristic (which would otherwise look
// for the .wasm beside the pre-bundled .vite/deps/triangle-wasm.js).
await Triangle.init(wasmUrl);

export function triangulateCap(
  boundaryPoints: Point2D[],
  density: number,
  bounds: Bounds,
): TriangulationResult | null {
  const n = boundaryPoints.length;

  const pointlist = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    pointlist[i * 2]     = boundaryPoints[i]!.x;
    pointlist[i * 2 + 1] = boundaryPoints[i]!.y;
  }

  const segmentlist = new Int32Array(n * 2);
  for (let i = 0; i < n; i++) {
    segmentlist[i * 2]     = i;
    segmentlist[i * 2 + 1] = (i + 1) % n;
  }

  const input = Triangle.makeIO({ pointlist, segmentlist });
  const output = Triangle.makeIO();

  const maxDim = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const sw: Record<string, boolean | number> = { pslg: true, quality: 20, quiet: true, bndMarkers: false };
  if (density > 1) {
    sw['area'] = (maxDim * maxDim) / (2 * (density + 1) * (density + 1));
  }

  try {
    Triangle.triangulate(sw, input, output);
  } catch (e) {
    Triangle.freeIO(input, true);
    Triangle.freeIO(output);
    console.error('triangle-wasm: triangulation failed', e);
    return null;
  }

  // CRITICAL: copy out of WASM heap before freeIO invalidates the memory
  const vertices = new Float64Array(output.pointlist);
  const indices  = new Uint32Array(output.trianglelist);

  Triangle.freeIO(input, true);
  Triangle.freeIO(output);

  if (!vertices.length || !indices.length) return null;
  return { vertices, indices };
}

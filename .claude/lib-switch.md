# Plan: Replace poly2tri with triangle-wasm

## Context
Swap the triangulation backend from `poly2tri` (JS sweep-line) to `triangle-wasm` (Jonathan Shewchuk's Triangle library compiled to WASM). This gives higher-quality Delaunay triangulation with built-in mesh density control via quality/area switches, and eliminates the manual Steiner point generation (`steiner.ts` + `prng.ts`). The public `extrude()` function signature does not change.

## Notable trade-off: CJS/UMD formats dropped
`triangle-wasm` requires `await Triangle.init()` before first use. We handle this with a **top-level `await`** in `triangulate.ts`, making the module async at import time — transparent to ESM consumers. **Top-level await is incompatible with CJS/UMD**, so those build formats are dropped (ES-only output). The `extrude()` call signature stays synchronous.

`"sideEffects": false` in `package.json` must also be removed (the WASM init is a module-level side effect).

---

## Files to modify / delete / create

| File | Action |
|---|---|
| `package.json` | Replace `poly2tri` dep with `triangle-wasm`; drop CJS exports/main; remove `"sideEffects": false`; update description/keywords |
| `vite.config.ts` | Drop `formats: ['es','cjs','umd']` → `['es']`; remove UMD globals; remove `define: { global: 'globalThis' }` |
| `src/poly2tri.d.ts` | **Delete** |
| `src/tessellation/steiner.ts` | **Delete** (triangle-wasm generates Steiner internally) |
| `src/math/prng.ts` | **Delete** (only used by steiner.ts) |
| `src/math/geometry.ts` | **Delete** (only used by steiner.ts — confirm with grep first) |
| `src/triangle-wasm.d.ts` | **Create** — TypeScript declarations for the subset of the API we use |
| `src/types.ts` | Add `TriangulationResult` interface |
| `src/tessellation/triangulate.ts` | **Rewrite** — top-level await init, flat-array I/O, density→area mapping |
| `src/geometry/caps.ts` | **Rewrite** — replace `Map<poly2tri.Point>` dedup with direct indexed writes |
| `src/geometry/buildGeometry.ts` | Update signature (`poly2tri.Triangle[]` → `TriangulationResult`); replace Set counting with `vertices.length / 2` |
| `src/extrude.ts` | Rename `capTriangles` → `capResult`; update null check to `.indices.length === 0` |
| `tests/integration/extrude.points.test.ts` | Add `vi.mock('triangle-wasm', ...)` + switch to dynamic `await import(...)` |
| `tests/integration/extrude.svg.test.ts` | Add `vi.mock('triangle-wasm', ...)` before existing SVGLoader mock |

---

## Density → area formula
`area = maxDim² / (2 * (density+1)²)` where `maxDim = max(width, height)` of the bounding box.
- `density=1` → no area constraint (quality-only, min angle 20°)
- `density=5` on 100×100 → area ≈ 138 units²

## Critical: WASM memory ownership
Must copy output arrays **before** calling `freeIO`, or the memory is freed beneath us:
```typescript
const vertices = new Float64Array(output.pointlist);   // copy
const indices  = new Uint32Array(output.trianglelist); // copy
Triangle.freeIO(input, true);
Triangle.freeIO(output);
```

## Verification
1. `npm run test` — all tests pass
2. `npm run build` — tsc + vite build succeed, `dist/tess-extrude.es.js` emitted
3. `npm run dev` — demo renders in browser with correct mesh density

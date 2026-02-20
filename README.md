# tess-extrude

Extrude 2D polygon outlines into `THREE.BufferGeometry` using triangle-wasm Delaunay tessellation.

## Install

```bash
npm install tess-extrude
# three is a peer dependency
npm install three
```

## Quick Start — points input

```typescript
import * as THREE from 'three';
import { extrude } from 'tess-extrude';

const points = [
  { x: 0,   y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0,   y: 100 },
];

const geometry = extrude({ type: 'points', points });
if (geometry) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  scene.add(mesh);
}
```

## Quick Start — SVG input

```typescript
import { extrude } from 'tess-extrude';

// base64-encoded SVG string (data URI prefix optional)
const geometry = extrude({ type: 'svg', data: base64SvgString }, { depth: 30 });
```

> **Note:** SVG input requires a browser environment (SVGLoader uses `DOMParser` internally).

## API

### `extrude(input, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `PointInput \| SVGInput` | Shape to extrude |
| `options` | `Partial<ExtrudeOptions>` | See options table |

Returns `THREE.BufferGeometry | null`. Never throws — returns `null` for degenerate input or triangulation failure.

### Input types

```typescript
// Raw polygon points
{ type: 'points'; points: Point2D[] }

// base64-encoded SVG string
{ type: 'svg'; data: string }
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `depth` | `number` | `20` | Extrusion depth along Z axis |
| `depthSegments` | `number` | `4` | Number of side-wall segments along depth |
| `capDensity` | `number` | `5` | Interior Steiner point density (1–20). Higher = more triangles in caps |
| `edgeSubdivisions` | `number` | `2` | Subdivisions per boundary edge |

### Utility exports

```typescript
import { simplifyPath, deduplicatePoints, subdivideBoundary, ensureCCW } from 'tess-extrude';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `simplifyPath` | `(points, tolerance) => Point2D[]` | Douglas-Peucker path simplification |
| `deduplicatePoints` | `(points, eps?) => Point2D[]` | Remove consecutive near-duplicate points |
| `subdivideBoundary` | `(points, subdivisions) => Point2D[]` | Subdivide each edge |
| `ensureCCW` | `(points) => Point2D[]` | Ensure counter-clockwise winding |

## Memory management

Dispose of geometries when no longer needed to free GPU memory:

```typescript
geometry.dispose();
```

For SVG input with multiple paths, all paths are merged into a single geometry automatically.

## Browser / Node compatibility

| Feature | Browser | Node |
|---------|---------|------|
| Points input | ✅ | ✅ |
| SVG input | ✅ | ❌ (requires DOMParser) |

## Development

```bash
npm install
npm run dev      # demo at http://localhost:5173
npm run build    # build library to dist/
npm run test     # run vitest tests
npm run lint     # eslint
```
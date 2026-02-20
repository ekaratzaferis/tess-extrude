import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock SVGLoader before importing extrude to avoid DOMParser in Node
vi.mock('three/examples/jsm/loaders/SVGLoader.js', () => {
  const MockSVGLoader = class {
    parse(_svgString: string) {
      return {
        paths: [
          {
            // SVGLoader.createShapes will be called on this path object
            _mock: true,
          },
        ],
      };
    }

    static createShapes(_path: unknown) {
      return [
        {
          getPoints() {
            return [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 100 },
              { x: 0, y: 100 },
            ];
          },
        },
      ];
    }
  };

  return { SVGLoader: MockSVGLoader };
});

// Import after mock setup
const { extrude } = await import('../../src/extrude.js');

// Minimal valid base64 payload (content doesn't matter — SVGLoader is mocked)
const fakeSvgBase64 = btoa('<svg></svg>');

describe('extrude() — SVG input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a BufferGeometry for a mocked SVG with valid paths', () => {
    const geo = extrude({ type: 'svg', data: fakeSvgBase64 });
    expect(geo).not.toBeNull();
    expect(geo).toBeInstanceOf(THREE.BufferGeometry);
  });

  it('accepts data URI prefix', () => {
    const dataUri = `data:image/svg+xml;base64,${fakeSvgBase64}`;
    const geo = extrude({ type: 'svg', data: dataUri });
    expect(geo).not.toBeNull();
  });
});

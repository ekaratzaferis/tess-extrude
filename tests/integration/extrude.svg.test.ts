import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

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

import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import type { Vector2 } from 'three';
import type { Point2D } from '../types.js';

/**
 * Parse a base64-encoded SVG (with or without data URI prefix) into an array
 * of 2D contour point arrays — one per SVG shape.
 *
 * Requires a browser environment (SVGLoader uses DOMParser internally).
 */
export function fromSVG(data: string): Point2D[][] {
  let svgString: string;

  if (data.startsWith('data:')) {
    const commaIdx = data.indexOf(',');
    svgString = atob(commaIdx >= 0 ? data.slice(commaIdx + 1) : data);
  } else {
    svgString = atob(data);
  }

  const loader = new SVGLoader();
  const svgData = loader.parse(svgString);
  const contours: Point2D[][] = [];

  for (const path of svgData.paths) {
    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes) {
      const pts = shape.getPoints();
      if (pts.length >= 3) {
        contours.push(pts.map((p: Vector2) => ({ x: p.x, y: p.y })));
      }
    }
  }

  return contours;
}

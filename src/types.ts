export interface Point2D {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PointInput {
  type: 'points';
  points: Point2D[];
}

export interface SVGInput {
  type: 'svg';
  /** base64-encoded SVG string, with or without data URI prefix */
  data: string;
}

export type ExtrudeInput = PointInput | SVGInput;

export interface ExtrudeOptions {
  /** Extrusion depth. Default: 20 */
  depth: number;
  /** Number of depth segments for side walls. Default: 4 */
  depthSegments: number;
  /** Cap triangulation density (1–20). Default: 5 */
  capDensity: number;
  /** Number of edge subdivisions for boundary. Default: 2 */
  edgeSubdivisions: number;
}

declare module 'poly2tri' {
  export class Point {
    constructor(x: number, y: number);
    readonly x: number;
    readonly y: number;
  }

  export class Triangle {
    getPoints(): [Point, Point, Point];
  }

  export class SweepContext {
    constructor(contour: Point[]);
    addPoint(point: Point): this;
    triangulate(): this;
    getTriangles(): Triangle[];
  }
}

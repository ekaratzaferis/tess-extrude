declare module 'triangle-wasm' {
  export interface TriangulateIO {
    pointlist: Float64Array;
    segmentlist: Int32Array;
    trianglelist: Uint32Array;
    numberofpoints: number;
    numberofsegments: number;
    numberoftriangles: number;
  }
  export interface Switches {
    pslg?: boolean;
    quality?: number;
    area?: number;
    quiet?: boolean;
    bndMarkers?: boolean;
  }
  const _default: {
    init(wasmPath?: string): Promise<void>;
    makeIO(data?: Partial<TriangulateIO>): TriangulateIO;
    freeIO(io: TriangulateIO, all?: boolean): void;
    triangulate(sw: Switches, input: TriangulateIO, output: TriangulateIO): void;
  };
  export default _default;
}

/** Vite ?url import — resolved to the WASM file's served URL at build/dev time. */
declare module 'triangle-wasm/triangle.out.wasm?url' {
  const url: string;
  export default url;
}

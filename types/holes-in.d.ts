declare module "holes-in" {
    interface Geometry {
        points: number[];
        faces: number[];
        normals: number[];
        uvs: number[];
        uvs2: number[];
        offset: number;
    }

    type Point = { x: number, y: number } | { X: number, Y: number };

    type Path = Point[];

    interface OuterShape {
        path: Path
        depth: number;
    }

    interface Hole {
        path: Path
        depth: number;
    }

    interface Options {
        inMesh: boolean;
        outMesh: boolean;
        frontMesh: boolean;
        backMesh: boolean;
        horizontalMesh: boolean;
        mergeVerticalGeometries: boolean;
        doNotBuild: Path[],
        debug: boolean;
        doNotInvertFrontNormal: boolean;
        invertBackNormal: boolean;
    }

    export function getGeometry(outerShape: OuterShape, holes: Hole[], options?: Partial<Options>): Geometry;

    export function mergeMeshes(geometries: Geometry[]): Geometry;

}

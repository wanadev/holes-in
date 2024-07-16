declare module "holes-in" {
    interface MeshGeometry {
        points: number[];
        faces: number[];
        normals: number[];
        uvs: number[];
        uvs2: number[];
        offset: number;
    }

    interface MeshesGeometries {
        frontMesh?: MeshGeometry;
        backMesh?: MeshGeometry;
        inMesh?: MeshGeometry;
        horizontalMesh?: MeshGeometry;
        outMesh?: MeshGeometry;
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

    export function getGeometry(outerShape: OuterShape, holes: Hole[], options?: Partial<Options>): MeshesGeometries;

    export function mergeMeshes(geometries: MeshGeometry[]): MeshGeometry;

}

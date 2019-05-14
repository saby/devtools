import { IMarker } from "./IMarker";

export interface Item {
    name: string;
    parent?: string;
    child: boolean | null;
    id: string;
    markers?: IMarker[];
}

export interface IFile {
    id: number;
    size: number;
    name: string;
    path: string;
    isBundle?: boolean;
    modules: Set<number>;
}

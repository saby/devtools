export interface IFile {
    id: number;
    size: number;
    name: string;
    isBundle?: boolean;
    modules: Set<number>;
}

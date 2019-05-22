export interface Item {
    name: string;
    parent?: string;
    child: boolean | null;
    id: string;
    isDynamic?: boolean;
}

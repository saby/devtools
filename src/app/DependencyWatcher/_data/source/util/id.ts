const ID_SEPARATOR = ';';

export const createId = (moduleId: string | number, parentId?: string) => {
    return [
        moduleId,
        parentId
    ].join(ID_SEPARATOR);
};

export let getId = (itemId: string) => {
    return itemId.split(ID_SEPARATOR)[0];
};

interface PathItem {
    id: string;
    itemId: string
}
export const getPath = (itemId: string): PathItem[] => {
    const path = itemId.split(ID_SEPARATOR).filter(p => !!p);
    const result: PathItem[] = [];
    while (path.length) {
        const itemId = createId(path.join(ID_SEPARATOR));
        const id = <string> path.pop();
        result.push({ id, itemId });
    }
    return result;
};

export const getParentId = (itemId: string): string | undefined => {
    const path = itemId.split(ID_SEPARATOR);
    if (path.length <= 2) {
        return ;
    }
    path.shift();
    if (path.length == 2) {
        return path[0] + ID_SEPARATOR;
    }
    return path.join(ID_SEPARATOR);
};

export const getMinPath = (first: string, second: string): string => {
    if (!first) {
        return first;
    }
    if (!second) {
        return second
    }
    return first.split(ID_SEPARATOR).length < second.split(ID_SEPARATOR).length? first: second;
};

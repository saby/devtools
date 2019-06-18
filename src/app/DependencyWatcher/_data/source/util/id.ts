const ID_SEPARATOR = ';';

export let createId = (moduleId: string | number, parentId?: string) => {
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
export let getPath = (itemId: string): PathItem[] => {
    const path = itemId.split(ID_SEPARATOR).filter(p => !!p);
    let result: PathItem[] = [];
    while (path.length) {
        let itemId = createId(path.join(ID_SEPARATOR));
        let id = <string> path.pop();
        result.push({ id, itemId });
    }
    return result;
};

export let getParentId = (itemId: string): string | undefined => {
    let path = itemId.split(ID_SEPARATOR);
    if (path.length <= 2) {
        return ;
    }
    path.shift();
    if (path.length == 2) {
        return path[0] + ID_SEPARATOR;
    }
    return path.join(ID_SEPARATOR);
};

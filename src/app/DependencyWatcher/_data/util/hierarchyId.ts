const ID_SEPARATOR = ';';

export const create = (itemId: number, parentId?: string) => {
    return [
        itemId,
        parentId
    ].join(ID_SEPARATOR);
};

const _split = (hierarchyId: string): string[] => {
    return hierarchyId.split(ID_SEPARATOR).filter(key => !!key)
};

export const split = (hierarchyId: string): number[] => {
    return _split(hierarchyId).map(id => +id);
};

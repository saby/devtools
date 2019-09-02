const ID_SEPARATOR = ';';

export function create(itemId: number, parentId?: string): string {
   return [itemId, parentId].join(ID_SEPARATOR);
}

function _split(hierarchyId: string): string[] {
   return hierarchyId.split(ID_SEPARATOR).filter((key) => !!key);
}

export function split(hierarchyId: string): number[] {
   return _split(hierarchyId).map((id) => +id);
}

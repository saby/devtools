const ID_SEPARATOR = ';';

export function create(itemId: number, parentId?: string): string {
   return [itemId, parentId].join(ID_SEPARATOR);
}

function _split(hierarchyId: string): string[] {
   return hierarchyId.split(ID_SEPARATOR).filter((key) => !!key);
}

/**
 * Generates unique id's for nested modules.
 * @author Зайцев А.С.
 */
export function split(hierarchyId: string): number[] {
   return _split(hierarchyId).map((id) => +id);
}

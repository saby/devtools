import { Item as ListItem } from "../List";
import { LeafType } from "../LeafType";

export interface Item extends ListItem {
    type: LeafType;
    // unique?: boolean;
    notUsed?: boolean;
}

export interface ItemFile extends Item {
    type: LeafType.file;
    child: true;
    // size: number;
    notUsed?: false;
}

export interface ItemModule extends Item {
    type: LeafType.module;
    notUsed?: boolean;
}

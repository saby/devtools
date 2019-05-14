import { Item as ListItem } from "../List";
import { LeafType } from "../LeafType";

export interface Item extends ListItem {
    type: LeafType;
    // unique?: boolean;
}

export interface ItemFile extends Item {
    type: LeafType.file;
    child: true;
    // size: number;
}

export interface ItemModule extends Item {
    type: LeafType.module
}

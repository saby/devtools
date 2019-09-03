export enum NodeOptionType {
   ATTRIBUTE,
   OPTION,
   STATE
}

export type NodeOption = number | string | boolean | null | undefined;

export interface IRenderer {
   setNodeOption: (node: object, optionType: NodeOptionType, path: string[], value: NodeOption) => void;
   revertNodeOption: (node: object, optionType: NodeOptionType, path: string[]) => void;
}

export interface IBackendItem {
   id: number;
   parentId: number | null;
   caption: string;
   focusable: boolean;
   tabindex: number;
   labels: string[];
}

export interface IHistoryItem {
   ids: number[];
   caption: string;
}

export interface IFocusElementProps {
   enabled: boolean;
   tabStop: boolean;
   createsContext: boolean;
   tabIndex: number;
   delegateFocusToChildren: boolean;
   tabCycling: boolean;
}

export interface IElementFinder {
   findWithContexts(
      rootElement: Node,
      fromElement: Node,
      reverse?: boolean
   ): HTMLElement | void;
   findFirstInContext(
      contextElement: Node,
      reverse?: boolean
   ): HTMLElement | void;
   getElementProps(element: Node): IFocusElementProps;
}

export type FocusFromLib = (
   element: Element,
   config?: { enableScreenKeyboard: false; enableScrollToElement: false }
) => boolean;

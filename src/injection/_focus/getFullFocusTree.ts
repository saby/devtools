import {
   IBackendItem,
   IElementFinder,
   IFocusElementProps
} from 'Extension/Plugins/Focus/Focus';
import { canAcceptSelfFocus, isBrokenLink } from './Utils';
import { RemovalObserver } from './RemovalObserver';
import { getCaption } from './getCaption';

/**
 * This function collects the following elements:
 * 1) Focusable elements.
 * 2) Elements that create a cycling context.
 * 3) Elements with tabindex < 0.
 * 4) Autofocusable elements.
 * 5) <a> elements without href and tabindex.
 * @author Зайцев А.С.
 */
export function getFullFocusTree(
   elementFinder: IElementFinder,
   removalObserver: RemovalObserver,
   removalCallback: (elem: Element) => void
): Map<Element, IBackendItem> {
   const result: Map<Element, IBackendItem> = new Map();
   let i = 0;

   const addElement = (element: Element, parent?: Element): void => {
      if (
         element.classList.contains('vdom-focus-in') ||
         element.classList.contains('vdom-focus-out')
      ) {
         return;
      }
      const props = elementFinder.getElementProps(element);
      const elementLabels = getLabelsFromElement(element);
      const hasAutofocus: boolean = elementLabels.includes('autofocus');
      if (
         props.tabStop ||
         props.tabCycling ||
         props.tabIndex < 0 ||
         hasAutofocus
      ) {
         const parentId = getParentId(result, parent);

         const item: IBackendItem = {
            id: i++,
            parentId,
            focusable:
               props.tabStop &&
               (canAcceptSelfFocus(element) ||
                  // elements that don't delegate to children are focusable, even when they can't accept focus
                  !props.delegateFocusToChildren),
            caption: getCaption(element),
            tabindex: props.tabIndex,
            labels: elementLabels.concat(getLabelsFromProps(props))
         };
         if (
            item.focusable ||
            props.tabCycling ||
            item.tabindex < 0 ||
            hasAutofocus ||
            item.labels.includes('brokenLink')
         ) {
            result.set(element, item);
            removalObserver.observe(element, removalCallback);
         }
      }
   };

   addElement(document.body);

   walkChildren(document.body, addElement);

   return result;
}

function walkChildren(
   parent: Element,
   callback: (element: Element, parent: Element) => void
): void {
   Array.from(parent.children).forEach((child) => {
      callback(child, parent);
      walkChildren(child, callback);
   });
}

function getParentId(
   items: Map<Element, IBackendItem>,
   startParent?: Element
): IBackendItem['parentId'] {
   if (!startParent) {
      return null;
   }

   let result = null;
   let currentParent: Element | null = startParent;

   while (!result && currentParent && currentParent !== document.body) {
      const parent = items.get(currentParent);
      if (parent) {
         result = parent.id;
      }
      currentParent = currentParent.parentElement;
   }

   return result;
}

function getLabelsFromElement(element: Element): string[] {
   const result: string[] = [];
   const style = window.getComputedStyle(element);

   if (element.getAttribute('ws-autofocus')) {
      result.push('autofocus');
   }

   if (style.display === 'none') {
      result.push('invisible');
   }

   if (style.visibility === 'hidden') {
      result.push('hidden');
   }

   if (isBrokenLink(element)) {
      result.push('brokenLink');
   }

   return result;
}

function getLabelsFromProps(props: IFocusElementProps): string[] {
   const result: string[] = [];

   if (props.tabCycling) {
      result.push('cycle');
   }

   if (props.tabIndex < 0) {
      result.push('focusBlocker');
   }

   return result;
}

/**
 * Generates caption for an element.
 * @author Зайцев А.С.
 */
export function getCaption(element: Element): string {
   return element.classList[0] || element.tagName;
}
